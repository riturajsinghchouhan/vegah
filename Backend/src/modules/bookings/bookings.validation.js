import Joi from 'joi';
import { RENTAL_TYPES, BATTERY_PACKAGES } from './bookings.constants.js';

export const createBookingSchema = {
  body: Joi.object({
    vehicleId: Joi.string().hex().length(24).required(),
    rentalType: Joi.string().valid(RENTAL_TYPES.HOURLY, RENTAL_TYPES.DAILY).required(),
    startDate: Joi.date().iso().min('now').required(),
    startTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    endTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    pickupLocation: Joi.string().required(),
    batteryPackage: Joi.string().valid(BATTERY_PACKAGES.NONE.id, BATTERY_PACKAGES.SINGLE.id, BATTERY_PACKAGES.UNLIMITED.id).default(BATTERY_PACKAGES.SINGLE.id),
    couponCode: Joi.string().allow('', null),
  }),
};

export const updateBookingStatusSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    status: Joi.string().required(),
    notes: Joi.string().allow('', null),
    cancellationReason: Joi.string().allow('', null),
  }),
};

export const idParamSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

export const listBookingsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string(),
    userId: Joi.string().hex().length(24),
    vehicleId: Joi.string().hex().length(24),
  }),
};
