export const sendSuccess = (res, statusCode, message, data = null, meta = null) => {
  const response = {
    success: true,
    message,
  };

  if (data) response.data = data;
  if (meta) response.meta = meta;

  return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode, message, errorDetails = null) => {
  const response = {
    success: false,
    message,
  };

  if (errorDetails) {
    response.error = errorDetails;
  }

  return res.status(statusCode).json(response);
};
