import Joi from 'joi';

const email = Joi.string()
  .trim()
  .email({ tlds: { allow: false } })
  .max(255)
  .required()
  .messages({ 'string.empty': 'Email is required', 'string.email': 'Enter a valid email address' });

export const loginSchema = Joi.object({
  email,
  password: Joi.string().required().messages({ 'string.empty': 'Password is required' }),
});

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
  }),
  email,
  password: Joi.string().min(8).max(72).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
    'string.max': 'Password must be at most 72 characters',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'string.empty': 'Confirm your password',
  }),
});
