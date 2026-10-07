import type { RequestHandler } from 'express';
import { userRepository } from '../repositories/user.repository';
import { toAuthUser } from '../services/auth.service';
import { tokenDenylist } from '../services/tokenDenylist.service';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';

/** Verifies the Bearer JWT, rejects logged-out tokens, and attaches the current user (with permissions). */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw AppError.unauthorized();

  const claims = verifyToken(header.slice('Bearer '.length).trim());

  let denied: boolean;
  try {
    denied = await tokenDenylist.isDenied(claims.jti);
  } catch (err) {
    // Fail closed: if we can't confirm the token wasn't revoked, don't let it through.
    logger.error({ err }, 'Token denylist unavailable');
    throw new AppError(503, 'Authentication service temporarily unavailable');
  }
  if (denied) throw AppError.unauthorized('Token has been revoked');

  const record = await userRepository.findById(claims.sub);
  if (!record) throw AppError.unauthorized('Invalid token');

  req.user = toAuthUser(record);
  req.tokenClaims = claims;
  next();
};
