import CodeSnippet from "../models/code.model";
import { ICodeSnippet } from "../types/index";
import { ApiError } from "../utils/apiError";

/**
 * Share Service
 * Handles public code sharing functionality
 */
class ShareService {
  /**
   * Get shared code by shareId - public access, no auth needed
   */
  async getSharedCode(shareId: string): Promise<ICodeSnippet> {
    const snippet = await CodeSnippet.findOne({
      shareId,
      isPublic: true,
    }).lean();

    if (!snippet) {
      throw new ApiError(
        404,
        "Shared code snippet not found or has been made private",
      );
    }

    return snippet as ICodeSnippet;
  }

  /**
   * Revoke share access for a code snippet
   */
  async revokeShare(codeId: string, userId: string): Promise<void> {
    const snippet = await CodeSnippet.findById(codeId);

    if (!snippet) {
      throw new ApiError(404, "Code snippet not found");
    }

    if (snippet.userId.toString() !== userId) {
      throw new ApiError(403, "You can only manage your own code snippets");
    }

    snippet.shareId = null;
    snippet.isPublic = false;
    await snippet.save();
  }
}

export default new ShareService();
