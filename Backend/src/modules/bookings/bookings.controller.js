import * as bookingsService from './bookings.service.js';
import { sendSuccess } from '../../utils/response.js';
import { ForbiddenError } from '../../utils/errors.js';

export const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingsService.reserveVehicle(req.user.id, req.body);
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
