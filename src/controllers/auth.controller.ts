import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service";
import { ApiResponse } from "../utils/apiResponse";
import { IAuthRequest } from "../types/index";

class AuthController {
  /**
   * POST /api/v1/auth/signup
   * Register a new user
   */
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password } = req.body;

      const { user } = await authService.signup(username, email, password);

      ApiResponse.success(res, 201, "User registered successfully", {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   * Authenticate user and return token
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const { user, token } = await authService.login(email, password);

      ApiResponse.success(res, 200, "Login successful", {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   * Get current authenticated user details
   */
  async getMe(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = await authService.getUserById(userId);

      ApiResponse.success(res, 200, "User details retrieved", {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Send password reset email
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      await authService.forgotPassword(email);

      ApiResponse.success(
        res,
        200,
        "If the email exists, a password reset link has been sent.",
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   * Reset password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;

      await authService.resetPassword(token, newPassword);

      ApiResponse.success(res, 200, "Password reset successful. Please login.");
    } catch (err) {
      next(err);
    }
  }
}

export default new AuthController();
