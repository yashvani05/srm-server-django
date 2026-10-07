import { randomUUID } from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './AppError';
import type { RoleName } from '../constants';
import type { TokenClaims } from '../types/auth';

const ALGORITHM = 'HS256';

export function signToken(userId: string, role: RoleName): string {
  return jwt.sign({ role }, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    subject: userId,
    jwtid: randomUUID(),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenClaims {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
    if (typeof payload === 'string' || !payload.sub || !payload.jti || !payload.exp) {
      throw AppError.unauthorized('Invalid token');
    }
    return { sub: payload.sub, role: payload.role, jti: payload.jti, exp: payload.exp };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof jwt.TokenExpiredError) throw AppError.unauthorized('Token expired');
    throw AppError.unauthorized('Invalid token');
  }
}
