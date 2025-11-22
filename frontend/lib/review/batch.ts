import { FileBatch, ReviewFile, GitHubPRFile } from '@/types';
import { classifyFilePriority } from './priority';

/**
 * Smart Batching Logic
 * Groups files for efficient AI processing
 */

const MAX_FILES_PER_BATCH = 10;
const MAX_TOKENS_PER_BATCH = 15000;
const AVG_TOKENS_PER_LINE = 4; // Rough estimate

/**
 * Estimate tokens for a file's diff
 */
function estimateTokens(diff: string, context: string = ''): number {
  const totalContent = diff + context;
  const lineCount = totalContent.split('\n').length;
  const charCount = totalContent.length;

  // More accurate estimation: combine line count and character count
  const lineBasedEstimate = lineCount * AVG_TOKENS_PER_LINE;
  const charBasedEstimate = charCount / 4; // Roughly 4 chars per token

  return Math.max(lineBasedEstimate, charBasedEstimate);
}

/**
 * Extract directory from file path
 */
function getDirectory(filePath: string): string {
  const parts = filePath.split('/');
  if (parts.length === 1) {
    return 'root';
  }
  // Get first 2 levels of directory (e.g., "app/api" from "app/api/users/route.ts")
  return parts.slice(0, Math.min(2, parts.length - 1)).join('/');
}

/**
 * Convert GitHubPRFile to ReviewFile
 */
function toReviewFile(file: GitHubPRFile, context: string = ''): ReviewFile {
  return {
    path: file.filename,
    diff: file.patch || '',
    context,
    priority: classifyFilePriority(file),
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
  };
}

/**
 * Create smart batches from files
 * Groups files by directory and respects token limits
 */
export function createSmartBatches(files: GitHubPRFile[]): FileBatch[] {
  const batches: FileBatch[] = [];

  // Group files by directory
  const filesByDirectory = new Map<string, ReviewFile[]>();

  for (const file of files) {
    const directory = getDirectory(file.filename);
    const reviewFile = toReviewFile(file);

    if (!filesByDirectory.has(directory)) {
      filesByDirectory.set(directory, []);
    }
    filesByDirectory.get(directory)!.push(reviewFile);
  }

  // Create batches from grouped files
  let batchId = 1;

  for (const [directory, dirFiles] of filesByDirectory) {
    let currentBatch: ReviewFile[] = [];
    let currentTokens = 0;

    for (const file of dirFiles) {
      const fileTokens = estimateTokens(file.diff, file.context);

      // Check if adding this file would exceed limits
      const wouldExceedFileLimit = currentBatch.length >= MAX_FILES_PER_BATCH;
      const wouldExceedTokenLimit = currentTokens + fileTokens > MAX_TOKENS_PER_BATCH;

      if (wouldExceedFileLimit || (wouldExceedTokenLimit && currentBatch.length > 0)) {
        // Save current batch and start new one
        if (currentBatch.length > 0) {
          batches.push({
            batch_id: batchId++,
            directory,
            files: currentBatch,
            estimated_tokens: currentTokens,
          });
        }

        currentBatch = [file];
        currentTokens = fileTokens;
      } else {
        currentBatch.push(file);
        currentTokens += fileTokens;
      }
    }

    // Add remaining files as final batch for this directory
    if (currentBatch.length > 0) {
      batches.push({
        batch_id: batchId++,
        directory,
        files: currentBatch,
        estimated_tokens: currentTokens,
      });
    }
  }

  return batches;
}

/**
 * Create batches prioritizing critical/high priority files
 */
export function createPrioritizedBatches(files: GitHubPRFile[]): FileBatch[] {
  // Sort files by priority first
  const sortedFiles = [...files].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const aPriority = classifyFilePriority(a);
    const bPriority = classifyFilePriority(b);
    return priorityOrder[aPriority] - priorityOrder[bPriority];
  });

  return createSmartBatches(sortedFiles);
}

/**
 * Merge small batches to optimize API calls
 */
export function optimizeBatches(batches: FileBatch[]): FileBatch[] {
  const optimized: FileBatch[] = [];
  let currentBatch: FileBatch | null = null;

  for (const batch of batches) {
    if (!currentBatch) {
      currentBatch = batch;
      continue;
    }

    const combinedFiles = currentBatch.files.length + batch.files.length;
    const combinedTokens = currentBatch.estimated_tokens + batch.estimated_tokens;

    // Merge if it doesn't exceed limits
    if (combinedFiles <= MAX_FILES_PER_BATCH && combinedTokens <= MAX_TOKENS_PER_BATCH) {
      currentBatch = {
        ...currentBatch,
        files: [...currentBatch.files, ...batch.files],
        estimated_tokens: combinedTokens,
        directory: currentBatch.directory === batch.directory
          ? currentBatch.directory
          : 'mixed',
      };
    } else {
      optimized.push(currentBatch);
      currentBatch = batch;
    }
  }

  if (currentBatch) {
    optimized.push(currentBatch);
  }

  // Renumber batch IDs
  return optimized.map((batch, index) => ({
    ...batch,
    batch_id: index + 1,
  }));
}

/**
 * Get batch summary for logging/debugging
 */
export function getBatchSummary(batches: FileBatch[]): string {
  const totalFiles = batches.reduce((sum, batch) => sum + batch.files.length, 0);
  const totalTokens = batches.reduce((sum, batch) => sum + batch.estimated_tokens, 0);
  const avgFilesPerBatch = totalFiles / batches.length;
  const avgTokensPerBatch = totalTokens / batches.length;

  return `${batches.length} batches, ${totalFiles} files, ~${totalTokens.toLocaleString()} tokens (avg: ${Math.round(avgFilesPerBatch)} files/batch, ~${Math.round(avgTokensPerBatch)} tokens/batch)`;
}
