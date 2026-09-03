import Joi from 'joi';

export const listUsersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    isVerified: Joi.boolean(),
    isBlocked: Joi.boolean(),
    search: Joi.string().allow(''),
  }),
};

export const idParamSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

// Profile update for the user themselves
export const updateProfileSchema = {
  body: Joi.object({
    fullName: Joi.string(),
    email: Joi.string().email(),
  }).min(1),
};
