import { createHmac, timingSafeEqual } from 'crypto';

/**
 * GitHub Webhook Utilities
 * Handles webhook signature validation and payload verification
 */

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET!;

/**
 * Verify GitHub webhook signature
 * Ensures the webhook actually came from GitHub
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) {
    console.error('Missing webhook signature');
    return false;
  }

  if (!WEBHOOK_SECRET) {
    console.error('GITHUB_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    // Remove 'sha256=' prefix from signature
    const signatureHash = signature.replace('sha256=', '');

    // Calculate expected signature
    const hmac = createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(payload);
    const expectedHash = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signatureHash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Extract owner and repo from full_name (e.g., "owner/repo")
 */
export function parseRepoFullName(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split('/');
  return { owner, repo };
}

/**
 * Check if event should trigger a review
 */
export function shouldProcessEvent(event: string, action: string): boolean {
  // Only process PR events with specific actions
  if (event !== 'pull_request') {
    return false;
  }

  const validActions = ['opened', 'synchronize', 'reopened'];
  return validActions.includes(action);
}

/**
 * Build review comment markdown
 */
export function buildReviewingComment(): string {
  return `## 👀 MergeCheck is reviewing...

Your PR is being analyzed for:
- 🔐 Security vulnerabilities
- ⚡ Performance issues
- 🎯 Code quality
- ✨ Best practices

Results will appear shortly as inline comments and a summary below.`;
}

/**
 * Build summary comment markdown
 */
export function buildSummaryComment(data: {
  total_files: number;
  reviewed_files: number;
  skipped_files: number;
  cache_hits: number;
  critical: number;
  warnings: number;
  suggestions: number;
  ai_calls: number;
  tokens_used: number;
  duration_ms: number;
  critical_issues?: Array<{ file: string; line: number; message: string }>;
  warning_issues?: Array<{ file: string; line: number; message: string }>;
  suggestion_issues?: Array<{ file: string; line: number; message: string }>;
}): string {
  const {
    total_files,
    reviewed_files,
    skipped_files,
    cache_hits,
    critical,
    warnings,
    suggestions,
    ai_calls,
    tokens_used,
    duration_ms,
    critical_issues = [],
    warning_issues = [],
    suggestion_issues = [],
  } = data;

  const duration_seconds = Math.round(duration_ms / 1000);
  const cache_rate = reviewed_files > 0 ? Math.round((cache_hits / reviewed_files) * 100) : 0;
  const total_issues = critical + warnings + suggestions;

  let comment = `## 🤖 MergeCheck Summary\n\n`;

  if (total_issues === 0) {
    comment += `✅ **Looks great!** No issues found.\n\n`;
  } else {
    comment += `✅ Review completed in ${duration_seconds} seconds\n\n`;
  }

  comment += `📊 **Files Analyzed:**\n`;
  comment += `- Total files: ${total_files}\n`;
  comment += `- Reviewed: ${reviewed_files} (critical and high priority)\n`;
  comment += `- Skipped: ${skipped_files} (lockfiles, generated, low priority)\n`;
  if (cache_hits > 0) {
    comment += `- Cached results: ${cache_hits} files (instant)\n`;
  }
  comment += `\n`;

  if (total_issues > 0) {
    comment += `🔍 **Issues Found:** ${total_issues} total\n\n`;

    if (critical > 0) {
      comment += `🔴 **Critical: ${critical}**\n`;
      critical_issues.slice(0, 3).forEach(issue => {
        comment += `- \`${issue.file}:${issue.line}\` - ${issue.message}\n`;
      });
      if (critical_issues.length > 3) {
        comment += `- ... and ${critical_issues.length - 3} more\n`;
      }
      comment += `\n`;
    }

    if (warnings > 0) {
      comment += `🟡 **Warnings: ${warnings}**\n`;
      warning_issues.slice(0, 3).forEach(issue => {
        comment += `- \`${issue.file}:${issue.line}\` - ${issue.message}\n`;
      });
      if (warning_issues.length > 3) {
        comment += `- ... and ${warning_issues.length - 3} more\n`;
      }
      comment += `\n`;
    }

    if (suggestions > 0) {
      comment += `💡 **Suggestions: ${suggestions}**\n`;
      suggestion_issues.slice(0, 3).forEach(issue => {
        comment += `- \`${issue.file}:${issue.line}\` - ${issue.message}\n`;
      });
      if (suggestion_issues.length > 3) {
        comment += `- ... and ${suggestion_issues.length - 3} more\n`;
      }
      comment += `\n`;
    }
  }

  comment += `---\n`;
  comment += `⚡ **Performance:**\n`;
  comment += `- AI calls: ${ai_calls} batch${ai_calls !== 1 ? 'es' : ''}\n`;
  if (cache_hits > 0) {
    comment += `- Cache hits: ${cache_hits}/${reviewed_files} files (${cache_rate}%)\n`;
  }
  comment += `- Tokens used: ~${tokens_used.toLocaleString()}\n`;
  comment += `\n`;
  comment += `💾 Future reviews of similar code will be instant (cached)\n`;

  return comment;
}

/**
 * Build inline comment markdown
 */
export function buildInlineComment(data: {
  severity: 'critical' | 'warning' | 'suggestion';
  category: string;
  message: string;
  suggestion?: string;
  line: number;
}): string {
  const { severity, category, message, suggestion, line } = data;

  const severityEmoji = {
    critical: '🔴',
    warning: '🟡',
    suggestion: '💡',
  }[severity];

  const severityLabel = {
    critical: 'Critical Issue',
    warning: 'Warning',
    suggestion: 'Suggestion',
  }[severity];

  let comment = `${severityEmoji} **${severityLabel}** - ${category} - Line ${line}\n\n`;
  comment += `${message}\n`;

  if (suggestion) {
    comment += `\n**Suggested fix:**\n${suggestion}\n`;
  }

  return comment;
}
