import Joi from 'joi';
import { RENTAL_TYPES, BATTERY_PACKAGES, BOOKING_STATUS } from './bookings.constants.js';

// Calendar date in the server's configured timezone (TZ, e.g. Asia/Kolkata).
// Everything about booking dates is compared as a plain YYYY-MM-DD string so no
// UTC conversion can shift a date across a day boundary.
const todayLocal = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Accepts "YYYY-MM-DD" or a full ISO timestamp, and normalises to "YYYY-MM-DD".
const calendarDate = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}(T.*)?$/)
  .custom((value) => value.slice(0, 10), 'calendar date')
  .messages({ 'string.pattern.base': '{{#label}} must be a date in YYYY-MM-DD format' });

export const createBookingSchema = {
  body: Joi.object({
    vehicleId: Joi.string().hex().length(24).required(),
    rentalType: Joi.string().valid(RENTAL_TYPES.HOURLY, RENTAL_TYPES.DAILY).required(),
    // Evaluated per request (the old module-level bound went stale once the
    // process had been up across midnight).
    startDate: calendarDate
      .custom((value, helpers) => (value < todayLocal() ? helpers.error('date.past') : value), 'not in the past')
      .messages({ 'date.past': '{{#label}} cannot be in the past' })
      .required(),
    startTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    // NOTE: not Joi.string().min() -- that compares string *length*. ISO dates
    // sort lexicographically, so a plain >= comparison is the correct check.
    endDate: calendarDate
      .custom((value, helpers) => {
        const start = helpers.state.ancestors[0]?.startDate;
        return start && value < String(start).slice(0, 10) ? helpers.error('date.beforeStart') : value;
      }, 'on or after startDate')
      .messages({ 'date.beforeStart': '{{#label}} must be on or after startDate' })
      .required(),
    endTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    pickupLocation: Joi.string().trim().min(1).required(),
    // Recorded on the booking so the hub knows whether cash is due at pickup.
    paymentMethod: Joi.string().valid('ONLINE', 'WALLET', 'CASH').default('ONLINE'),
    batteryPackage: Joi.string().valid(BATTERY_PACKAGES.NONE.id, BATTERY_PACKAGES.SINGLE.id, BATTERY_PACKAGES.UNLIMITED.id).default(BATTERY_PACKAGES.SINGLE.id),
    couponCode: Joi.string().allow('', null),
    aadharFile: Joi.string().allow('', null),
    licenseFile: Joi.string().allow('', null),
    userPhotoFile: Joi.string().allow('', null),
  }),
};

export const updateBookingStatusSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    status: Joi.string().valid(...Object.values(BOOKING_STATUS)).required(),
    notes: Joi.string().allow('', null),
    cancellationReason: Joi.string().allow('', null),
  }),
};

export const idParamSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

export const extendBookingSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    extraHours: Joi.number().integer().min(1).max(24).required(),
  }),
};

// Shared shape for the handover endpoints: an id plus an optional admin note.
export const lifecycleNoteSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    note: Joi.string().max(500).allow('', null),
  }).default({}),
};

export const confirmReturnSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    note: Joi.string().max(500).allow('', null),
    // Whether the security deposit goes back to the customer or is held
    // against damage found at the return inspection.
    depositStatus: Joi.string().valid('REFUNDED', 'COLLECTED').default('REFUNDED'),
  }).default({}),
};

export const listBookingsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    // Accepts one status or a comma-separated list, e.g. "ACTIVE,OVERDUE,PENDING_RETURN".
    status: Joi.string().custom((value, helpers) => {
      const allowed = Object.values(BOOKING_STATUS);
      const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
      if (!parts.length || parts.some((part) => !allowed.includes(part))) {
        return helpers.error('any.invalid');
      }
      return parts.join(',');
    }, 'booking status list'),
    userId: Joi.string().hex().length(24),
    vehicleId: Joi.string().hex().length(24),
  }),
};
