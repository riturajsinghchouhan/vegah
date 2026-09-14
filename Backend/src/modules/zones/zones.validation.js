import Joi from 'joi';

export const createZoneSchema = {
  body: Joi.object({
    name: Joi.string().required(),
    subtitle: Joi.string().allow(''),
    unit: Joi.string().default('kilometer'),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
    boundary: Joi.alternatives().try(Joi.object(), Joi.array()).allow(null),
    pickupLocation: Joi.object({
      address: Joi.string().allow(''),
      latitude: Joi.number().allow(null),
      longitude: Joi.number().allow(null),
    }).optional(),
    dropLocation: Joi.object({
      address: Joi.string().allow(''),
      latitude: Joi.number().allow(null),
      longitude: Joi.number().allow(null),
    }).optional(),
  }),
};

export const updateZoneSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string(),
    subtitle: Joi.string().allow(''),
    unit: Joi.string(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE'),
    boundary: Joi.alternatives().try(Joi.object(), Joi.array()).allow(null),
    pickupLocation: Joi.object({
      address: Joi.string().allow(''),
      latitude: Joi.number().allow(null),
      longitude: Joi.number().allow(null),
    }).optional(),
    dropLocation: Joi.object({
      address: Joi.string().allow(''),
      latitude: Joi.number().allow(null),
      longitude: Joi.number().allow(null),
    }).optional(),
  }).min(1), // At least one field must be provided
};

export const idParamSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

export const listZonesSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('ACTIVE', 'INACTIVE'),
    search: Joi.string().allow(''),
  }),
};
