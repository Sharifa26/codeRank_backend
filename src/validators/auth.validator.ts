import Joi from "joi";

/**
 * Validation schemas for authentication endpoints
 */
export const signupSchema = Joi.object({
  username: Joi.string().trim().min(3).max(30).required().messages({
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username cannot exceed 30 characters",
    "any.required": "Username is required",
  }),
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).max(128).required().messages({
    "string.min": "Password must be at least 6 characters",
    "string.max": "Password cannot exceed 128 characters",
    "any.required": "Password is required",
  }),
  confirmPassword: Joi.string().trim().valid(Joi.ref("password")).messages({
    "any.only": "Passwords must match",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
});
