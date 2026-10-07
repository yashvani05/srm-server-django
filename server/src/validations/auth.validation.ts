import Joi from 'joi';

// bcrypt only uses the first 72 bytes, so cap the length rather than silently truncating.
const password = Joi.string().min(8).max(72).required();
const email = Joi.string().trim().email().max(255).required();

export const registerSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email,
    password,
  }),
};

export const loginSchema = {
  body: Joi.object({
    email,
    password: Joi.string().max(72).required(),
  }),
};
