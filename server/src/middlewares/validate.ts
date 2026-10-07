import type { RequestHandler } from 'express';
import type Joi from 'joi';
import { AppError } from '../utils/AppError';

interface Schemas {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

/** Centralized Joi validation. Replaces req.body/query/params with the validated, stripped values. */
export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    const details: { field: string; message: string }[] = [];

    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part];
      if (!schema) continue;

      const { value, error } = schema.validate(req[part], { abortEarly: false, stripUnknown: true, convert: true });
      if (error) {
        details.push(...error.details.map((d) => ({ field: d.path.join('.') || part, message: d.message })));
        continue;
      }
      // Express 5 exposes req.query as a read-only getter, so redefine it rather than assign.
      Object.defineProperty(req, part, { value, writable: true, configurable: true, enumerable: true });
    }

    if (details.length > 0) return next(AppError.badRequest('Validation failed', details));
    next();
  };
}
