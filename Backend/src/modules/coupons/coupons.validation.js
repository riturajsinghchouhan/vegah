import Joi from 'joi';

const COUPON_TYPES = ['PERCENTAGE', 'FLAT'];
const COUPON_STATUSES = ['ACTIVE', 'INACTIVE'];

// A PERCENTAGE coupon's value is a percentage, so it is capped at 100; a FLAT
// one is a rupee amount with no upper bound. The old routes had no validation
// at all, which let `{ type: 'PERCENTAGE', value: 500 }` be saved and then
// discount more than the booking cost.
const valueForType = Joi.number().min(0).required().when('type', {
  is: 'PERCENTAGE',
  then: Joi.number().max(100).messages({
    'number.max': 'value for a PERCENTAGE coupon cannot be more than 100',
  }),
});

export const createCouponSchema = {
  body: Joi.object({
    code: Joi.string().trim().uppercase().min(3).max(20).pattern(/^[A-Z0-9_-]+$/).required()
      .messages({ 'string.pattern.base': 'code may only contain letters, numbers, - and _' }),
    type: Joi.string().uppercase().valid(...COUPON_TYPES).required(),
    value: valueForType,
    minBookingAmount: Joi.number().min(0).default(0),
    maxDiscountAmount: Joi.number().min(0).allow(null).default(null),
    usageLimitPerUser: Joi.number().integer().min(1).allow(null).default(1),
    totalUsageLimit: Joi.number().integer().min(1).allow(null).default(null),
    startDate: Joi.date().required(),
    // Greater than, not at least: a window that opens and closes at the same
    // instant is never valid for anybody.
    expiryDate: Joi.date().greater(Joi.ref('startDate')).required()
      .messages({ 'date.greater': 'expiryDate must be after startDate' }),
    status: Joi.string().uppercase().valid(...COUPON_STATUSES).default('ACTIVE'),
  }),
};

export const updateCouponSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    code: Joi.string().trim().uppercase().min(3).max(20).pattern(/^[A-Z0-9_-]+$/)
      .messages({ 'string.pattern.base': 'code may only contain letters, numbers, - and _' }),
    type: Joi.string().uppercase().valid(...COUPON_TYPES),
    value: Joi.number().min(0),
    minBookingAmount: Joi.number().min(0),
    maxDiscountAmount: Joi.number().min(0).allow(null),
    usageLimitPerUser: Joi.number().integer().min(1).allow(null),
    totalUsageLimit: Joi.number().integer().min(1).allow(null),
    startDate: Joi.date(),
    expiryDate: Joi.date(),
    status: Joi.string().uppercase().valid(...COUPON_STATUSES),
  })
    .min(1)
    // A partial update can send either date on its own, so the pair is only
    // checked when both are present; the service re-checks the stored pair.
    .custom((value, helpers) => {
      if (value.startDate && value.expiryDate && new Date(value.expiryDate) <= new Date(value.startDate)) {
        return helpers.message('expiryDate must be after startDate');
      }
      if (value.type === 'PERCENTAGE' && value.value != null && value.value > 100) {
        return helpers.message('value for a PERCENTAGE coupon cannot be more than 100');
      }
      return value;
    }),
};

export const idParamSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

export const listCouponsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().trim().allow('', null),
    status: Joi.string().uppercase().valid(...COUPON_STATUSES),
  }),
};

export const validateCouponSchema = {
  body: Joi.object({
    code: Joi.string().trim().uppercase().required(),
    amount: Joi.number().min(0).required(),
  }),
};
