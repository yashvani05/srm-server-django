import type { RequestHandler } from 'express';
import type { PermissionKey, RoleName } from '../constants';
import { AppError } from '../utils/AppError';

// Both guards must run after `authenticate`. Without req.user they answer 401, not 403.

/** Allows the request only if the user has one of the given roles. */
export function requireRole(...roles: RoleName[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };
}

/** Allows the request only if the user's role grants ALL of the given permissions. */
export function requirePermission(...permissions: PermissionKey[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    const granted = new Set(req.user.permissions);
    if (!permissions.every((p) => granted.has(p))) return next(AppError.forbidden());
    next();
  };
}
