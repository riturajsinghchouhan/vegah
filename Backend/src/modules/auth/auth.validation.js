import Joi from 'joi';

export const requestOtpSchema = {
  body: Joi.object({
    phone: Joi.string().pattern(/^\+91[0-9]{10}$/).required().messages({
      'string.pattern.base': 'Phone number must be a valid Indian mobile number starting with +91',
    }),
  }),
};

export const verifyOtpSchema = {
  body: Joi.object({
    phone: Joi.string().pattern(/^\+91[0-9]{10}$/).required(),
    otp: Joi.string().length(6).required(),
  }),
};

export const refreshTokenSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};
