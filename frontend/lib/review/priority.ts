import { GitHubPRFile, FilePriority } from '@/types';

/**
 * Priority Classification System
 * Determines review priority for files based on their path and type
 */

// File patterns by priority level
const PRIORITY_PATTERNS = {
  critical: [
    'api/',
    'app/api/',
    'pages/api/',
    'src/api/',
    'server/api/',
    'routes/api/',
    'auth/',
    'authentication/',
    'lib/auth/',
    'utils/auth/',
    'middleware/',
    'middlewares/',
    '/db.',
    '/database.',
    'prisma/schema',
    'models/',
    'queries/',
    'query/',
    '/security.',
    '/crypto.',
    '/encryption.',
  ],

  high: [
    'lib/',
    'libs/',
    'utils/',
    'utilities/',
    'helpers/',
    'services/',
    'service/',
    'actions/',
    'app/actions/',
    'server/',
    'backend/',
    'core/',
    'hooks/use',
    'hooks/create',
    'store/',
    'stores/',
    'context/',
    'providers/',
  ],

  medium: [
    'components/',
    'component/',
    'app/',
    'pages/',
    'views/',
    'screens/',
    'ui/',
    'styles/',
    '.css',
    '.scss',
    '.less',
    'routes/',
    'router/',
  ],

  low: [
    '.test.',
    '.spec.',
    '__tests__/',
    '__test__/',
    'tests/',
    'test/',
    '.stories.',
    'stories/',
    'storybook/',
    '.mock.',
    '__mocks__/',
    'fixtures/',
    'examples/',
  ],
};

/**
 * Classify file priority based on path
 */
export function classifyFilePriority(file: GitHubPRFile): FilePriority {
  const filename = file.filename.toLowerCase();

  // Check critical patterns first
  for (const pattern of PRIORITY_PATTERNS.critical) {
    if (filename.includes(pattern.toLowerCase())) {
      return 'critical';
    }
  }

  // Then high priority
  for (const pattern of PRIORITY_PATTERNS.high) {
    if (filename.includes(pattern.toLowerCase())) {
      return 'high';
    }
  }

  // Then medium priority
  for (const pattern of PRIORITY_PATTERNS.medium) {
    if (filename.includes(pattern.toLowerCase())) {
      return 'medium';
    }
  }

  // Then low priority
  for (const pattern of PRIORITY_PATTERNS.low) {
    if (filename.includes(pattern.toLowerCase())) {
      return 'low';
    }
  }

  // Default to medium if no match
  return 'medium';
}

/**
 * Sort files by priority (critical first, low last)
 */
export function sortFilesByPriority(files: GitHubPRFile[]): GitHubPRFile[] {
  const priorityOrder: Record<FilePriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...files].sort((a, b) => {
    const aPriority = classifyFilePriority(a);
    const bPriority = classifyFilePriority(b);
    return priorityOrder[aPriority] - priorityOrder[bPriority];
  });
}

/**
 * Group files by priority level
 */
export function groupFilesByPriority(files: GitHubPRFile[]): Record<FilePriority, GitHubPRFile[]> {
  const grouped: Record<FilePriority, GitHubPRFile[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  for (const file of files) {
    const priority = classifyFilePriority(file);
    grouped[priority].push(file);
  }

  return grouped;
}

/**
 * Get priority label for display
 */
export function getPriorityLabel(priority: FilePriority): string {
  return {
    critical: '🔴 Critical',
    high: '🟠 High',
    medium: '🟡 Medium',
    low: '🟢 Low',
  }[priority];
}

/**
 * Get priority color (for UI)
 */
export function getPriorityColor(priority: FilePriority): string {
  return {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'green',
  }[priority];
}

/**
 * Determine if file should be reviewed based on priority and quota
 * Returns true if file should be included in review
 */
export function shouldReviewFile(
  file: GitHubPRFile,
  options: {
    maxFiles?: number;
    currentCount: number;
    minPriority?: FilePriority;
  }
): boolean {
  const { maxFiles = 50, currentCount, minPriority = 'low' } = options;

  // Check if we've reached max files
  if (maxFiles && currentCount >= maxFiles) {
    return false;
  }

  // Check if file meets minimum priority
  const filePriority = classifyFilePriority(file);
  const priorityOrder: Record<FilePriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return priorityOrder[filePriority] <= priorityOrder[minPriority];
}
