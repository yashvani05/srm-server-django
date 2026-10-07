import Joi from 'joi';
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS } from '../constants/requests';

export const requestFormSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required().messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title must be at most 150 characters',
  }),
  description: Joi.string().trim().max(5000).required().messages({
    'string.empty': 'Description is required',
    'string.max': 'Description must be at most 5000 characters',
  }),
  category: Joi.string()
    .valid(...CATEGORY_OPTIONS.map((o) => o.value))
    .required()
    .messages({ 'any.only': 'Select a category', 'any.required': 'Select a category', 'string.empty': 'Select a category', 'string.base': 'Select a category' }),
  priority: Joi.string()
    .valid(...PRIORITY_OPTIONS.map((o) => o.value))
    .required(),
});
