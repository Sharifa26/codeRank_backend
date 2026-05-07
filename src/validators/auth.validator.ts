import Joi from "joi";

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[a-z]/, "lowercase letter")
  .pattern(/[A-Z]/, "uppercase letter")
  .pattern(/[0-9]/, "number")
  .pattern(/[^A-Za-z0-9]/, "special character")
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters",
    "string.max": "Password cannot exceed 128 characters",
    "string.pattern.name":
      "Password must include at least one lowercase letter, one uppercase letter, one number, and one special character",
    "any.required": "Password is required",
  });

/**
 * Validation schemas for authentication endpoints
 */
export const signupSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username cannot exceed 30 characters",
      "string.pattern.base":
        "Username can only contain letters, numbers, and underscores",
      "any.required": "Username is required",
    }),
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: passwordSchema,
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

export const googleLoginSchema = Joi.object({
  idToken: Joi.string().required().messages({
    "any.required": "Google ID token is required",
    "string.empty": "Google ID token is required",
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: passwordSchema.label("New password"),
});
