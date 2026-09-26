import { ApiError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    // NB: this used to read `error.statusCode || error.name === 'ValidationError' ? 400 : 500`,
    // which parses as `(statusCode || name === 'ValidationError') ? 400 : 500` -- so any
    // error carrying a statusCode (a 413 payload-too-large, a 404, ...) was reported as 400.
    const statusCode = error.statusCode
      || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  const responseError = {
    code: error.statusCode === 400 ? 'BAD_REQUEST' :
          error.statusCode === 401 ? 'UNAUTHORIZED' :
          error.statusCode === 403 ? 'FORBIDDEN' :
          error.statusCode === 404 ? 'NOT_FOUND' :
          error.statusCode === 409 ? 'CONFLICT' : 'INTERNAL_SERVER_ERROR',
  };

  if (err.errors) {
    responseError.details = err.errors;
  }

  // Add stack trace in development
  if (env.NODE_ENV === 'development') {
    responseError.stack = err.stack;
  }

  // Log error
  if (error.statusCode >= 500) {
    logger.error(`[${req.id}] ${error.message}\n${error.stack}`);
  } else {
    // Include the field-level details: a bare "Validation failed" in the log
    // says nothing about which field the client actually got wrong.
    const detail = err.errors?.length
      ? ` (${err.errors.map((e) => `${e.location}.${e.field}: ${e.message}`).join('; ')})`
      : '';
    logger.warn(`[${req.id}] ${req.method} ${req.originalUrl} -> ${error.statusCode} ${error.message}${detail}`);
  }

  sendError(res, error.statusCode, error.message, responseError);
};

export default errorHandler;
