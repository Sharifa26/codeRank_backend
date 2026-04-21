import { Response } from "express";
import { IApiResponse } from "../types/index";

/**
 * Standardized API response handler
 * Ensures consistent response format across all endpoints
 */
export class ApiResponse {
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
  ): Response {
    const response: IApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    statusCode: number,
    message: string,
    data?: any,
    error?: string,
  ): Response {
    const response: IApiResponse = {
      success: false,
      message,
      ...(data !== undefined ? { data } : {}),
      error,
    };
    return res.status(statusCode).json(response);
  }
}
