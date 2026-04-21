import { Request, Response, NextFunction } from "express";
import codeService from "../services/code.service";
import shareService from "../services/share.service";
import optimizerService from "../services/optimizer.service";
import { ApiResponse } from "../utils/apiResponse";
import { IAuthRequest } from "../types/index";
import queueService from "../services/queue.service";

class CodeController {
  /**
   * POST /api/v1/code/run
   * Execute code in specified language
   */
  async runCode(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { language, code, stdin } = req.body;

      const result = await codeService.runCode(language, code, stdin);

      ApiResponse.success(res, 200, "Code executed successfully", {
        output: result.stdout,
        error: result.stderr,
        exitCode: result.exitCode,
        executionTime: `${result.executionTime}ms`,
        status: result.status,
        queueStatus: queueService.getStatus(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/code/save
   * Save code snippet (optionally with execution)
   */
  async saveCode(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { title, language, code, stdin } = req.body;
      const userId = req.user!.userId;

      let executionResult;
      if (req.body.execute) {
        executionResult = await codeService.runCode(language, code, stdin);
      }

      const snippet = await codeService.saveCode(
        userId,
        title || "Untitled",
        language,
        code,
        stdin,
        executionResult,
      );

      ApiResponse.success(res, 201, "Code saved successfully", {
        snippet,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/history
   * Get user's code execution history
   */
  async getHistory(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const history = await codeService.getHistory(userId, page, limit);

      ApiResponse.success(res, 200, "History retrieved successfully", history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/code/:id
   * Get a specific code snippet by ID
   */
  async getCodeById(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user?.userId;

      const snippet = await codeService.getCodeById(id, userId);

      ApiResponse.success(res, 200, "Code snippet retrieved successfully", {
        snippet,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/code/share
   * Generate share link for a code snippet
   */
  async shareCode(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { codeId } = req.body;
      const userId = req.user!.userId;

      const shareData = await codeService.shareCode(codeId, userId);

      ApiResponse.success(res, 200, "Share link generated successfully", {
        shareId: shareData.shareId,
        shareUrl: shareData.shareUrl,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/code/shared/:shareId
   * Get shared code snippet (public - no auth required)
   */
  async getSharedCode(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { shareId } = req.params as { shareId: string };
      const snippet = await shareService.getSharedCode(shareId);

      ApiResponse.success(res, 200, "Shared code retrieved successfully", {
        snippet,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/code/optimize
   * Optimize code using AI or rule-based system
   */
  async optimizeCode(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { language, code } = req.body;

      const result = await optimizerService.optimizeCode(language, code);

      ApiResponse.success(res, 200, "Code optimization complete", {
        optimizedCode: result.optimizedCode,
        suggestions: result.suggestions,
        improvements: result.improvements,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CodeController();
