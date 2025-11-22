import { FileBatch, GroqChatMessage } from '@/types';

/**
 * AI Review Prompts
 * System and user prompts for code review
 */

/**
 * System prompt for code review
 */
export const SYSTEM_PROMPT = `You are an expert code reviewer specializing in security, performance, and code quality.

Your task is to analyze code changes and identify issues in these categories:

1. **Security vulnerabilities**: SQL injection, XSS, hardcoded secrets, unsafe APIs, authentication issues
2. **Performance issues**: N+1 queries, inefficient algorithms, memory leaks, unnecessary computations
3. **Code quality**: High complexity, code duplication, poor naming, missing documentation
4. **Best practices**: Missing error handling, improper TypeScript usage, deprecated APIs

For each issue found, you must provide:
- Exact file path
- Exact line number (from the diff)
- Severity: "critical" | "warning" | "suggestion"
- Category: "security" | "performance" | "quality" | "best-practice"
- Clear, concise message explaining the problem
- Specific suggestion on how to fix it

Rules:
- Only report real issues with high confidence
- Be specific and actionable
- Focus on changes (added/modified lines), not entire file
- Don't report issues in removed lines (lines starting with -)
- Avoid false positives

Output must be valid JSON in this exact format:
{
  "issues": [
    {
      "file": "path/to/file.ts",
      "line": 42,
      "severity": "critical",
      "category": "security",
      "message": "Brief description of the issue",
      "suggestion": "How to fix it"
    }
  ]
}

If no issues found, return: {"issues": []}`;

/**
 * Generate user prompt for a batch of files
 */
export function generateBatchPrompt(batch: FileBatch): string {
  const { directory, files } = batch;

  let prompt = `Review these ${files.length} related files from directory "${directory}":\n\n`;

  files.forEach((file, index) => {
    prompt += `=== FILE ${index + 1}: ${file.path} ===\n`;
    prompt += `Priority: ${file.priority}\n`;
    prompt += `Status: ${file.status}\n`;
    prompt += `Changes: +${file.additions} -${file.deletions}\n\n`;

    if (file.diff) {
      prompt += `DIFF (what was changed):\n`;
      prompt += `\`\`\`diff\n${file.diff}\n\`\`\`\n\n`;
    }

    if (file.context) {
      prompt += `CONTEXT (surrounding code for understanding):\n`;
      prompt += `\`\`\`\n${file.context}\n\`\`\`\n\n`;
    }

    prompt += `---\n\n`;
  });

  prompt += `Analyze all files together as they may have related changes. Return JSON with all issues found.`;

  return prompt;
}

/**
 * Generate messages for Groq API
 */
export function generateReviewMessages(batch: FileBatch): GroqChatMessage[] {
  return [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: generateBatchPrompt(batch),
    },
  ];
}

/**
 * Generate prompt for single file review (legacy/fallback)
 */
export function generateSingleFilePrompt(
  filename: string,
  diff: string,
  context?: string
): GroqChatMessage[] {
  let userPrompt = `Review this file: ${filename}\n\n`;
  userPrompt += `CHANGES:\n\`\`\`diff\n${diff}\n\`\`\`\n\n`;

  if (context) {
    userPrompt += `CONTEXT:\n\`\`\`\n${context}\n\`\`\`\n\n`;
  }

  userPrompt += `Return JSON with all issues found.`;

  return [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: userPrompt,
    },
  ];
}
