import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { IUser, IUserPayload } from "../types/index";
import { ApiError } from "../utils/apiError";
import env from "../config/env";

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
}

export default new AuthService();
