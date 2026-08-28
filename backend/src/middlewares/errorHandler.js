import { ApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'An unexpected error occurred';
    error = new ApiError(statusCode, message, 'UNHANDLED_ERROR', error.errors || []);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    error: {
      code: error.errorCode,
      details: error.errors
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };

  if (env.nodeEnv === 'development') {
    response.error.stack = err.stack;
  }

  console.error(`[API ERROR] ${req.method} ${req.originalUrl} - Code: ${error.statusCode} - ${error.message}`);

  return res.status(error.statusCode).json(response);
};