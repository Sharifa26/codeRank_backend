import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
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

const app: Application = express();

// ==================== Global Middlewares ====================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

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

    app.listen(env.PORT, () => {
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
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

startServer();

export default app;
