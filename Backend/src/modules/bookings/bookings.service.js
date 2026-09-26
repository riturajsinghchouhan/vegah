import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Booking from '../../models/Booking.js';
import Vehicle from '../../models/Vehicle.js';
import Coupon from '../../models/Coupon.js';
import { bookingQueue } from '../../config/bullmq.js';
import { validateStateTransition } from './bookings.state-machine.js';
import {
  BOOKING_STATUS,
  BATTERY_PACKAGES,
  RESERVATION_TTL_MS,
  RENTAL_REMINDER_LEAD_MS,
  OVERDUE_GRACE_MS,
  LATE_FEE_MULTIPLIER,
  IN_TRIP_STATUSES,
  ACTIVE_BOOKING_STATUSES,
} from './bookings.constants.js';
import { calculateRentalCost, calculateTotalAmount } from '../../utils/pricing.js';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../../utils/errors.js';
import env from '../../config/env.js';
import { getIO } from '../../config/socket.js';
import { sendAdminBookingNotification, notifyUser, notifyAdmins } from '../../services/notification.service.js';
import logger from '../../utils/logger.js';

const generateBookingId = () => {
  return `EVR-${Math.floor(10000 + Math.random() * 90000)}`;
};

/**
 * Writes the derived stock fields onto a vehicle doc. `status` is only ever
 * BOOKED when every unit is taken -- MAINTENANCE/INACTIVE are set by admins and
 * are left untouched.
 */
export const applyStockState = (vehicleDoc, availableStock, totalStock) => {
  const total = totalStock ?? vehicleDoc.totalStock ?? 1;
  const available = Math.max(0, Math.min(total, availableStock));

  vehicleDoc.availableStock = available;
  if (available === 0) {
    vehicleDoc.stockStatus = 'OUT_OF_STOCK';
  } else if (available < 3) {
    vehicleDoc.stockStatus = 'LOW_STOCK';
  } else {
    vehicleDoc.stockStatus = 'IN_STOCK';
  }

  if (!['MAINTENANCE', 'INACTIVE'].includes(vehicleDoc.status)) {
    vehicleDoc.status = available === 0 ? 'BOOKED' : 'AVAILABLE';
  }

  return vehicleDoc;
};

/**
 * Recomputes a vehicle's stock from the bookings that currently hold it, so the
 * counter can never drift out of sync with reality.
 */
export const syncVehicleStock = async (vehicleId, session = null) => {
  const query = Vehicle.findById(vehicleId);
  if (session) query.session(session);
  const vehicleDoc = await query;
  if (!vehicleDoc) return null;

  const countQuery = Booking.countDocuments({
    vehicle: vehicleDoc._id,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  });
  if (session) countQuery.session(session);
  const activeBookings = await countQuery;

  const total = vehicleDoc.totalStock ?? 1;
  applyStockState(vehicleDoc, total - activeBookings, total);
  await vehicleDoc.save(session ? { session } : undefined);
  return vehicleDoc;
};

