export interface ErrorDetail {
  field?: string;
  message: string;
}

/** Operational error with an HTTP status; safe to show its message to clients. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, errors: ErrorDetail[] = []) {
    return new AppError(400, message, errors);
  }
  static unauthorized(message = 'Authentication required') {
    return new AppError(401, message);
  }
  static forbidden(message = 'You do not have permission to perform this action') {
    return new AppError(403, message);
  }
  static notFound(message = 'Resource not found') {
    return new AppError(404, message);
  }
  static conflict(message: string) {
    return new AppError(409, message);
  }
}
