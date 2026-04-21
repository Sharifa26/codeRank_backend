import { Request } from "express";
import { Document, Types } from "mongoose";

// ==================== User Types ====================
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;

  resetPasswordTokenHash?: string | null;
  resetPasswordExpiresAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPayload {
  userId: string;
  email: string;
  username: string;
}

export interface IAuthRequest extends Request {
  user?: IUserPayload;
}

// ==================== Code Types ====================
export enum Language {
  JAVASCRIPT = "javascript",
  PYTHON = "python",
  JAVA = "java",
  C = "c",
  CPP = "cpp",
  RUBY = "ruby",
  GO = "go",
  RUST = "rust",
  PHP = "php",
}

export interface ICodeSnippet extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  language: Language;
  code: string;
  stdin: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTime: number | null;
  status: ExecutionStatus;
  shareId: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ExecutionStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  ERROR = "error",
  TIMEOUT = "timeout",
}

// ==================== Execution Types ====================
export interface IExecutionRequest {
  language: Language;
  code: string;
  stdin?: string;
}

export interface IExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  status: ExecutionStatus;
}

// ==================== Queue Types ====================
export interface IQueueJob {
  id: string;
  executionRequest: IExecutionRequest;
  resolve: (value: IExecutionResult) => void;
  reject: (reason: any) => void;
  timestamp: number;
}

// ==================== Language Config ====================
export interface ILanguageConfig {
  image: string;
  fileName: string;
  compileCmd?: string;
  runCmd: string;
  timeout: number;
}

// ==================== API Response Types ====================
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T | undefined;
  error?: string;
}
