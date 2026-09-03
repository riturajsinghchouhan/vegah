import { BOOKING_STATUS, RENTAL_TYPES, BATTERY_PACKAGES } from './bookings.constants.js';
import { BadRequestError } from '../../utils/errors.js';

/**
 * Ensures that a booking can only transition to valid states
 */
export const validateStateTransition = (currentStatus, newStatus) => {
  const allowedTransitions = {
    [BOOKING_STATUS.RESERVED]: [
      BOOKING_STATUS.PENDING_VERIFICATION,
      BOOKING_STATUS.RESERVATION_EXPIRED,
      BOOKING_STATUS.CANCELLED_BY_USER,
      BOOKING_STATUS.CANCELLED_BY_ADMIN
    ],
    [BOOKING_STATUS.PENDING_VERIFICATION]: [
      BOOKING_STATUS.PAYMENT_INITIATED,
      BOOKING_STATUS.RESERVATION_EXPIRED,
      BOOKING_STATUS.CANCELLED_BY_USER,
      BOOKING_STATUS.CANCELLED_BY_ADMIN
    ],
    [BOOKING_STATUS.PAYMENT_INITIATED]: [
      BOOKING_STATUS.CONFIRMED,
      BOOKING_STATUS.PAYMENT_FAILED,
      BOOKING_STATUS.RESERVATION_EXPIRED,
      BOOKING_STATUS.CANCELLED_BY_USER,
      BOOKING_STATUS.CANCELLED_BY_ADMIN
    ],
    [BOOKING_STATUS.CONFIRMED]: [
      BOOKING_STATUS.ACTIVE,
      BOOKING_STATUS.CANCELLED_BY_USER,
      BOOKING_STATUS.CANCELLED_BY_ADMIN
    ],
    [BOOKING_STATUS.ACTIVE]: [
      BOOKING_STATUS.COMPLETED,
      BOOKING_STATUS.OVERDUE,
      BOOKING_STATUS.CANCELLED_BY_ADMIN
    ],
    [BOOKING_STATUS.OVERDUE]: [
      BOOKING_STATUS.COMPLETED,
      BOOKING_STATUS.CANCELLED_BY_ADMIN
    ],
    // Terminal states - no transitions allowed out of these
    [BOOKING_STATUS.COMPLETED]: [],
    [BOOKING_STATUS.CANCELLED_BY_USER]: [],
    [BOOKING_STATUS.CANCELLED_BY_ADMIN]: [],
    [BOOKING_STATUS.CANCELLED_BY_SYSTEM]: [],
    [BOOKING_STATUS.PAYMENT_FAILED]: [],
    [BOOKING_STATUS.RESERVATION_EXPIRED]: []
  };

  if (!allowedTransitions[currentStatus]) {
    throw new BadRequestError(`Unknown current status: ${currentStatus}`);
  }

  if (!allowedTransitions[currentStatus].includes(newStatus)) {
    throw new BadRequestError(`Invalid state transition from ${currentStatus} to ${newStatus}`);
  }

  return true;
};
