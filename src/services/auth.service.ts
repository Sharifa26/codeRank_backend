import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { IUser, IUserPayload } from "../types/index";
import { ApiError } from "../utils/apiError";
import env from "../config/env";
import * as crypto from "node:crypto";
import emailService from "../services/email.service";

const RESET_TTL_MS = 15 * 60 * 1000;

class AuthService {
  /**
   * Register a new user
   */
  async signup(
    username: string,
    email: string,
    password: string,
  ): Promise<{ user: IUser }> {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ApiError(409, "Email already registered");
      }
      throw new ApiError(409, "Username already taken");
    }

    const user = await User.create({ username, email, password });

    return { user };
  }

  /**
   * Authenticate user and return token
   */
  async login(
    email: string,
    password: string,
  ): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new ApiError(401, "Invalid email or email not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password");
    }

    const token = this.generateToken(user);

    user.password = undefined as any;

    return { user, token };
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: IUser): string {
    const payload: IUserPayload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Get user details by ID
   */
  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  /**
   * Forget password and send reset email
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email }).select(
      "+resetPasswordTokenHash +resetPasswordExpiresAt",
    );
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString("hex"); // 64 chars
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await emailService.sendPasswordResetEmail(user.email, resetUrl);
  }

  /**
   * Reset password
   * Requires a valid reset token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    }).select("+resetPasswordTokenHash +resetPasswordExpiresAt");

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = newPassword;
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;

    await user.save();
  }
}

export default new AuthService();
