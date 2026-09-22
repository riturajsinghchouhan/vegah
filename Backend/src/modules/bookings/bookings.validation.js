import Joi from 'joi';
import { RENTAL_TYPES, BATTERY_PACKAGES, BOOKING_STATUS } from './bookings.constants.js';

export const createBookingSchema = {
  body: Joi.object({
    vehicleId: Joi.string().hex().length(24).required(),
    rentalType: Joi.string().valid(RENTAL_TYPES.HOURLY, RENTAL_TYPES.DAILY).required(),
    startDate: Joi.date().iso().min(new Date(new Date().setHours(0,0,0,0))).required(),
    startTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    endTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    pickupLocation: Joi.string().required(),
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
