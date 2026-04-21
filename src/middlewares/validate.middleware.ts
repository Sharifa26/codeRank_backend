import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ApiResponse } from "../utils/apiResponse";

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details
        .map((detail) => detail.message)
        .join(", ");

      ApiResponse.error(res, 400, "Validation failed", errorMessages);
      return;
    }

    req.body = value;
    next();
  };
};
