import { QuickCheckIssue } from '@/types';

/**
 * Quick Regex-Based Security and Quality Checks
 * Fast pattern matching for common issues (no AI needed)
 */

interface QuickCheckPattern {
  name: string;
  regex: RegExp;
  severity: 'critical' | 'warning' | 'suggestion';
  category: 'security' | 'performance' | 'quality' | 'best-practice';
  message: string;
  suggestion?: string;
}

// Quick check patterns
const QUICK_CHECK_PATTERNS: QuickCheckPattern[] = [
  // Security Issues
  {
    name: 'sql_injection',
    regex: /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\$\{|`SELECT.*\$\{|\.query\([`'"]SELECT.*\$\{/gi,
    severity: 'critical',
    category: 'security',
    message: 'Potential SQL injection vulnerability detected',
    suggestion: 'Use parameterized queries or prepared statements instead of string interpolation',
  },
  {
    name: 'hardcoded_api_key',
    regex: /(api[_-]?key|apikey)\s*=\s*['"][a-zA-Z0-9]{20,}['"]|AKIA[0-9A-Z]{16}/gi,
    severity: 'critical',
    category: 'security',
    message: 'Hardcoded API key or AWS credential detected',
    suggestion: 'Move sensitive keys to environment variables',
  },
  {
    name: 'hardcoded_password',
    regex: /(password|passwd|pwd)\s*=\s*['"][^'"]{8,}['"]/gi,
    severity: 'critical',
    category: 'security',
    message: 'Hardcoded password detected',
    suggestion: 'Use environment variables or secure key management',
  },
  {
    name: 'hardcoded_secret',
    regex: /(secret|token|bearer)\s*=\s*['"][a-zA-Z0-9]{20,}['"]/gi,
    severity: 'critical',
    category: 'security',
    message: 'Hardcoded secret or token detected',
    suggestion: 'Move secrets to environment variables',
  },
  {
    name: 'dangerous_html',
    regex: /dangerouslySetInnerHTML|innerHTML\s*=/gi,
    severity: 'warning',
    category: 'security',
    message: 'Potential XSS vulnerability (dangerouslySetInnerHTML or innerHTML)',
    suggestion: 'Sanitize user input before rendering HTML, or use safer alternatives',
  },
  {
    name: 'eval_usage',
    regex: /\beval\s*\(|new\s+Function\s*\(/gi,
    severity: 'critical',
    category: 'security',
    message: 'Use of eval() or Function() constructor detected',
    suggestion: 'Avoid eval() as it can execute arbitrary code. Use safer alternatives',
  },

  // Performance Issues
  {
    name: 'missing_await',
    regex: /\.(findMany|findUnique|findFirst|create|update|delete|execute)\([^)]*\)\s*;(?!\s*\))/gi,
    severity: 'warning',
    category: 'performance',
    message: 'Possible missing await on async database operation',
    suggestion: 'Add await keyword before async operations',
  },
  {
    name: 'sync_file_operations',
    regex: /readFileSync|writeFileSync|existsSync|mkdirSync/gi,
    severity: 'suggestion',
    category: 'performance',
    message: 'Synchronous file operation detected',
    suggestion: 'Consider using async versions (readFile, writeFile, etc.) for better performance',
  },

  // Code Quality
  {
    name: 'console_log',
    regex: /console\.(log|debug|info|warn)\(/gi,
    severity: 'suggestion',
    category: 'quality',
    message: 'Console statement found',
    suggestion: 'Remove console statements before production, or use a proper logging library',
  },
  {
    name: 'todo_comment',
    regex: /\/\/\s*TODO|\/\/\s*FIXME|\/\/\s*HACK|\/\*\s*TODO|\/\*\s*FIXME/gi,
    severity: 'suggestion',
    category: 'quality',
    message: 'TODO/FIXME comment found',
    suggestion: 'Consider creating a task or issue to track this work',
  },
  {
    name: 'any_type',
    regex: /:\s*any\b|<any>|Array<any>/gi,
    severity: 'suggestion',
    category: 'best-practice',
    message: 'Use of "any" type detected',
    suggestion: 'Specify proper types instead of using "any" for better type safety',
  },

  // Best Practices
  {
    name: 'no_error_handling',
    regex: /fetch\([^)]+\)(?!\s*\.catch)(?!\s*\.then\([^)]*catch)/gi,
    severity: 'warning',
    category: 'best-practice',
    message: 'fetch() without error handling',
    suggestion: 'Add .catch() or wrap in try-catch for proper error handling',
  },
  {
    name: 'process_env_access',
    regex: /process\.env\.[A-Z_]+(?!\s*\|\|)/gi,
    severity: 'suggestion',
    category: 'best-practice',
    message: 'Accessing environment variable without fallback',
    suggestion: 'Provide a default value or validate the env variable exists',
  },
];

/**
 * Extract line number from diff patch
 */
function getLineNumberFromPatch(patch: string, matchIndex: number): number {
  const lines = patch.substring(0, matchIndex).split('\n');
  let currentLine = 0;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      // Parse hunk header to get starting line number
      const match = line.match(/@@ -\d+,?\d* \+(\d+),?\d* @@/);
      if (match) {
        currentLine = parseInt(match[1], 10);
      }
    } else if (line.startsWith('+')) {
      currentLine++;
    } else if (!line.startsWith('-')) {
      currentLine++;
    }
  }

  return currentLine || 1;
}

/**
 * Run quick checks on a file's diff
 */
export function runQuickChecks(filename: string, patch: string | undefined): QuickCheckIssue[] {
  if (!patch) {
    return [];
  }

  const issues: QuickCheckIssue[] = [];

  // Only check added lines (lines starting with +)
  const addedLines = patch
    .split('\n')
    .filter(line => line.startsWith('+') && !line.startsWith('+++'))
    .join('\n');

  for (const pattern of QUICK_CHECK_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.regex);

    while ((match = regex.exec(addedLines)) !== null) {
      const line = getLineNumberFromPatch(patch, match.index);

      issues.push({
        type: pattern.name as any,
        file: filename,
        line,
        severity: pattern.severity,
        category: pattern.category,
        message: pattern.message,
        suggestion: pattern.suggestion,
      });
    }
  }

  return issues;
}

/**
 * Run quick checks on multiple files
 */
export function runQuickChecksOnFiles(
  files: Array<{ filename: string; patch?: string }>
): QuickCheckIssue[] {
  const allIssues: QuickCheckIssue[] = [];

  for (const file of files) {
    const fileIssues = runQuickChecks(file.filename, file.patch);
    allIssues.push(...fileIssues);
  }

  return allIssues;
}

/**
 * Group quick check issues by severity
 */
export function groupQuickChecksBySeverity(issues: QuickCheckIssue[]): {
  critical: QuickCheckIssue[];
  warning: QuickCheckIssue[];
  suggestion: QuickCheckIssue[];
} {
  return {
    critical: issues.filter(i => i.severity === 'critical'),
    warning: issues.filter(i => i.severity === 'warning'),
    suggestion: issues.filter(i => i.severity === 'suggestion'),
  };
}
