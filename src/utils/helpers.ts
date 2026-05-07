import crypto from "node:crypto";
import { CONSTANTS } from "./constants";

/**
 * Generate a unique share ID for code snippets
 * Uses UUID v4 truncated to desired length
 */
export const generateShareId = (): string => {
  return crypto
    .randomBytes(Math.ceil((CONSTANTS.SHARE_ID_LENGTH * 3) / 4))
    .toString("base64url")
    .slice(0, CONSTANTS.SHARE_ID_LENGTH);
};

/**
 * Sanitize code input to prevent injection attacks
 * Removes potentially dangerous patterns
 */
export const sanitizeCode = (code: string): string => {
  return code.replace(/\0/g, "");
};

/**
 * Calculate pagination offset
 */
export const getPaginationParams = (
  page?: number,
  limit?: number,
): { skip: number; limit: number } => {
  const validPage = Math.max(page || CONSTANTS.DEFAULT_PAGE, 1);
  const validLimit = Math.min(
    Math.max(limit || CONSTANTS.DEFAULT_LIMIT, 1),
    CONSTANTS.MAX_LIMIT,
  );

  return {
    skip: (validPage - 1) * validLimit,
    limit: validLimit,
  };
};
