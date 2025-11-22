import { AIIssue } from '@/types';

/**
 * AI Response Parser
 * Parses and validates Groq API responses
 */

interface RawAIResponse {
  issues: Array<{
    file: string;
    line: number;
    severity: string;
    category: string;
    message: string;
    suggestion?: string;
  }>;
}

/**
 * Validate severity value
 */
function isValidSeverity(severity: string): severity is 'critical' | 'warning' | 'suggestion' {
  return ['critical', 'warning', 'suggestion'].includes(severity);
}

/**
 * Validate category value
 */
function isValidCategory(category: string): category is 'security' | 'performance' | 'quality' | 'best-practice' {
  return ['security', 'performance', 'quality', 'best-practice'].includes(category);
}

/**
 * Parse and validate AI response
 */
export function parseAIResponse(response: any): AIIssue[] {
  if (!response || typeof response !== 'object') {
    console.error('Invalid AI response: not an object');
    return [];
  }

  if (!Array.isArray(response.issues)) {
    console.error('Invalid AI response: issues is not an array');
    return [];
  }

  const validIssues: AIIssue[] = [];

  for (const issue of response.issues) {
    // Validate required fields
    if (!issue.file || typeof issue.file !== 'string') {
      console.warn('Skipping issue: missing or invalid file');
      continue;
    }

    if (!issue.line || typeof issue.line !== 'number') {
      console.warn('Skipping issue: missing or invalid line number');
      continue;
    }

    if (!issue.message || typeof issue.message !== 'string') {
      console.warn('Skipping issue: missing or invalid message');
      continue;
    }

    // Validate severity
    if (!isValidSeverity(issue.severity)) {
      console.warn(`Skipping issue: invalid severity "${issue.severity}"`);
      continue;
    }

    // Validate category
    if (!isValidCategory(issue.category)) {
      console.warn(`Skipping issue: invalid category "${issue.category}"`);
      continue;
    }

    // Add valid issue
    validIssues.push({
      file: issue.file,
      line: issue.line,
      severity: issue.severity,
      category: issue.category,
      message: issue.message,
      suggestion: issue.suggestion,
    });
  }

  return validIssues;
}

/**
 * Group issues by file
 */
export function groupIssuesByFile(issues: AIIssue[]): Map<string, AIIssue[]> {
  const grouped = new Map<string, AIIssue[]>();

  for (const issue of issues) {
    if (!grouped.has(issue.file)) {
      grouped.set(issue.file, []);
    }
    grouped.get(issue.file)!.push(issue);
  }

  return grouped;
}

/**
 * Group issues by severity
 */
export function groupIssuesBySeverity(issues: AIIssue[]): {
  critical: AIIssue[];
  warning: AIIssue[];
  suggestion: AIIssue[];
} {
  return {
    critical: issues.filter(i => i.severity === 'critical'),
    warning: issues.filter(i => i.severity === 'warning'),
    suggestion: issues.filter(i => i.severity === 'suggestion'),
  };
}

/**
 * Count issues by severity
 */
export function countIssuesBySeverity(issues: AIIssue[]): {
  critical: number;
  warning: number;
  suggestion: number;
  total: number;
} {
  const grouped = groupIssuesBySeverity(issues);
  return {
    critical: grouped.critical.length,
    warning: grouped.warning.length,
    suggestion: grouped.suggestion.length,
    total: issues.length,
  };
}

/**
 * Deduplicate issues (same file, line, and message)
 */
export function deduplicateIssues(issues: AIIssue[]): AIIssue[] {
  const seen = new Set<string>();
  const unique: AIIssue[] = [];

  for (const issue of issues) {
    const key = `${issue.file}:${issue.line}:${issue.message}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(issue);
    }
  }

  return unique;
}

/**
 * Sort issues by severity (critical first) and then by file/line
 */
export function sortIssues(issues: AIIssue[]): AIIssue[] {
  const severityOrder = { critical: 0, warning: 1, suggestion: 2 };

  return [...issues].sort((a, b) => {
    // First by severity
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // Then by file
    const fileDiff = a.file.localeCompare(b.file);
    if (fileDiff !== 0) return fileDiff;

    // Then by line
    return a.line - b.line;
  });
}
