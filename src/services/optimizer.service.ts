import { Language } from "../types/index";
import { ApiError } from "../utils/apiError";
import env from "../config/env";

/**
 * Provides AI-powered code optimization suggestions
 * Uses OpenAI API if available, otherwise provides rule-based suggestions
 */
class OptimizerService {
  /**
   * Optimize code using AI or rule-based system
   */
  async optimizeCode(
    language: Language,
    code: string,
  ): Promise<{
    optimizedCode: string;
    suggestions: string[];
    improvements: string[];
  }> {
    if (env.GEMINI_API_KEY) {
      return this.aiOptimize(language, code);
    }

    return this.ruleBasedOptimize(language, code);
  }

  async cleanAndParseJSON(text: string) {
    try {
      // Remove markdown ```json ``` wrappers
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(cleaned);
    } catch (err) {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No valid JSON found");

      return JSON.parse(match[0]);
    }
  }

  /**
   * AI-powered code optimization using OpenAI
   */
  private async aiOptimize(language: Language, code: string) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert ${language} developer.

Return STRICT JSON only:
{
  "optimizedCode": "...",
  "suggestions": ["..."],
  "improvements": ["..."]
}

Optimize this code:
${code}`,
                  },
                ],
              },
            ],
          }),
        },
      );

      const data: any = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) throw new Error("Empty Gemini response");

      const parsed = await this.cleanAndParseJSON(content);

      return {
        optimizedCode: parsed.optimizedCode || code,
        suggestions: parsed.suggestions || [],
        improvements: parsed.improvements || [],
      };
    } catch (err) {
      console.error("Gemini failed:", err);
      return this.ruleBasedOptimize(language, code);
    }
  }

  /**
   * Rule-based code optimization
   * Provides basic static analysis suggestions
   */
  private ruleBasedOptimize(
    language: Language,
    code: string,
  ): {
    optimizedCode: string;
    suggestions: string[];
    improvements: string[];
  } {
    const suggestions: string[] = [];
    const improvements: string[] = [];
    let optimizedCode = code;

    // ==================== Universal Suggestions ====================

    // Check for console.log/print statements
    const debugPatterns: Record<string, RegExp> = {
      javascript: /console\.log\(/g,
      python: /print\(/g,
      java: /System\.out\.println\(/g,
      c: /printf\(/g,
      cpp: /cout\s*<</g,
      ruby: /puts\s/g,
      go: /fmt\.Println\(/g,
      rust: /println!\(/g,
      php: /echo\s/g,
    };

    const debugPattern = debugPatterns[language];
    if (debugPattern) {
      const debugMatches = code.match(debugPattern);
      if (debugMatches && debugMatches.length > 3) {
        suggestions.push(
          `Consider reducing debug output statements (found ${debugMatches.length}). Use a logging framework instead.`,
        );
      }
    }

    // Check for long lines
    const lines = code.split("\n");
    const longLines = lines.filter((line) => line.length > 120);
    if (longLines.length > 0) {
      suggestions.push(
        `${longLines.length} line(s) exceed 120 characters. Consider breaking them up for readability.`,
      );
    }

    // Check for deeply nested code
    let maxIndent = 0;
    lines.forEach((line) => {
      const indent = line.search(/\S/);
      if (indent > maxIndent) maxIndent = indent;
    });
    if (maxIndent > 20) {
      suggestions.push(
        "Deep nesting detected. Consider extracting nested logic into separate functions.",
      );
    }

    // Check for large functions
    if (lines.length > 50) {
      suggestions.push(
        "Code is quite long. Consider breaking it into smaller, reusable functions.",
      );
    }

    // Check for magic numbers
    const magicNumberPattern = /(?<![a-zA-Z_])\b\d{2,}\b(?![a-zA-Z_])/g;
    const magicNumbers = code.match(magicNumberPattern);
    if (magicNumbers && magicNumbers.length > 3) {
      suggestions.push(
        "Multiple magic numbers detected. Consider using named constants for better readability.",
      );
    }

    // Check for TODO/FIXME comments
    if (/(?:TODO|FIXME|HACK|XXX)/i.test(code)) {
      suggestions.push(
        "Found TODO/FIXME comments. Consider addressing these before finalizing the code.",
      );
    }

    // ==================== Language-Specific Suggestions ====================

    switch (language) {
      case Language.JAVASCRIPT:
        if (/var\s+/.test(code)) {
          suggestions.push(
            "Use 'let' or 'const' instead of 'var' for better scoping.",
          );
          optimizedCode = optimizedCode.replace(/\bvar\s+/g, "const ");
          improvements.push("Replaced 'var' with 'const'");
        }
        if (/==(?!=)/.test(code)) {
          suggestions.push(
            "Use strict equality (===) instead of loose equality (==).",
          );
        }
        if (/\.then\(/.test(code) && !/async/.test(code)) {
          suggestions.push(
            "Consider using async/await instead of .then() chains for cleaner code.",
          );
        }
        if (/for\s*\(.*\.length/.test(code)) {
          suggestions.push(
            "Cache array length in for loops or use for...of for better performance.",
          );
        }
        break;

      case Language.PYTHON:
        if (/range\(len\(/.test(code)) {
          suggestions.push(
            "Use 'enumerate()' instead of 'range(len())' for iterating with index.",
          );
        }
        if (/\+\s*=\s*\[/.test(code) || /\.append\(/.test(code)) {
          suggestions.push(
            "Consider using list comprehensions for building lists.",
          );
        }
        if (/except\s*:/.test(code)) {
          suggestions.push(
            "Avoid bare 'except' clauses. Catch specific exceptions.",
          );
        }
        if (/import \*/.test(code)) {
          suggestions.push(
            "Avoid wildcard imports. Import specific names instead.",
          );
        }
        break;

      case Language.JAVA:
        if (/String\s+\w+\s*=\s*""\s*;[\s\S]*\+=/.test(code)) {
          suggestions.push(
            "Use StringBuilder instead of string concatenation in loops.",
          );
        }
        if (!/private|protected/.test(code) && /public/.test(code)) {
          suggestions.push(
            "Consider using appropriate access modifiers (private/protected) for encapsulation.",
          );
        }
        break;

      case Language.CPP:
      case Language.C:
        if (/malloc\(/.test(code) && language === Language.CPP) {
          suggestions.push(
            "Use 'new' operator or smart pointers instead of 'malloc' in C++.",
          );
        }
        if (/goto\s+/.test(code)) {
          suggestions.push(
            "Avoid using 'goto' statements. Use structured control flow.",
          );
        }
        break;

      case Language.RUBY:
        if (/for\s+\w+\s+in/.test(code)) {
          suggestions.push(
            "Use '.each' method instead of 'for..in' loop in Ruby.",
          );
        }
        break;
    }

    // If no suggestions, provide a positive message
    if (suggestions.length === 0) {
      suggestions.push("Code looks clean! No major optimization suggestions.");
    }

    return {
      optimizedCode,
      suggestions,
      improvements,
    };
  }
}

export default new OptimizerService();
