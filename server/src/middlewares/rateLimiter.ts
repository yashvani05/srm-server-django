import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// Brute-force protection for login: LOGIN_RATE_LIMIT_MAX attempts (default 10) per IP per 15 minutes.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ success: false, message: 'Too many login attempts. Please try again later.', errors: [] });
  },
});
