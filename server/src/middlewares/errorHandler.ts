import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

// Centralized error handler. Unknown errors are logged but never leaked to the client.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.errors);
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 400, 'Malformed JSON in request body');
    return;
  }

  logger.error({ err }, 'Unhandled error');
  sendError(res, 500, 'Internal server error');
};
