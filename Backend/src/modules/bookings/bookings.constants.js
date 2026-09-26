export const BOOKING_STATUS = {
  RESERVED: 'RESERVED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  PAYMENT_INITIATED: 'PAYMENT_INITIATED',
  CONFIRMED: 'CONFIRMED',
  ACTIVE: 'ACTIVE',
  PENDING_RETURN: 'PENDING_RETURN',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
  CANCELLED_BY_USER: 'CANCELLED_BY_USER',
  CANCELLED_BY_ADMIN: 'CANCELLED_BY_ADMIN',
  CANCELLED_BY_SYSTEM: 'CANCELLED_BY_SYSTEM',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  RESERVATION_EXPIRED: 'RESERVATION_EXPIRED',
};

export const BATTERY_PACKAGES = {
  NONE: { id: 'NONE', name: 'No Package', price: 0 },
  SINGLE: { id: 'SINGLE', name: 'Single Charge', price: 50 },
  UNLIMITED: { id: 'UNLIMITED', name: 'Unlimited Swaps', price: 150 },
};

export const RENTAL_TYPES = {
  HOURLY: 'HOURLY',
  DAILY: 'DAILY',
};

// 15 minutes in milliseconds
export const RESERVATION_TTL_MS = 15 * 60 * 1000;

// How long before the trip deadline the user is reminded to head back. 15 minutes.
export const RENTAL_REMINDER_LEAD_MS = 15 * 60 * 1000;

// Grace period after the deadline before the booking is flagged OVERDUE. 5 minutes.
export const OVERDUE_GRACE_MS = 5 * 60 * 1000;

// Late returns are billed at this multiple of the vehicle's hourly rate, per started hour.
export const LATE_FEE_MULTIPLIER = 1.5;

/**
 * Booking states that occupy a unit of a vehicle's stock. Shared by the booking
 * write path and the vehicle listing/detail read path so the app can never
 * advertise a vehicle it would then refuse to book.
 */
export const ACTIVE_BOOKING_STATUSES = [
  BOOKING_STATUS.RESERVED,
  BOOKING_STATUS.PENDING_VERIFICATION,
  BOOKING_STATUS.PAYMENT_INITIATED,
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.ACTIVE,
  BOOKING_STATUS.PENDING_RETURN,
  BOOKING_STATUS.OVERDUE,
];

// Booking states a trip can be running in (timer ticking / vehicle out with the user).
export const IN_TRIP_STATUSES = [
  BOOKING_STATUS.ACTIVE,
  BOOKING_STATUS.OVERDUE,
  BOOKING_STATUS.PENDING_RETURN,
];
