import Joi from 'joi';

export const updateStatusSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(), // Vehicle ID
  }),
  body: Joi.object({
    status: Joi.string().valid('AVAILABLE', 'MAINTENANCE', 'INACTIVE').required(),
  }),
};

export const zoneAvailabilitySchema = {
  params: Joi.object({
    zoneId: Joi.string().hex().length(24).required(),
  }),
};
