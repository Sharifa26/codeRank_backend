import rateLimit from "express-rate-limit";
import env from "../config/env";

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutes default
  max: env.RATE_LIMIT_MAX_REQUESTS, // 100 requests per window
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    error: "Rate limit exceeded",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const executionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 executions per minute
  message: {
    success: false,
    message: "Too many code execution requests. Please wait and try again.",
    error: "Execution rate limit exceeded",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
    error: "Auth rate limit exceeded",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
