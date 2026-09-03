import Joi from 'joi';

export const uploadDocumentSchema = {
  body: Joi.object({
    type: Joi.string().valid('AADHAR', 'DRIVING_LICENSE', 'SELFIE').required(),
    documentNumber: Joi.string().allow('', null),
  }),
};
