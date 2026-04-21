import dotenv from "dotenv";

dotenv.config();

const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/coderank",
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret_change_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  DOCKER_SOCKET: process.env.DOCKER_SOCKET || "/var/run/docker.sock",
  EXECUTION_TIMEOUT: parseInt(process.env.EXECUTION_TIMEOUT || "10000", 10),
  MEMORY_LIMIT: process.env.MEMORY_LIMIT || "256m",
  CPU_LIMIT: parseFloat(process.env.CPU_LIMIT || "0.5"),
  MAX_QUEUE_SIZE: parseInt(process.env.MAX_QUEUE_SIZE || "100", 10),
  RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || "900000",
    10,
  ),
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "100",
    10,
  ),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "",
} as const;

if (env.NODE_ENV === "production") {
  if (env.JWT_SECRET === "default_jwt_secret_change_me") {
    throw new Error("JWT_SECRET must be set in production");
  }
}

export default env;