export const reserveVehicle = async (userId, data) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const startDateFormatted = new Date(data.startDate).toISOString().split('T')[0];
    const endDateFormatted = new Date(data.endDate).toISOString().split('T')[0];
    const startDateTimeStr = `${startDateFormatted}T${data.startTime}:00`;
    const endDateTimeStr = `${endDateFormatted}T${data.endTime}:00`;

    const idempotencyKey = `${userId}:${data.vehicleId}:${startDateTimeStr}`;

    // 1. Check idempotency first (did they just click twice or retry payment?)
    //
    // The key is `user:vehicle:startDateTime`, so it is reused every time the same
    // customer picks the same slot again. Three cases, and only the first is real
    // idempotency:
    //
    //   FINISHED    the previous rental is over or dead -> free the slot, book again.
    //               COMPLETED used to be missing here, which permanently locked a
    //               customer out of re-booking a vehicle they had already rented:
    //               the old COMPLETED booking came back with 201, and the payment
    //               call on it then failed with "Cannot initiate payment for a
    //               booking with status: COMPLETED".
    //   UNPAID      the same attempt being retried (double tap, payment retry)
    //               -> hand the same booking back, which is the point of the key.
    //   IN PROGRESS they already have a live booking for this exact slot -> say so
    //               plainly instead of returning a booking they cannot pay for.
    const existingBooking = await Booking.findOne({ idempotencyKey })
      .select('-kycDocuments')
      .session(session);

    if (existingBooking) {
      const FINISHED = [
        BOOKING_STATUS.COMPLETED,
        BOOKING_STATUS.CANCELLED_BY_USER,
        BOOKING_STATUS.CANCELLED_BY_ADMIN,
        BOOKING_STATUS.CANCELLED_BY_SYSTEM,
        BOOKING_STATUS.RESERVATION_EXPIRED,
        BOOKING_STATUS.PAYMENT_FAILED,
        'CANCELLED',
        'REJECTED',
      ];
      const AWAITING_PAYMENT = [BOOKING_STATUS.RESERVED, BOOKING_STATUS.PAYMENT_INITIATED];

      if (FINISHED.includes(existingBooking.status)) {
        // Park the old key aside so this slot can be booked again.
        existingBooking.idempotencyKey = `${idempotencyKey}_old_${Date.now()}`;
        await existingBooking.save({ session });
      } else if (AWAITING_PAYMENT.includes(existingBooking.status)) {
        await session.abortTransaction();
        // Shaped like the normal response so the client can treat both the same.
        return Booking.findById(existingBooking._id)
          .select('-kycDocuments')
          .populate({ path: 'vehicle', populate: { path: 'zone' } })
          .populate('user', 'fullName phone email');
      } else {
        throw new ConflictError(
          `You already have a booking for this vehicle at this time (${existingBooking.bookingId}, ${existingBooking.status}). Check My Bookings, or pick a different slot.`
        );
      }
    }

    // 2. Fetch the vehicle and check live availability.
    //
    // The gate used to be `findOne({ status: 'AVAILABLE' })`, but `status` is a
    // single flag on a model that carries `totalStock` units. The first booking
    // flipped it to RESERVED/BOOKED and it was only reset to AVAILABLE when a
    // booking ended -- so a vehicle with 9 of 10 units free still rejected every
    // new booking, while the listing APIs (which compute availability from live
    // booking counts) happily advertised it as available. Only MAINTENANCE and
    // INACTIVE are genuine "cannot be booked" states.
    const vehicleDoc = await Vehicle.findOne({
      _id: data.vehicleId,
      deletedAt: null,
      status: { $nin: ['MAINTENANCE', 'INACTIVE'] },
    }).session(session);

    if (!vehicleDoc) {
      throw new ConflictError('Vehicle is not available for booking');
    }

    // Single source of truth for availability, matching vehicles.service.js.
    const activeBookings = await Booking.countDocuments({
      vehicle: vehicleDoc._id,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    }).session(session);

    const totalStock = vehicleDoc.totalStock ?? 1;
    const newAvailableStock = totalStock - activeBookings - 1; // -1 for the booking being made

    if (newAvailableStock < 0) {
      throw new ConflictError('Vehicle is fully booked for this period');
    }

    applyStockState(vehicleDoc, newAvailableStock, totalStock);
    vehicleDoc.__v_lock = (vehicleDoc.__v_lock || 0) + 1;
    await vehicleDoc.save({ session });

    const vehicle = vehicleDoc;

    // 3. Validate Coupon if provided
    let discountAmount = 0;
    let couponObj = null;
    if (data.couponCode) {
      couponObj = await Coupon.findOne({ code: data.couponCode.toUpperCase(), status: 'ACTIVE' });
      if (!couponObj || couponObj.expiryDate < new Date() || couponObj.startDate > new Date()) {
        throw new BadRequestError('Invalid or expired coupon');
      }
      discountAmount = couponObj.type === 'FLAT' ? couponObj.value : 50; 
    }

    // 4. Calculate Pricing Server-Side
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
      paymentMethod: data.paymentMethod || 'ONLINE',
      
      ...pricing,

      kycDocuments: {
        aadharFile: data.aadharFile || null,
        licenseFile: data.licenseFile || null,
        userPhotoFile: data.userPhotoFile || null,
      },

      coupon: couponObj ? couponObj._id : null,
      status: BOOKING_STATUS.RESERVED,
      reservationExpiresAt,
      idempotencyKey,
    }], { session });

    const booking = bookingArray[0];

    await session.commitTransaction();
    
    // Populate booking for socket event and push notification
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'vehicle',
        populate: { path: 'zone' }
      })
      .populate('user', 'fullName phone email');

    // Emit Socket.IO event to admin_room
    try {
      const io = getIO();
      if (io) {
        io.to('admin_room').emit('NEW_BOOKING', populatedBooking || booking);
      }
    } catch (err) {
      // Socket emission error should not fail booking transaction
      console.error('Socket emission error:', err.message);
    }

    // Trigger Firebase FCM Push Notification
    try {
      sendAdminBookingNotification(populatedBooking || booking);
    } catch (err) {
      console.error('Push notification error:', err.message);
    }

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

    // The customer's app never reads kycDocuments back, and those three base64
    // data URLs are several MB. Echoing them doubled the round trip on the slowest
    // request in the whole booking flow, so they are dropped from the response only
    // -- the socket/FCM payloads above still carry them for the admin console.
    const response = (populatedBooking || booking).toObject();
    delete response.kycDocuments;
    return response;
  } catch (error) {
    // Both of these run work after commitTransaction() (socket fan-out, push
    // notifications, re-fetches). A throw from that tail used to reach here and
    // call abortTransaction() on an already-committed session, which raises
    // "Cannot call abortTransaction after calling commitTransaction" and buries
    // the real error behind it.
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Fallback timers used only when BullMQ/Redis is disabled, so a single-process
 * dev server still fires reminders. Keyed by `${bookingId}:${kind}`.
 */
const fallbackTimers = new Map();

const clearFallbackTimer = (key) => {
  const handle = fallbackTimers.get(key);
  if (handle) {
    clearTimeout(handle);
    fallbackTimers.delete(key);
  }
};

const setFallbackTimer = (key, delayMs, fn) => {
  clearFallbackTimer(key);
  if (delayMs <= 0) return;
  const handle = setTimeout(async () => {
    fallbackTimers.delete(key);
    try {
      await fn();
    } catch (err) {
      logger.error(`Fallback timer ${key} failed: ${err.message}`);
    }
  }, delayMs);
  if (typeof handle.unref === 'function') handle.unref();
  fallbackTimers.set(key, handle);
};

/**
 * Drop any pending reminder/overdue work for a booking. Called whenever the
 * deadline moves (extension) or the trip ends.
 */
export const cancelTripJobs = async (bookingId) => {
  const id = String(bookingId);
  clearFallbackTimer(`${id}:reminder`);
  clearFallbackTimer(`${id}:overdue`);

  if (!env.BULLMQ_ENABLED || !bookingQueue) return;
  for (const jobId of [`reminder-${id}`, `overdue-${id}`]) {
    try {
      const job = await bookingQueue.getJob(jobId);
      if (job) await job.remove();
    } catch (err) {
      logger.warn(`Could not remove job ${jobId}: ${err.message}`);
    }
  }
};

/**
 * Queue the "your rental is about to expire" reminder and the follow-up
 * overdue check, both anchored on the booking's live deadline (tripEndsAt).
 */
export const scheduleTripJobs = async (booking) => {
  if (!booking?.tripEndsAt) return;

  const id = String(booking._id);
  await cancelTripJobs(id);

  const deadline = new Date(booking.tripEndsAt).getTime();
  const reminderDelay = deadline - RENTAL_REMINDER_LEAD_MS - Date.now();
  const overdueDelay = deadline + OVERDUE_GRACE_MS - Date.now();

  if (env.BULLMQ_ENABLED && bookingQueue) {
    if (reminderDelay > 0) {
      await bookingQueue.add(
        'rental-reminder',
        { bookingId: id },
        { delay: reminderDelay, jobId: `reminder-${id}` }
      );
    }
    if (overdueDelay > 0) {
      await bookingQueue.add(
        'rental-overdue',
        { bookingId: id },
        { delay: overdueDelay, jobId: `overdue-${id}` }
      );
    }
    return;
  }

  // No queue available - in-process timers keep the flow working in dev.
  const { rentalReminderProcessor, rentalOverdueProcessor } = await import('../../jobs/rentalLifecycle.job.js');
  setFallbackTimer(`${id}:reminder`, reminderDelay, () => rentalReminderProcessor({ data: { bookingId: id } }));
  setFallbackTimer(`${id}:overdue`, overdueDelay, () => rentalOverdueProcessor({ data: { bookingId: id } }));
};

/**
 * Re-arm reminder/overdue work for trips that are already running. Called at
 * boot: with Redis the delayed jobs survive a restart, but the in-process
 * fallback timers do not, and a dropped reminder is invisible until a customer
 * complains.
 */
export const rearmTripJobs = async () => {
  const running = await Booking.find({
    status: { $in: [BOOKING_STATUS.ACTIVE, BOOKING_STATUS.OVERDUE] },
    tripEndsAt: { $ne: null },
  }).select('_id tripEndsAt');

  let armed = 0;
  for (const booking of running) {
    try {
      await scheduleTripJobs(booking);
      armed += 1;
    } catch (err) {
      logger.error(`Failed to re-arm trip jobs for ${booking._id}: ${err.message}`);
    }
  }

  if (armed) logger.info(`Re-armed reminder/overdue jobs for ${armed} running trip(s).`);
  return armed;
};

/**
 * Overtime charge for a late return, billed per started hour at a premium on
 * the hourly rate of the vehicle. Returns 0 when it came back on time.
 */
const calculateLateFee = (booking, returnedAt) => {
  const deadline = booking.tripEndsAt || booking.endDate;
  if (!deadline) return 0;

  const overtimeMs = returnedAt.getTime() - new Date(deadline).getTime();
  if (overtimeMs <= OVERDUE_GRACE_MS) return 0;

  const hourlyRate = booking.vehicle?.pricePerHour || 0;
  if (!hourlyRate) return 0;

  const overtimeHours = Math.ceil(overtimeMs / (1000 * 60 * 60));
  return Math.round(overtimeHours * hourlyRate * LATE_FEE_MULTIPLIER);
};

/**
 * Side effects that belong outside the DB transaction: sockets, push
 * notifications and background jobs. Never throws.
 */
const publishStatusChange = async (booking, oldStatus, newStatus) => {
  const userIdStr = booking.user?._id ? booking.user._id.toString() : String(booking.user);

  try {
    const io = getIO();
    if (io) {
      io.to(`user_${userIdStr}`).emit('BOOKING_STATUS_UPDATED', booking);
      io.to('admin_room').emit('BOOKING_STATUS_UPDATED', booking);
    }
  } catch (err) {
    logger.error(`Socket emission error on status update: ${err.message}`);
  }

  try {
    switch (newStatus) {
      case BOOKING_STATUS.CONFIRMED:
        await notifyUser({
          userId: userIdStr,
          title: 'Booking approved',
          body: `Booking ${booking.bookingId} is approved. Head to ${booking.pickupLocation} to collect your EV.`,
          referenceId: booking._id,
          event: 'BOOKING_CONFIRMED',
          data: { bookingId: booking.bookingId, status: newStatus },
        });
        break;

      case BOOKING_STATUS.ACTIVE:
        if (oldStatus === BOOKING_STATUS.PENDING_RETURN) {
          await notifyUser({
            userId: userIdStr,
            title: 'Return not verified',
            body: `The hub team could not verify the return of ${booking.bookingId}. Your trip is still running.`,
            referenceId: booking._id,
            event: 'RETURN_REJECTED',
            data: { bookingId: booking.bookingId, status: newStatus },
          });
        } else if (oldStatus === BOOKING_STATUS.OVERDUE) {
          // An extension pushed the deadline back into the future.
          await notifyUser({
            userId: userIdStr,
            title: 'Rental extended',
            body: `Booking ${booking.bookingId} is no longer overdue. New return time: ${new Date(booking.tripEndsAt).toLocaleString('en-IN')}.`,
            referenceId: booking._id,
            event: 'TRIP_EXTENDED',
            data: { bookingId: booking.bookingId, status: newStatus, tripEndsAt: booking.tripEndsAt },
          });
        } else {
          await notifyUser({
            userId: userIdStr,
            title: 'Trip started',
            body: `Pickup confirmed. Your rental ends at ${new Date(booking.tripEndsAt).toLocaleString('en-IN')}.`,
            referenceId: booking._id,
            event: 'TRIP_STARTED',
            data: { bookingId: booking.bookingId, status: newStatus, tripEndsAt: booking.tripEndsAt },
          });
        }
        break;

      case BOOKING_STATUS.PENDING_RETURN:
        await notifyAdmins({
          event: 'RETURN_REQUESTED',
          title: 'Vehicle returned - verification needed',
          body: `${booking.user?.fullName || 'A customer'} has dropped ${booking.vehicle?.name || 'an EV'} for booking ${booking.bookingId}.`,
          payload: { bookingId: booking.bookingId, id: String(booking._id), status: newStatus },
        });
        await notifyUser({
          userId: userIdStr,
          title: 'Return submitted',
          body: `We have told the hub team about your drop. Booking ${booking.bookingId} closes once they verify the vehicle.`,
          referenceId: booking._id,
          event: 'RETURN_SUBMITTED',
          data: { bookingId: booking.bookingId, status: newStatus },
        });
        break;

      case BOOKING_STATUS.COMPLETED:
        await notifyUser({
          userId: userIdStr,
          title: 'Rental completed',
          body: booking.lateFee > 0
            ? `Booking ${booking.bookingId} is closed. A late fee of Rs ${booking.lateFee} was applied.`
            : `Booking ${booking.bookingId} is closed. Thanks for riding with us!`,
          referenceId: booking._id,
          event: 'TRIP_COMPLETED',
          data: { bookingId: booking.bookingId, status: newStatus, lateFee: booking.lateFee || 0 },
        });
        break;

      case BOOKING_STATUS.OVERDUE:
        await notifyUser({
          userId: userIdStr,
          title: 'Rental overdue',
          body: `Booking ${booking.bookingId} has passed its return time. Please return the EV to avoid further charges.`,
          referenceId: booking._id,
          event: 'TRIP_OVERDUE',
          data: { bookingId: booking.bookingId, status: newStatus },
        });
        break;

      default:
        break;
    }
  } catch (err) {
    logger.error(`Notification error on status update: ${err.message}`);
  }

  // Background work follows the deadline: start it when the trip starts, drop it when the trip ends.
  try {
    if (newStatus === BOOKING_STATUS.ACTIVE && oldStatus === BOOKING_STATUS.CONFIRMED) {
      await scheduleTripJobs(booking);
    } else if (!IN_TRIP_STATUSES.includes(newStatus)) {
      await cancelTripJobs(booking._id);
    }
  } catch (err) {
    logger.error(`Trip job scheduling error: ${err.message}`);
  }
};

export const handleStatusTransition = async (bookingId, newStatus, options = {}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Without -kycDocuments this pulls several MB of base64 on every transition.
    // Mongoose only writes modified paths on save(), so the field is untouched.
    const booking = await Booking.findById(bookingId)
      .select('-kycDocuments')
      .populate('vehicle')
      .session(session);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status === newStatus) {
      await session.abortTransaction();
      session.endSession();
      return booking; // Idempotent: already in the desired state
    }

    // Validate state machine
    validateStateTransition(booking.status, newStatus);

    const oldStatus = booking.status;
    const now = new Date();
    booking.status = newStatus;

    if (options.cancellationReason) booking.cancellationReason = options.cancellationReason;
    if (options.cancelledBy) booking.cancelledBy = options.cancelledBy;
    if (options.notes) booking.notes = options.notes;

    // --- Lifecycle timestamps ---
    if (newStatus === BOOKING_STATUS.ACTIVE && oldStatus === BOOKING_STATUS.CONFIRMED) {
      // Physical handover: the trip clock starts now, not at the booked start time.
      const bookedDurationMs = new Date(booking.endDate) - new Date(booking.startDate);
      const durationMs = bookedDurationMs > 0 ? bookedDurationMs : 60 * 60 * 1000;
      booking.actualPickupAt = now;
      booking.tripEndsAt = new Date(now.getTime() + durationMs);
      booking.depositStatus = 'COLLECTED';
      if (options.adminId) booking.pickupConfirmedBy = options.adminId;
    }

    if (newStatus === BOOKING_STATUS.PENDING_RETURN) {
      booking.returnRequestedAt = now;
    }

    if (newStatus === BOOKING_STATUS.ACTIVE && oldStatus === BOOKING_STATUS.PENDING_RETURN) {
      // Admin rejected the return - the trip resumes, so clear the drop claim.
      booking.returnRequestedAt = null;
    }

    if (newStatus === BOOKING_STATUS.COMPLETED) {
      booking.actualReturnAt = now;
      booking.lateFee = calculateLateFee(booking, now);
      booking.depositStatus = options.depositStatus || 'REFUNDED';
      if (options.adminId) booking.returnConfirmedBy = options.adminId;
    }

    if (newStatus.includes('CANCELLED') || newStatus === BOOKING_STATUS.RESERVATION_EXPIRED) {
      booking.cancelledAt = now;
    }

    booking.statusHistory.push({
      status: newStatus,
      at: now,
      by: options.actorRole || options.cancelledBy || 'SYSTEM',
      note: options.note || options.notes || null,
    });

    // Save the booking first so the stock recount below sees its new status.
    await booking.save({ session });

    // --- Vehicle state effects ---
    // Recomputed from the bookings that actually hold the vehicle rather than
    // incremented/decremented by hand: the old +1/-1 arithmetic drifted whenever
    // a transition was missed, and it pinned `status` to BOOKED even when other
    // units were still free, which made the vehicle unbookable for everyone.
    const targetVehicleId = booking.vehicle?._id || booking.vehicle;
    await syncVehicleStock(targetVehicleId, session);

    await session.commitTransaction();

    // Populate updated booking for notifications
    // The admin console merges socket updates with `{ ...row, ...payload }`, so an
    // absent kycDocuments key leaves the row's existing images in place.
    const updatedBooking = await Booking.findById(booking._id)
      .select('-kycDocuments')
      .populate({
        path: 'vehicle',
        populate: { path: 'zone' }
      })
      .populate('user', 'fullName phone email');

    await publishStatusChange(updatedBooking || booking, oldStatus, newStatus);

    return updatedBooking || booking;
  } catch (error) {
    // Both of these run work after commitTransaction() (socket fan-out, push
    // notifications, re-fetches). A throw from that tail used to reach here and
    // call abortTransaction() on an already-committed session, which raises
    // "Cannot call abortTransaction after calling commitTransaction" and buries
    // the real error behind it.
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Step 4 of the rental flow: the admin has physically handed the vehicle over.
 * This is the only way a booking becomes ACTIVE - a user cannot start their
 * own trip.
 */
export const confirmPickup = async (bookingId, adminId, options = {}) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError('Booking not found');

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new BadRequestError(
      `Pickup can only be confirmed for an approved booking. Current status: ${booking.status}`
    );
  }

  return handleStatusTransition(bookingId, BOOKING_STATUS.ACTIVE, {
    adminId,
    actorRole: 'ADMIN',
    note: options.note || 'Pickup verified at hub',
  });
};

