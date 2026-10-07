import { createHash, timingSafeEqual } from 'crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const digest = (v: string) => createHash('sha256').update(v).digest();

/**
 * Guards the cron endpoint with the shared secret CRON_SECRET (`Authorization: Bearer <secret>`).
 * Vercel Cron sends exactly that header automatically when a CRON_SECRET environment variable exists.
 * With no CRON_SECRET configured the endpoint does not exist (404), so it can never be called by accident.
 */
export const cronAuth: RequestHandler = (req, _res, next) => {
  if (!env.CRON_SECRET) return next(AppError.notFound('Route not found'));
  const header = req.headers.authorization ?? '';
  const given = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  if (!timingSafeEqual(digest(given), digest(env.CRON_SECRET))) return next(AppError.unauthorized('Invalid cron secret'));
  next();
};
