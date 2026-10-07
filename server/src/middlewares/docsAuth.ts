import { createHash, timingSafeEqual } from 'crypto';
import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// Compare fixed-length digests so neither the length nor the content of a credential leaks through timing.
const digest = (value: string) => createHash('sha256').update(value).digest();
const matches = (given: string, expected: string) => timingSafeEqual(digest(given), digest(expected));

// Only failed attempts count, so legitimate use of the docs (many asset requests) is never throttled.
const failedAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).type('text/plain').send('Too many failed attempts. Please try again later.');
  },
});

const challenge: RequestHandler = (_req, res) => {
  // The WWW-Authenticate header is what makes the browser show its username / password prompt.
  res.set('WWW-Authenticate', 'Basic realm="API Documentation", charset="UTF-8"').status(401).type('text/plain').send('Authentication required');
};

/** HTTP Basic authentication guarding the API documentation (credentials: SWAGGER_USER / SWAGGER_PASS). */
export const docsAuth: RequestHandler[] = [
  failedAttemptLimiter,
  (req, res, next) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Basic ')) {
      const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      if (separator > -1) {
        const userOk = matches(decoded.slice(0, separator), env.SWAGGER_USER);
        const passOk = matches(decoded.slice(separator + 1), env.SWAGGER_PASS);
        if (userOk && passOk) return next();
      }
    }
    challenge(req, res, next);
  },
];