/**
 * Step 7 of the rental flow: the user declares they have dropped the vehicle.
 * This does NOT close the booking - it parks it in PENDING_RETURN until an
 * admin verifies the vehicle is actually back.
 */
export const requestReturn = async (bookingId, userId, options = {}) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError('Booking not found');

  if (booking.user.toString() !== userId) {
    throw new ForbiddenError('Not allowed to return this booking');
  }

  if (![BOOKING_STATUS.ACTIVE, BOOKING_STATUS.OVERDUE].includes(booking.status)) {
    throw new BadRequestError(`Cannot return a booking with status: ${booking.status}`);
  }

  return handleStatusTransition(bookingId, BOOKING_STATUS.PENDING_RETURN, {
    actorRole: 'USER',
    note: options.note || 'User reported drop-off at hub',
  });
};

/**
 * Step 9 of the rental flow: the admin has the vehicle in hand and closes the
 * trip. Settles the late fee and deposit, and frees the vehicle.
 */
export const confirmReturn = async (bookingId, adminId, options = {}) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError('Booking not found');

  const returnable = [
    BOOKING_STATUS.PENDING_RETURN,
    BOOKING_STATUS.ACTIVE,
    BOOKING_STATUS.OVERDUE,
  ];
  if (!returnable.includes(booking.status)) {
    throw new BadRequestError(`Cannot complete a booking with status: ${booking.status}`);
  }

  return handleStatusTransition(bookingId, BOOKING_STATUS.COMPLETED, {
    adminId,
    actorRole: 'ADMIN',
    depositStatus: options.depositStatus,
    note: options.note || 'Return verified at hub',
  });
};

