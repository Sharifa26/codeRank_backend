import { Router } from "express";
import codeController from "../controllers/code.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import {
  executionLimiter,
  generalLimiter,
} from "../middlewares/rateLimiter.middleware";
import {
  runCodeSchema,
  saveCodeSchema,
  shareCodeSchema,
  optimizeCodeSchema,
} from "../validators/code.validator";

const router = Router();

router.get("/shared/:shareId", codeController.getSharedCode);

router.post(
  "/run",
  authenticate,
  executionLimiter,
  validate(runCodeSchema),
  codeController.runCode,
);

router.post(
  "/save",
  authenticate,
  generalLimiter,
  validate(saveCodeSchema),
  codeController.saveCode,
);

router.get("/history", authenticate, generalLimiter, codeController.getHistory);

router.get("/:id", authenticate, codeController.getCodeById);

router.post(
  "/share",
  authenticate,
  generalLimiter,
  validate(shareCodeSchema),
  codeController.shareCode,
);

router.post(
  "/optimize",
  authenticate,
  executionLimiter,
  validate(optimizeCodeSchema),
  codeController.optimizeCode,
);

export default router;
