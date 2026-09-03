export class ApiError extends Error {
  constructor(statusCode, message, errorCode = 'INTERNAL_ERROR', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', errors = []) {
    return new ApiError(400, message, 'BAD_REQUEST', errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden Access') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource Not Found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message = 'Resource Conflict') {
    return new ApiError(409, message, 'CONFLICT');
  }

  static badGateway(message = 'Upstream service error') {
    return new ApiError(502, message, 'BAD_GATEWAY');
  }

  static serviceUnavailable(message = 'Service unavailable') {
    return new ApiError(503, message, 'SERVICE_UNAVAILABLE');
  }

  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message, 'INTERNAL_SERVER_ERROR');
  }
}