/**
 * Admin could not find the vehicle at the hub - push the booking back to a
 * running trip so the user (and the overdue clock) stay accountable.
 */
export const rejectReturn = async (bookingId, adminId, options = {}) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError('Booking not found');

  if (booking.status !== BOOKING_STATUS.PENDING_RETURN) {
    throw new BadRequestError(`No pending return to reject. Current status: ${booking.status}`);
  }

  const alreadyPastDeadline = booking.tripEndsAt && new Date(booking.tripEndsAt) < new Date();
  return handleStatusTransition(
    bookingId,
    alreadyPastDeadline ? BOOKING_STATUS.OVERDUE : BOOKING_STATUS.ACTIVE,
    {
      adminId,
      actorRole: 'ADMIN',
      note: options.note || 'Return could not be verified',
    }
  );
};

export const listBookings = async (query) => {
  const { page = 1, limit = 20, status, userId, vehicleId, ops, depositStatus } = query;
  
  const filter = {};
  
  if (status) {
    // Handle frontend mapped statuses or comma-separated raw statuses
    if (status === 'pending_approval') {
      filter.status = 'PENDING_VERIFICATION';
    } else {
      const statuses = String(status).split(',').map((part) => part.trim()).filter(Boolean);
      filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
    }
  }
  
  if (ops) {
    const now = new Date();
    switch (ops) {
      case 'live':
        filter.status = { $in: ['ACTIVE', 'OVERDUE', 'PENDING_RETURN'] };
        break;
      case 'pickups':
        filter.status = { $in: ['CONFIRMED', 'PENDING', 'RESERVED', 'PENDING_VERIFICATION'] };
        break;
      case 'returns':
        filter.status = 'ACTIVE';
        filter.tripEndsAt = { $gte: now }; // active but not yet overdue
        break;
      case 'late':
        filter.status = 'OVERDUE';
        break;
      case 'extensions':
        // extensions might not be a standalone status, but let's assume PENDING_RETURN could be related, or something else.
        // There is no explicit EXTENSION status. We can filter for bookings that have been extended if there is a way, 
        // or just show OVERDUE or something. Let's return ACTIVE/OVERDUE for now.
        filter.status = { $in: ['ACTIVE', 'OVERDUE'] };
        break;
      case 'cancelled':
        filter.status = { $in: ['CANCELLED', 'CANCELLED_BY_USER', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_SYSTEM', 'REJECTED', 'RESERVATION_EXPIRED'] };
        break;
    }
  }

  if (depositStatus) {
    if (depositStatus === 'pending_collection') {
      filter.depositStatus = 'PENDING';
    } else {
      filter.depositStatus = depositStatus;
    }
  }
  
  if (userId) filter.user = userId;
  if (vehicleId) filter.vehicle = vehicleId;

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      // Each booking carries ~2MB of base64 KYC images, so 8 rows was a 15.7MB
      // response that took 5s and blew past the client's HTTP timeout -- the
      // admin bookings list simply never rendered. The images are fetched
      // on demand from GET /bookings/:id when a booking is opened.
      .select('-kycDocuments')
      .populate({
        path: 'vehicle',
        populate: { path: 'zone' }
      })
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
    .populate({
      path: 'vehicle',
      populate: { path: 'zone' }
    })
    .populate('user', 'fullName phone email isVerified')
    .populate('coupon');

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }
  return booking;
};

export const getLiveBookingStatus = async (id, userId) => {
  const booking = await Booking.findById(id)
    .populate({
      path: 'vehicle',
      select: 'name plateNumber images batteryLevel status pricePerHour zone',
      populate: { path: 'zone' },
    })
    .populate('user', 'fullName phone');

  if (!booking) throw new NotFoundError('Booking not found');

  // Users can only see their own booking
  if (userId && booking.user._id.toString() !== userId) {
    throw new ForbiddenError('Not allowed to view this booking');
  }

  const now = new Date();
  const hasStarted = Boolean(booking.actualPickupAt);

  // Before handover the timer is only a preview of the booked window; once the
  // admin confirms pickup it runs on the real trip clock.
  const startsAt = hasStarted ? new Date(booking.actualPickupAt) : new Date(booking.startDate);
  const endsAt = hasStarted && booking.tripEndsAt
    ? new Date(booking.tripEndsAt)
    : new Date(booking.endDate);

  const totalDurationMs = Math.max(0, endsAt - startsAt);
  const elapsedMs = hasStarted ? Math.max(0, now - startsAt) : 0;
  const remainingMs = hasStarted ? Math.max(0, endsAt - now) : totalDurationMs;

  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const remainingSecs = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const pad = (n) => String(n).padStart(2, '0');

  return {
    id: booking._id,
    bookingId: booking.bookingId,
    status: booking.status,
    vehicle: booking.vehicle,
    startDate: booking.startDate,
    endDate: booking.endDate,
    actualPickupAt: booking.actualPickupAt,
    tripEndsAt: booking.tripEndsAt,
    returnRequestedAt: booking.returnRequestedAt,
    actualReturnAt: booking.actualReturnAt,
    pickupLocation: booking.pickupLocation,
    dropLocation: booking.vehicle?.zone?.dropLocation?.address || booking.pickupLocation,
    statusHistory: booking.statusHistory,
    timer: {
      hasStarted,
      startsAt,
      endsAt,
      totalDurationMs,
      elapsedMs,
      remainingMs,
      remainingFormatted: `${pad(remainingHours)}:${pad(remainingMins)}:${pad(remainingSecs)}`,
      // Only a started trip can run late.
      isExpiringSoon: hasStarted && remainingMs > 0 && remainingMs <= RENTAL_REMINDER_LEAD_MS,
      isOverdue: hasStarted && now > endsAt,
    },
    pricing: {
      total: booking.totalAmount,
      rentalBase: booking.rentalBase,
      batteryPackageFee: booking.batteryPackageFee,
      securityDeposit: booking.securityDeposit,
      lateFee: booking.lateFee || 0,
      depositStatus: booking.depositStatus,
    },
  };
};

export const extendBooking = async (bookingId, userId, extraHours) => {
  const booking = await Booking.findById(bookingId).populate('vehicle');
  if (!booking) throw new NotFoundError('Booking not found');

  if (booking.user.toString() !== userId) {
    throw new ForbiddenError('Not allowed to extend this booking');
  }

  const extendable = [
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.ACTIVE,
    BOOKING_STATUS.OVERDUE,
  ];
  if (!extendable.includes(booking.status)) {
    throw new BadRequestError(`Cannot extend a booking with status: ${booking.status}`);
  }

  if (!extraHours || extraHours < 1 || extraHours > 24) {
    throw new BadRequestError('Extra hours must be between 1 and 24');
  }

  const extraMs = extraHours * 60 * 60 * 1000;
  const extensionCost = (booking.vehicle.pricePerHour || 0) * extraHours;

  const newEndDate = new Date(new Date(booking.endDate).getTime() + extraMs);
  booking.endDate = newEndDate;
  booking.totalAmount = (booking.totalAmount || 0) + extensionCost;

  // A started trip runs on tripEndsAt, so that is the deadline the extension
  // has to move for the timer and the reminder to follow.
  let newTripEndsAt = null;
  if (booking.tripEndsAt) {
    newTripEndsAt = new Date(new Date(booking.tripEndsAt).getTime() + extraMs);
    booking.tripEndsAt = newTripEndsAt;
    // The new deadline is in the future again, so the user deserves a fresh reminder.
    booking.reminderSentAt = null;
  }

  booking.statusHistory.push({
    status: booking.status,
    at: new Date(),
    by: 'USER',
    note: `Extended by ${extraHours}h`,
  });

  await booking.save();

  // An extension past the deadline should also lift an OVERDUE flag.
  if (booking.status === BOOKING_STATUS.OVERDUE && newTripEndsAt && newTripEndsAt > new Date()) {
    await handleStatusTransition(bookingId, BOOKING_STATUS.ACTIVE, {
      actorRole: 'USER',
      note: 'Rental extended past the overdue deadline',
    });
  }

  // Re-arm the reminder/overdue jobs against the new deadline.
  if (newTripEndsAt) {
    try {
      await scheduleTripJobs(booking);
    } catch (err) {
      logger.error(`Failed to reschedule trip jobs after extension: ${err.message}`);
    }
  }

  const updated = await Booking.findById(bookingId)
    .populate({ path: 'vehicle', populate: { path: 'zone' } })
    .populate('user', 'fullName phone email');

  try {
    const io = getIO();
    if (io) {
      io.to(`user_${userId}`).emit('BOOKING_STATUS_UPDATED', updated);
      io.to('admin_room').emit('BOOKING_STATUS_UPDATED', updated);
    }
  } catch (err) {
    logger.error(`Socket emission error on extension: ${err.message}`);
  }

  return { booking: updated || booking, extensionCost, newEndDate, newTripEndsAt };
};
