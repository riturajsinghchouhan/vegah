import Joi from 'joi';

export const createVehicleSchema = {
  body: Joi.object({
    plateNumber: Joi.string().required(),
    name: Joi.string().required(),
    brand: Joi.string().required(),
    model: Joi.string().required(),
    type: Joi.string().required(),
    category: Joi.string().hex().length(24).required(),
    zone: Joi.string().hex().length(24).required(),
    rangeKm: Joi.number().required(),
    batteryCapacity: Joi.string().required(),
    batteryPercent: Joi.number().min(0).max(100).default(100),
    chargeTime: Joi.string(),
    chargingInfo: Joi.string(),
    seats: Joi.number().default(2),
    features: Joi.array().items(Joi.string()),
    location: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required(),
    }),
    pickupNote: Joi.string().allow(''),
    pricePerHour: Joi.number().required(),
    pricePerDay: Joi.number().required(),
    securityDeposit: Joi.number().required(),
    status: Joi.string().valid('AVAILABLE', 'MAINTENANCE', 'INACTIVE').default('AVAILABLE'),
  }),
};

export const updateVehicleSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    plateNumber: Joi.string(),
    name: Joi.string(),
    brand: Joi.string(),
    model: Joi.string(),
    type: Joi.string(),
    category: Joi.string().hex().length(24),
    zone: Joi.string().hex().length(24),
    rangeKm: Joi.number(),
    batteryCapacity: Joi.string(),
    batteryPercent: Joi.number().min(0).max(100),
    chargeTime: Joi.string(),
    chargingInfo: Joi.string(),
    seats: Joi.number(),
    features: Joi.array().items(Joi.string()),
    location: Joi.string(),
    coordinates: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required(),
    }),
    pickupNote: Joi.string().allow(''),
    pricePerHour: Joi.number(),
    pricePerDay: Joi.number(),
    securityDeposit: Joi.number(),
    status: Joi.string().valid('AVAILABLE', 'MAINTENANCE', 'INACTIVE'),
  }).min(1),
};

export const idParamSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

export const listVehiclesSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string(),
    category: Joi.string().hex().length(24),
    zone: Joi.string().hex().length(24),
    status: Joi.string().valid('AVAILABLE', 'BOOKED', 'RESERVED', 'MAINTENANCE', 'INACTIVE'),
    search: Joi.string().allow(''),
    minPriceDay: Joi.number(),
    maxPriceDay: Joi.number(),
  }),
};
