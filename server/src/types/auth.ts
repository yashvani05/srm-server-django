import type { PermissionKey, RoleName } from '../constants';

/** Authenticated principal attached to the request by the authenticate middleware. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  permissions: PermissionKey[];
}

export interface TokenClaims {
  sub: string;
  role: RoleName;
  jti: string;
  exp: number;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}
