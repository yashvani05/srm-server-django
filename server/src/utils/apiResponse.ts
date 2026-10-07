import type { Response } from 'express';
import type { ErrorDetail } from './AppError';

export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export function sendSuccess<T>(res: Response, message: string, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendPaginated<T>(res: Response, message: string, items: T[], pagination: Pagination): Response {
  return sendSuccess(res, message, { items, pagination });
}

export function sendError(res: Response, statusCode: number, message: string, errors: ErrorDetail[] = []): Response {
  return res.status(statusCode).json({ success: false, message, errors });
}
