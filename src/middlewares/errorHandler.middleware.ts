import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import env from "../config/env";

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (env.NODE_ENV === "development") {
    console.error("❌ Error:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  } else {
    console.error("❌ Error:", err.message);
  }

  if (err instanceof ApiError) {
    ApiResponse.error(res, err.statusCode, err.message);
    return;
  }

  if (err.name === "ValidationError") {
    ApiResponse.error(res, 400, "Validation Error", err.message);
    return;
  }

  if (err.name === "MongoServerError" && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    ApiResponse.error(
      res,
      409,
      `${field} already exists`,
      "Duplicate key error",
    );
    return;
  }

  if (err.name === "CastError") {
    ApiResponse.error(res, 400, "Invalid ID format", err.message);
    return;
  }

  ApiResponse.error(
    res,
    500,
    "Internal Server Error",
    env.NODE_ENV === "development" ? err.message : undefined,
  );
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  ApiResponse.error(
    res,
    404,
    `Route ${req.method} ${req.originalUrl} not found`,
  );
};
