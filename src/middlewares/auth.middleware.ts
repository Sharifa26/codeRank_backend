import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../config/env";
import { IAuthRequest, IUserPayload } from "../types/index";
import { ApiError } from "../utils/apiError";

export const authenticate = (
  req: IAuthRequest,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Access denied. Invalid token format.");
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as IUserPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, "Invalid or expired token."));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, "Token has expired. Please login again."));
    } else {
      next(error);
    }
  }
};
