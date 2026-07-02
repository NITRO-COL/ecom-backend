/**
 * Operational error with an HTTP status code.
 * Anything thrown as AppError is "expected" and safe to show the client.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', details?: unknown) {
    return new AppError(msg, 400, details);
  }
  static unauthorized(msg = 'Not authenticated') {
    return new AppError(msg, 401);
  }
  static forbidden(msg = 'Not authorized') {
    return new AppError(msg, 403);
  }
  static notFound(msg = 'Resource not found') {
    return new AppError(msg, 404);
  }
  static conflict(msg = 'Conflict') {
    return new AppError(msg, 409);
  }
}
