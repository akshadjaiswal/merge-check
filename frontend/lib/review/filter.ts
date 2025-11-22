import { GitHubPRFile, SkippedFile } from '@/types';

/**
 * File Filtering Logic
 * Determines which files to review and which to skip
 */

// Files that should NEVER be reviewed
const SKIP_PATTERNS = [
  // Lockfiles
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'Gemfile.lock',
  'Cargo.lock',
  'poetry.lock',
  'composer.lock',

  // Generated/Build files
  'dist/',
  'build/',
  '.next/',
  'out/',
  'coverage/',
  '__generated__/',
  '.cache/',
  'public/build/',
  'static/',

  // Generated code patterns
  '.generated.ts',
  '.generated.js',
  '.generated.tsx',
  '.generated.jsx',
  '-generated.',
  '_generated.',

  // Dependencies
  'node_modules/',
  'vendor/',
  '.yarn/',
  '.pnp.',

  // Binary/Media files
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
  '.avif',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.mp4',
  '.mp3',
  '.webm',
  '.ogg',
  '.wav',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',

  // Minified files
  '.min.js',
  '.min.css',
  '.bundle.js',
  '.chunk.js',

  // Database/Migrations (often auto-generated)
  'migrations/',
  'migrate/',
  '.sql',
  'schema.prisma.backup',

  // Config files (mostly safe, low priority)
  'tsconfig.json',
  'jsconfig.json',
  'package.json',
  '.eslintrc',
  '.prettierrc',
  '.editorconfig',
  'vite.config',
  'webpack.config',
  'rollup.config',
  'jest.config',
  'vitest.config',
  'tailwind.config',
  'postcss.config',
  'next.config',
  'remix.config',

  // Documentation
  '.md',
  '.mdx',
  'LICENSE',
  'CHANGELOG',
  'README',
  'CONTRIBUTING',
  'CODE_OF_CONDUCT',

  // Git/CI
  '.gitignore',
  '.gitattributes',
  '.github/',
  '.gitlab-ci',
  '.circleci/',
  'Jenkinsfile',

  // IDE
  '.vscode/',
  '.idea/',
  '.DS_Store',
  '.env.example',
  '.env.local.example',
];

/**
 * Check if a file matches any skip pattern
 */
function matchesSkipPattern(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();

  return SKIP_PATTERNS.some(pattern => {
    if (pattern.endsWith('/')) {
      // Directory pattern
      return lowerFilename.includes(pattern.toLowerCase());
    } else if (pattern.startsWith('.')) {
      // Extension pattern
      return lowerFilename.endsWith(pattern.toLowerCase());
    } else {
      // Exact or contains pattern
      return lowerFilename.includes(pattern.toLowerCase());
    }
  });
}

/**
 * Determine skip reason for a file
 */
function getSkipReason(file: GitHubPRFile): SkippedFile['reason'] | null {
  const filename = file.filename.toLowerCase();

  // Lockfiles
  if (filename.includes('lock') || filename.includes('.lock')) {
    return 'lockfile';
  }

  // Generated files
  if (
    filename.includes('generated') ||
    filename.includes('dist/') ||
    filename.includes('build/') ||
    filename.includes('.next/')
  ) {
    return 'generated';
  }

  // Binary/Media
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.mp4', '.mp3'];
  if (binaryExtensions.some(ext => filename.endsWith(ext))) {
    return 'binary';
  }

  // Config files
  if (
    filename.endsWith('.json') ||
    filename.includes('config') ||
    filename.includes('.rc')
  ) {
    return 'config';
  }

  // Documentation
  if (filename.endsWith('.md') || filename.endsWith('.mdx') || filename.includes('license')) {
    return 'documentation';
  }

  // Test files
  if (
    filename.includes('.test.') ||
    filename.includes('.spec.') ||
    filename.includes('__tests__/') ||
    filename.includes('__mocks__/')
  ) {
    return 'test';
  }

  // Large files (>500 lines changed)
  if (file.changes > 500) {
    return 'large';
  }

  return null;
}

/**
 * Filter files for review
 * Returns files to review and files to skip with reasons
 */
export function filterFilesForReview(files: GitHubPRFile[]): {
  filesToReview: GitHubPRFile[];
  skippedFiles: SkippedFile[];
} {
  const filesToReview: GitHubPRFile[] = [];
  const skippedFiles: SkippedFile[] = [];

  for (const file of files) {
    // Check if matches skip pattern
    if (matchesSkipPattern(file.filename)) {
      const reason = getSkipReason(file);
      skippedFiles.push({
        path: file.filename,
        reason: reason || 'config',
      });
      continue;
    }

    // Check for specific skip reasons
    const skipReason = getSkipReason(file);
    if (skipReason) {
      skippedFiles.push({
        path: file.filename,
        reason: skipReason,
      });
      continue;
    }

    // File should be reviewed
    filesToReview.push(file);
  }

  return { filesToReview, skippedFiles };
}

/**
 * Check if file extension is reviewable
 */
export function isReviewableExtension(filename: string): boolean {
  const reviewableExtensions = [
    '.ts', '.tsx', '.js', '.jsx',
    '.py', '.go', '.rs', '.rb',
    '.java', '.kt', '.swift',
    '.c', '.cpp', '.h', '.hpp',
    '.php', '.cs', '.scala',
    '.vue', '.svelte',
    '.sql', '.graphql',
  ];

  return reviewableExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}
