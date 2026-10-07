import type { AuthUser, TokenClaims } from './auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tokenClaims?: TokenClaims;
    }
  }
}

export {};
