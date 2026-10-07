import Joi from 'joi';
import { REQUEST_CATEGORIES, REQUEST_PRIORITIES, REQUEST_STATUSES } from '../constants';

const statusNotAllowed = Joi.any().forbidden().messages({
  'any.unknown': 'status cannot be set here; use PATCH /requests/:id/status',
});

const title = Joi.string().trim().min(3).max(150);
const description = Joi.string().trim().min(1).max(5000);
const category = Joi.string().valid(...REQUEST_CATEGORIES);
const priority = Joi.string().valid(...REQUEST_PRIORITIES);

export const idParamSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

export const listRequestsSchema = {
  query: Joi.object({
    status: Joi.string().uppercase().valid(...REQUEST_STATUSES),
    priority: Joi.string().uppercase().valid(...REQUEST_PRIORITIES),
    overdue: Joi.boolean(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

export const createRequestSchema = {
  body: Joi.object({
    title: title.required(),
    description: description.required(),
    category: category.required(),
    priority: priority.default('MEDIUM'),
    status: statusNotAllowed,
  }),
};

export const updateRequestSchema = {
  ...idParamSchema,
  body: Joi.object({
    title,
    description,
    category,
    priority,
    status: statusNotAllowed,
  }).min(1),
};

export const updateStatusSchema = {
  ...idParamSchema,
  body: Joi.object({
    status: Joi.string()
      .valid(...REQUEST_STATUSES)
      .required(),
  }),
};
