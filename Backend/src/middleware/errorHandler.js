import { ApiError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.name === 'ValidationError' ? 400 : 500;
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
    logger.warn(`[${req.id}] ${error.message}`);
  }

  sendError(res, error.statusCode, error.message, responseError);
};

export default errorHandler;
