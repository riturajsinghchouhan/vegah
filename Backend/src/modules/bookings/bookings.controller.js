import * as bookingsService from './bookings.service.js';
import { sendSuccess } from '../../utils/response.js';
import { ForbiddenError } from '../../utils/errors.js';
import { getIO } from '../../config/socket.js';

export const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingsService.reserveVehicle(req.user.id, req.body);
    
    // Notify admins about the new booking
    try {
      const io = getIO();
      io.to('admin_room').emit('NEW_BOOKING', booking);
    } catch (ioErr) {
      console.error('Socket emit error (NEW_BOOKING):', ioErr);
    }

    sendSuccess(res, 201, 'Vehicle reserved successfully. Please complete KYC and payment.', booking);
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, cancellationReason } = req.body;
    
    // Ensure regular users can only cancel their own bookings
    if (req.user.role === 'USER') {
      const existing = await bookingsService.getBookingById(id);
      if (existing.user._id.toString() !== req.user.id) {
        throw new ForbiddenError('Not allowed');
      }
      if (status !== 'CANCELLED_BY_USER' && status !== 'PENDING_VERIFICATION') {
        throw new ForbiddenError('Users can only cancel or submit KYC');
      }
    }

    const options = { notes, cancellationReason };
    if (status === 'CANCELLED_BY_USER') options.cancelledBy = 'USER';
    if (status === 'CANCELLED_BY_ADMIN') options.cancelledBy = 'ADMIN';

    const booking = await bookingsService.handleStatusTransition(id, status, options);
    sendSuccess(res, 200, `Booking status updated to ${status}`, booking);
  } catch (error) {
    next(error);
  }
};

export const listBookings = async (req, res, next) => {
  try {
    // If regular user, force their own userId in the query
    if (req.user.role === 'USER') {
      req.query.userId = req.user.id;
    }

    const result = await bookingsService.listBookings(req.query);
    sendSuccess(res, 200, 'Bookings fetched successfully', result.bookings, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingsService.getBookingById(req.params.id);
    
    if (req.user.role === 'USER' && booking.user._id.toString() !== req.user.id) {
      throw new ForbiddenError('Not allowed to view this booking');
    }

    sendSuccess(res, 200, 'Booking fetched successfully', booking);
  } catch (error) {
    next(error);
  }
};

export const getLiveStatus = async (req, res, next) => {
  try {
    const userId = req.user.role === 'USER' ? req.user.id : null;
    const data = await bookingsService.getLiveBookingStatus(req.params.id, userId);
    sendSuccess(res, 200, 'Live booking status fetched', data);
  } catch (error) {
    next(error);
  }
};

export const extendBooking = async (req, res, next) => {
  try {
    const { extraHours } = req.body;
    const result = await bookingsService.extendBooking(req.params.id, req.user.id, extraHours);
    sendSuccess(res, 200, `Booking extended by ${extraHours} hours`, result);
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN — step 4: confirm the customer has physically collected the vehicle.
 * This is what starts the trip timer.
 */
export const confirmPickup = async (req, res, next) => {
  try {
    const booking = await bookingsService.confirmPickup(req.params.id, req.user.id, {
      note: req.body?.note,
    });
    sendSuccess(res, 200, 'Pickup confirmed. Trip started.', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * USER — step 7: declare the vehicle has been dropped at the hub. Parks the
 * booking in PENDING_RETURN awaiting admin verification.
 */
export const requestReturn = async (req, res, next) => {
  try {
    const booking = await bookingsService.requestReturn(req.params.id, req.user.id, {
      note: req.body?.note,
    });
    sendSuccess(res, 200, 'Return submitted. Awaiting hub verification.', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN — step 9: verify the vehicle is back and close the rental.
 */
export const confirmReturn = async (req, res, next) => {
  try {
    const booking = await bookingsService.confirmReturn(req.params.id, req.user.id, {
      note: req.body?.note,
      depositStatus: req.body?.depositStatus,
    });
    sendSuccess(res, 200, 'Return verified. Rental completed.', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN — the claimed return could not be verified; send the trip back to running.
 */
export const rejectReturn = async (req, res, next) => {
  try {
    const booking = await bookingsService.rejectReturn(req.params.id, req.user.id, {
      note: req.body?.note,
    });
    sendSuccess(res, 200, 'Return rejected. Trip resumed.', booking);
  } catch (error) {
    next(error);
  }
};
