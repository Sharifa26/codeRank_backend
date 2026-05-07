import express, { Application } from "express";
import http from "http";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import connectDB from "./config/db";
import env from "./config/env";
import authRoutes from "./routes/auth.routes";
import codeRoutes from "./routes/code.routes";
import codeController from "./controllers/code.controller";
import { authenticate } from "./middlewares/auth.middleware";
import { generalLimiter } from "./middlewares/rateLimiter.middleware";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/errorHandler.middleware";
import { registerExecutionSocket } from "./socket/execution.socket";
import { IUserPayload } from "./types/index";
import { AUTH_COOKIE_NAME, readCookie } from "./utils/authCookie";

const app: Application = express();
const server = http.createServer(app);
app.set("trust proxy", 1);

const allowedOrigins = new Set(env.FRONTEND_URLS);
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

const io = new SocketIOServer(server, {
  cors: {
    origin: Array.from(allowedOrigins),
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket"],
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const cookieToken = readCookie(
      socket.handshake.headers.cookie,
      AUTH_COOKIE_NAME,
    );
    const authToken = typeof token === "string" && token ? token : cookieToken;

    if (!authToken) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(authToken, env.JWT_SECRET) as IUserPayload;
    socket.data.user = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };

    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

registerExecutionSocket(io);

// ==================== Global Middlewares ====================

// Security headers
app.use(helmet());

// CORS must run before routes and redirects so browser preflight requests
// receive the credentialed CORS headers they need.
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use((req, res, next) => {
  if (
    env.NODE_ENV === "production" &&
    req.headers["x-forwarded-proto"] !== "https" &&
    !req.secure
  ) {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  next();
});

// Request logging
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ==================== Health Check ====================
app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "CodeRank API is running",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ==================== API Routes ====================

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/code", codeRoutes);

app.get(
  "/api/v1/history",
  authenticate,
  generalLimiter,
  codeController.getHistory,
);

// ==================== Error Handling ====================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ==================== Server Startup ====================

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    server.listen(env.PORT, () => {
      console.log(`🚀 Server started on port http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Shutting down gracefully...");
  server.close(() => process.exit(0));
});

startServer();

export default app;
