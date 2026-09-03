import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Booking from '../../models/Booking.js';
import Vehicle from '../../models/Vehicle.js';
import Coupon from '../../models/Coupon.js';
import { bookingQueue } from '../../config/bullmq.js';
import { validateStateTransition } from './bookings.state-machine.js';
import { BOOKING_STATUS, BATTERY_PACKAGES, RESERVATION_TTL_MS } from './bookings.constants.js';
import { calculateRentalCost, calculateTotalAmount } from '../../utils/pricing.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors.js';
import env from '../../config/env.js';

const generateBookingId = () => {
  return `EVR-${Math.floor(10000 + Math.random() * 90000)}`;
};

export const reserveVehicle = async (userId, data) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Fetch Vehicle with Optimistic Locking Check
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: data.vehicleId, status: 'AVAILABLE' },
      { $set: { status: 'RESERVED' }, $inc: { __v_lock: 1 } },
      { session, new: true }
    );

    if (!vehicle) {
      throw new ConflictError('Vehicle is no longer available');
    }

    // 2. Validate Coupon if provided
    let discountAmount = 0;
    let couponObj = null;
    if (data.couponCode) {
      couponObj = await Coupon.findOne({ code: data.couponCode.toUpperCase(), status: 'ACTIVE' });
      if (!couponObj || couponObj.expiryDate < new Date() || couponObj.startDate > new Date()) {
        throw new BadRequestError('Invalid or expired coupon');
      }
      // Note: Full coupon logic (min amount, percentage vs flat) should be applied here. 
      // Simplified for brevity, assume flat 50 discount
      discountAmount = couponObj.type === 'FLAT' ? couponObj.value : 50; 
    }

    // 3. Calculate Pricing Server-Side
    // We combine the date and time strings properly
    const startDateTimeStr = `${data.startDate.split('T')[0]}T${data.startTime}:00`;
    const endDateTimeStr = `${data.endDate.split('T')[0]}T${data.endTime}:00`;

    const rentalBase = calculateRentalCost(
      vehicle.pricePerHour, 
      vehicle.pricePerDay, 
      startDateTimeStr, 
      endDateTimeStr, 
      data.rentalType
    );

    const batteryPackage = BATTERY_PACKAGES[data.batteryPackage] || BATTERY_PACKAGES.SINGLE;

    const pricing = calculateTotalAmount({
      rentalBase,
      batteryPackagePrice: batteryPackage.price,
      securityDeposit: vehicle.securityDeposit,
      discountAmount
    });

    const idempotencyKey = `${userId}:${vehicle._id}:${startDateTimeStr}`;

    // Check idempotency (did they just click twice?)
    const existingBooking = await Booking.findOne({ idempotencyKey }).session(session);
    if (existingBooking) {
      await session.abortTransaction();
      session.endSession();
      return existingBooking;
    }

    // 4. Create Reservation
    const reservationExpiresAt = new Date(Date.now() + RESERVATION_TTL_MS);

    const bookingArray = await Booking.create([{
      bookingId: generateBookingId(),
      user: userId,
      vehicle: vehicle._id,
      rentalType: data.rentalType,
      startDate: new Date(startDateTimeStr),
      startTime: data.startTime,
      endDate: new Date(endDateTimeStr),
      endTime: data.endTime,
      pickupLocation: data.pickupLocation,
      batteryPackage: data.batteryPackage,
      
      ...pricing,

      coupon: couponObj ? couponObj._id : null,
      status: BOOKING_STATUS.RESERVED,
      reservationExpiresAt,
      idempotencyKey,
    }], { session });

    const booking = bookingArray[0];

    await session.commitTransaction();
    
    // 5. Enqueue Expiry Job (Fire and forget, out of transaction)
    if (env.BULLMQ_ENABLED && bookingQueue) {
      await bookingQueue.add(
        'reservation-expiry',
        { bookingId: booking._id.toString() },
        { delay: RESERVATION_TTL_MS, jobId: `expiry-${booking._id.toString()}` }
      );
    } else {
      // Fallback if no queue: setTimeout (not ideal for production distributed systems)
      setTimeout(async () => {
        try {
          const b = await Booking.findById(booking._id);
          if (b && b.status === BOOKING_STATUS.RESERVED) {
            await handleStatusTransition(booking._id.toString(), BOOKING_STATUS.RESERVATION_EXPIRED, {
              cancellationReason: 'Payment not completed in time',
              cancelledBy: 'SYSTEM'
            });
          }
        } catch (e) {
          console.error('Fallback expiry failed', e);
        }
      }, RESERVATION_TTL_MS);
    }

    return booking;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const handleStatusTransition = async (bookingId, newStatus, options = {}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session);
    
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Validate state machine
    validateStateTransition(booking.status, newStatus);

    const oldStatus = booking.status;
    booking.status = newStatus;

    if (options.cancellationReason) booking.cancellationReason = options.cancellationReason;
    if (options.cancelledBy) booking.cancelledBy = options.cancelledBy;
    if (options.notes) booking.notes = options.notes;

    // Handle Vehicle State effects
    if (
      newStatus === BOOKING_STATUS.RESERVATION_EXPIRED ||
      newStatus === BOOKING_STATUS.CANCELLED_BY_USER ||
      newStatus === BOOKING_STATUS.CANCELLED_BY_ADMIN ||
      newStatus === BOOKING_STATUS.CANCELLED_BY_SYSTEM ||
      newStatus === BOOKING_STATUS.PAYMENT_FAILED ||
      newStatus === BOOKING_STATUS.COMPLETED
    ) {
      // Release vehicle
      await Vehicle.updateOne(
        { _id: booking.vehicle },
        { $set: { status: 'AVAILABLE' } },
        { session }
      );
    } else if (newStatus === BOOKING_STATUS.CONFIRMED) {
      // Confirm booking -> Vehicle goes from RESERVED to BOOKED
      await Vehicle.updateOne(
        { _id: booking.vehicle },
        { $set: { status: 'BOOKED' } },
        { session }
      );
    }

    if (newStatus.includes('CANCELLED') || newStatus === BOOKING_STATUS.RESERVATION_EXPIRED) {
      booking.cancelledAt = new Date();
    }
    
    if (newStatus === BOOKING_STATUS.COMPLETED) {
      booking.actualReturnAt = new Date();
    }

    await booking.save({ session });
    await session.commitTransaction();
    return booking;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const listBookings = async (query) => {
  const { page = 1, limit = 20, status, userId, vehicleId } = query;
  
  const filter = {};
  if (status) filter.status = status;
  if (userId) filter.user = userId;
  if (vehicleId) filter.vehicle = vehicleId;

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('vehicle', 'name plateNumber images')
      .populate('user', 'fullName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter)
  ]);

  return {
    bookings,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getBookingById = async (id) => {
  const booking = await Booking.findById(id)
    .populate('vehicle')
    .populate('user', 'fullName phone email isVerified')
    .populate('coupon');

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }
  return booking;
};
