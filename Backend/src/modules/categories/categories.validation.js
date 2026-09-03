import Joi from 'joi';

export const createCategorySchema = {
  body: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    basePricePerKm: Joi.number().allow(null),
    basePricePerMin: Joi.number().allow(null),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
  }),
};

export const updateCategorySchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string(),
    type: Joi.string(),
    basePricePerKm: Joi.number().allow(null),
    basePricePerMin: Joi.number().allow(null),
    status: Joi.string().valid('ACTIVE', 'INACTIVE'),
  }).min(1),
};

export const idParamSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

export const listCategoriesSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('ACTIVE', 'INACTIVE'),
    search: Joi.string().allow(''),
  }),
};
