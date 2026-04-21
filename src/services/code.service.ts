import CodeSnippet from "../models/code.model";
import {
  ICodeSnippet,
  IExecutionRequest,
  IExecutionResult,
  Language,
  ExecutionStatus,
} from "../types/index";
import { ApiError } from "../utils/apiError";
import { generateShareId, getPaginationParams } from "../utils/helpers";
import dockerService from "./docker.service";

class CodeService {
  /**
   * Execute code through Docker container
   */
  async runCode(
    language: Language,
    code: string,
    stdin: string = "",
  ): Promise<IExecutionResult> {
    const request: IExecutionRequest = { language, code, stdin };
    return dockerService.execute(request);
  }

  /**
   * Save code snippet to database
   */
  async saveCode(
    userId: string,
    title: string,
    language: Language,
    code: string,
    stdin: string = "",
    executionResult?: IExecutionResult,
  ): Promise<ICodeSnippet> {
    const snippetData: any = {
      userId,
      title,
      language,
      code,
      stdin,
    };

    if (executionResult) {
      snippetData.stdout = executionResult.stdout;
      snippetData.stderr = executionResult.stderr;
      snippetData.exitCode = executionResult.exitCode;
      snippetData.executionTime = executionResult.executionTime;
      snippetData.status = executionResult.status;
    }

    const snippet = await CodeSnippet.create(snippetData);
    return snippet;
  }

  /**
   * Get user's code history with pagination
   */
  async getHistory(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    snippets: ICodeSnippet[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { skip, limit: validLimit } = getPaginationParams(page, limit);

    const [snippets, total] = await Promise.all([
      CodeSnippet.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .lean(),
      CodeSnippet.countDocuments({ userId }),
    ]);

    return {
      snippets: snippets as ICodeSnippet[],
      total,
      page: Math.floor(skip / validLimit) + 1,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  /**
   * Get a specific code snippet by ID
   */
  async getCodeById(codeId: string, userId?: string): Promise<ICodeSnippet> {
    const snippet = await CodeSnippet.findById(codeId);

    if (!snippet) {
      throw new ApiError(404, "Code snippet not found");
    }

    if (!snippet.isPublic && userId && snippet.userId.toString() !== userId) {
      throw new ApiError(403, "Access denied to this code snippet");
    }

    return snippet;
  }

  /**
   * Get code snippet by share ID (public access)
   */
  async getCodeByShareId(shareId: string): Promise<ICodeSnippet> {
    const snippet = await CodeSnippet.findOne({ shareId, isPublic: true });

    if (!snippet) {
      throw new ApiError(404, "Shared code snippet not found or is private");
    }

    return snippet;
  }

  /**
   * Generate a share link for a code snippet
   */
  async shareCode(
    codeId: string,
    userId: string,
  ): Promise<{ shareId: string; shareUrl: string }> {
    const snippet = await CodeSnippet.findById(codeId);

    if (!snippet) {
      throw new ApiError(404, "Code snippet not found");
    }

    if (snippet.userId.toString() !== userId) {
      throw new ApiError(403, "You can only share your own code snippets");
    }

    if (snippet.shareId) {
      return {
        shareId: snippet.shareId,
        shareUrl: `/api/v1/code/shared/${snippet.shareId}`,
      };
    }

    let shareId = generateShareId();

    let attempts = 0;
    while (await CodeSnippet.findOne({ shareId })) {
      shareId = generateShareId();
      attempts++;
      if (attempts > 5) {
        throw new ApiError(500, "Failed to generate unique share ID");
      }
    }

    snippet.shareId = shareId;
    snippet.isPublic = true;
    await snippet.save();

    return {
      shareId,
      shareUrl: `/api/v1/code/shared/${shareId}`,
    };
  }
}

export default new CodeService();
