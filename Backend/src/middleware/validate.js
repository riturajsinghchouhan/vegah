import { ValidationError } from '../utils/errors.js';

const validate = (schema) => (req, res, next) => {
  const validSchema = {};
  if (schema.params) validSchema.params = schema.params;
  if (schema.query) validSchema.query = schema.query;
  if (schema.body) validSchema.body = schema.body;

  let hasError = false;
  let errors = [];

  Object.keys(validSchema).forEach((key) => {
    const { error, value } = validSchema[key].validate(req[key], { abortEarly: false, stripUnknown: true });
    
    if (error) {
      hasError = true;
      errors = [
        ...errors,
        ...error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/"/g, ''),
          location: key,
        })),
      ];
    } else {
      req[key] = value;
    }
  });

  if (hasError) {
    return next(new ValidationError('Validation failed', errors));
  }

  next();
};

export default validate;
