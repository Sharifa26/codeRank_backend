import Joi from "joi";
import { Language } from "../types/index";

const objectIdSchema = Joi.string().hex().length(24);

/**
 * Validation schemas for code execution endpoints
 */
export const runCodeSchema = Joi.object({
  language: Joi.string()
    .valid(...Object.values(Language))
    .required()
    .messages({
      "any.only": `Language must be one of: ${Object.values(Language).join(", ")}`,
      "any.required": "Language is required",
    }),
  code: Joi.string().max(50000).required().messages({
    "string.max": "Code cannot exceed 50000 characters",
    "any.required": "Code is required",
  }),
  stdin: Joi.string().max(10000).allow("").default("").messages({
    "string.max": "Stdin cannot exceed 10000 characters",
  }),
});

export const saveCodeSchema = Joi.object({
  title: Joi.string().trim().max(100).default("Untitled").messages({
    "string.max": "Title cannot exceed 100 characters",
  }),
  language: Joi.string()
    .valid(...Object.values(Language))
    .required()
    .messages({
      "any.only": `Language must be one of: ${Object.values(Language).join(", ")}`,
      "any.required": "Language is required",
    }),
  code: Joi.string().max(50000).required().messages({
    "string.max": "Code cannot exceed 50000 characters",
    "any.required": "Code is required",
  }),
  stdin: Joi.string().max(10000).allow("").default("").messages({
    "string.max": "Stdin cannot exceed 10000 characters",
  }),
});

export const shareCodeSchema = Joi.object({
  codeId: objectIdSchema.required().messages({
    "string.hex": "Code snippet ID must be a valid ID",
    "string.length": "Code snippet ID must be a valid ID",
    "any.required": "Code snippet ID is required",
  }),
});

export const optimizeCodeSchema = Joi.object({
  language: Joi.string()
    .valid(...Object.values(Language))
    .required()
    .messages({
      "any.only": `Language must be one of: ${Object.values(Language).join(", ")}`,
      "any.required": "Language is required",
    }),
  code: Joi.string().max(50000).required().messages({
    "string.max": "Code cannot exceed 50000 characters",
    "any.required": "Code is required",
  }),
});

export const deleteCodeSchema = Joi.object({
  id: objectIdSchema.required().messages({
    "string.hex": "Code snippet ID must be a valid ID",
    "string.length": "Code snippet ID must be a valid ID",
    "any.required": "Code snippet ID is required",
  }),
});
