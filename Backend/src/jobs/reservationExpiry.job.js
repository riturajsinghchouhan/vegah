import { handleStatusTransition } from '../modules/bookings/bookings.service.js';
import { BOOKING_STATUS } from '../modules/bookings/bookings.constants.js';
import logger from '../utils/logger.js';
import Booking from '../models/Booking.js';

export const reservationExpiryProcessor = async (job) => {
  const { bookingId } = job.data;
  
  try {
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      logger.warn(`Job reservation-expiry: Booking ${bookingId} not found`);
      return;
    }

    // Only expire if it's still in RESERVED or PENDING_VERIFICATION state
    if ([BOOKING_STATUS.RESERVED, BOOKING_STATUS.PENDING_VERIFICATION].includes(booking.status)) {
      logger.info(`Job reservation-expiry: Expiring booking ${bookingId}`);
      await handleStatusTransition(bookingId, BOOKING_STATUS.RESERVATION_EXPIRED, {
        cancellationReason: 'Payment not completed in time',
        cancelledBy: 'SYSTEM'
      });
    } else {
      logger.debug(`Job reservation-expiry: Booking ${bookingId} is already in state ${booking.status}, skipping expiry`);
    }
  } catch (error) {
    logger.error(`Job reservation-expiry failed for ${bookingId}: ${error.message}`);
    throw error;
  }
};
