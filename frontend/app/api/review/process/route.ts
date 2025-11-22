import { NextRequest, NextResponse } from 'next/server';
import { GitHubAPIClient } from '@/lib/github/api';
import { filterFilesForReview } from '@/lib/review/filter';
import { sortFilesByPriority } from '@/lib/review/priority';
import { runQuickChecksOnFiles, groupQuickChecksBySeverity } from '@/lib/review/quick-check';
import { batchCheckCache, storeInCache } from '@/lib/review/cache';
import { createPrioritizedBatches, optimizeBatches, getBatchSummary } from '@/lib/review/batch';
import { groqClient } from '@/lib/groq/client';
import { generateReviewMessages } from '@/lib/groq/prompts';
import { parseAIResponse, deduplicateIssues, sortIssues, groupIssuesBySeverity } from '@/lib/groq/parser';
import { completeReview, markReviewFailed, createComments } from '@/lib/supabase/queries';
import { buildSummaryComment, buildInlineComment } from '@/lib/github/webhooks';
import { AIIssue, QuickCheckIssue } from '@/types';

/**
 * Review Processing Engine
 * The core AI-powered review logic
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify internal auth
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.GITHUB_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      reviewId,
      installationId,
      owner,
      repo,
      prNumber,
      headSha,
      userToken, // Optional: for manual triggers
    } = await request.json();

    console.log(`🔍 Starting review ${reviewId} for PR #${prNumber} in ${owner}/${repo}`);

    // Step 1: Initialize GitHub client
    // For manual triggers (installationId = 0), use userToken instead
    const githubClient = installationId && installationId > 0
      ? await GitHubAPIClient.fromInstallation(installationId)
      : GitHubAPIClient.fromUserToken(userToken);

    // Step 2: Fetch PR files
    console.log('📁 Fetching PR files...');
    const allFiles = await githubClient.getPRFiles(owner, repo, prNumber);
    console.log(`Found ${allFiles.length} files`);

    // Step 3: Filter files
    console.log('🔎 Filtering files...');
    const { filesToReview, skippedFiles } = filterFilesForReview(allFiles);
    console.log(`Reviewing ${filesToReview.length} files, skipping ${skippedFiles.length}`);

    if (filesToReview.length === 0) {
      console.log('No files to review');
      await completeReview(reviewId, {
        total_files: allFiles.length,
        reviewed_files: 0,
        skipped_files: skippedFiles.length,
        issues_found: 0,
        critical_count: 0,
        warning_count: 0,
        suggestion_count: 0,
        ai_calls_made: 0,
        cache_hits: 0,
        tokens_used: 0,
        review_duration_ms: Date.now() - startTime,
      });

      await githubClient.postPRComment(
        owner,
        repo,
        prNumber,
        '✅ **MergeCheck**: No reviewable files found in this PR.'
      );

      return NextResponse.json({ message: 'No files to review' });
    }

    // Step 4: Sort by priority
    const sortedFiles = sortFilesByPriority(filesToReview);

    // Step 5: Run quick checks
    console.log('⚡ Running quick checks...');
    const quickCheckIssues = runQuickChecksOnFiles(sortedFiles);
    console.log(`Quick checks found ${quickCheckIssues.length} issues`);

    // Post quick check issues immediately (skip if posting fails - e.g., for manual triggers)
    if (quickCheckIssues.length > 0) {
      try {
        await postQuickCheckIssues(githubClient, owner, repo, prNumber, headSha, quickCheckIssues);
      } catch (error) {
        console.warn('Failed to post quick check issues to GitHub (will save to DB):', error);
      }
    }

    // Step 6: Check cache
    console.log('💾 Checking cache...');
    const cacheableFiles = sortedFiles.map(f => ({
      path: f.filename,
      diff: f.patch || '',
    }));
    const cachedResults = await batchCheckCache(cacheableFiles);
    console.log(`Cache hits: ${cachedResults.size}/${sortedFiles.length}`);

    // Step 7: Separate cached and uncached files
    const uncachedFiles = sortedFiles.filter(f => !cachedResults.has(f.filename));
    const cachedIssues: AIIssue[] = [];

    for (const [filePath, issues] of cachedResults) {
      cachedIssues.push(...issues);
    }

    // Step 8: Create batches for AI review
    let aiIssues: AIIssue[] = [];
    let totalTokensUsed = 0;
    let aiCallsMade = 0;

    if (uncachedFiles.length > 0) {
      console.log(`🤖 Creating AI batches for ${uncachedFiles.length} uncached files...`);
      const batches = optimizeBatches(createPrioritizedBatches(uncachedFiles));
      console.log(getBatchSummary(batches));

      // Process batches in parallel (up to 3 at a time to avoid rate limits)
      const batchChunks = chunkArray(batches, 3);

      for (const chunk of batchChunks) {
        const chunkResults = await Promise.allSettled(
          chunk.map(batch => processAIBatch(batch))
        );

        for (const result of chunkResults) {
          if (result.status === 'fulfilled') {
            aiIssues.push(...result.value.issues);
            totalTokensUsed += result.value.tokensUsed;
            aiCallsMade++;

            // Store in cache
            for (const file of result.value.batch.files) {
              const fileIssues = result.value.issues.filter(i => i.file === file.path);
              await storeInCache(file.path, file.diff, fileIssues);
            }
          } else {
            console.error('Batch processing failed:', result.reason);
          }
        }
      }
    }

    // Step 9: Combine all issues
    const allAIIssues = [...cachedIssues, ...aiIssues];
    const allIssues = [...quickCheckIssues.map(convertQuickCheckToAIIssue), ...allAIIssues];
    const uniqueIssues = deduplicateIssues(allIssues);
    const sortedIssues = sortIssues(uniqueIssues);

    console.log(`📝 Total issues found: ${sortedIssues.length}`);

    // Step 10: Post inline comments (skip if fails - comments are in DB anyway)
    console.log('💬 Posting inline comments...');
    try {
      await postInlineComments(githubClient, owner, repo, prNumber, headSha, sortedIssues);
    } catch (error) {
      console.warn('Failed to post inline comments to GitHub (will save to DB):', error);
    }

    // Step 11: Save comments to database
    await createComments(
      sortedIssues.map(issue => ({
        review_id: reviewId,
        file_path: issue.file,
        line_number: issue.line,
        severity: issue.severity,
        category: issue.category,
        message: issue.message,
        suggestion: issue.suggestion,
        was_cached: cachedResults.has(issue.file),
      }))
    );

    // Step 12: Post summary comment (this usually works even with user tokens)
    const { critical, warning, suggestion } = groupIssuesBySeverity(sortedIssues);
    const summaryComment = buildSummaryComment({
      total_files: allFiles.length,
      reviewed_files: filesToReview.length,
      skipped_files: skippedFiles.length,
      cache_hits: cachedResults.size,
      critical: critical.length,
      warnings: warning.length,
      suggestions: suggestion.length,
      ai_calls: aiCallsMade,
      tokens_used: totalTokensUsed,
      duration_ms: Date.now() - startTime,
      critical_issues: critical.slice(0, 3).map(i => ({ file: i.file, line: i.line, message: i.message })),
      warning_issues: warning.slice(0, 3).map(i => ({ file: i.file, line: i.line, message: i.message })),
      suggestion_issues: suggestion.slice(0, 3).map(i => ({ file: i.file, line: i.line, message: i.message })),
    });

    try {
      await githubClient.postPRComment(owner, repo, prNumber, summaryComment);
    } catch (error) {
      console.warn('Failed to post summary comment to GitHub:', error);
    }

    // Step 13: Complete review in database
    await completeReview(reviewId, {
      total_files: allFiles.length,
      reviewed_files: filesToReview.length,
      skipped_files: skippedFiles.length,
      issues_found: sortedIssues.length,
      critical_count: critical.length,
      warning_count: warning.length,
      suggestion_count: suggestion.length,
      ai_calls_made: aiCallsMade,
      cache_hits: cachedResults.size,
      tokens_used: totalTokensUsed,
      ai_response: { issues: sortedIssues },
      review_duration_ms: Date.now() - startTime,
    });

    console.log(`✅ Review completed in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      issues_found: sortedIssues.length,
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Review processing error:', error);

    // Mark review as failed
    const { reviewId } = await request.json().catch(() => ({}));
    if (reviewId) {
      await markReviewFailed(reviewId, error instanceof Error ? error.message : 'Unknown error');
    }

    return NextResponse.json(
      { error: 'Review processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Process a single AI batch
 */
async function processAIBatch(batch: any) {
  const messages = generateReviewMessages(batch);

  const response = await groqClient.createJSONCompletion({
    messages,
    model: 'llama-3.1-70b-versatile',
    temperature: 0.3,
  });

  const issues = parseAIResponse(response);
  const tokensUsed = response.usage?.total_tokens || 0;

  return { batch, issues, tokensUsed };
}

/**
 * Post quick check issues as inline comments
 */
async function postQuickCheckIssues(
  client: GitHubAPIClient,
  owner: string,
  repo: string,
  prNumber: number,
  commitId: string,
  issues: QuickCheckIssue[]
) {
  for (const issue of issues.slice(0, 10)) { // Limit to 10 quick check comments
    try {
      const comment = buildInlineComment({
        severity: issue.severity,
        category: issue.category,
        message: `[Quick Check] ${issue.message}`,
        suggestion: issue.suggestion,
        line: issue.line,
      });

      await client.postReviewComment(owner, repo, prNumber, commitId, issue.file, issue.line, comment);
    } catch (error) {
      console.error(`Failed to post quick check comment:`, error);
    }
  }
}

/**
 * Post AI issues as inline comments
 */
async function postInlineComments(
  client: GitHubAPIClient,
  owner: string,
  repo: string,
  prNumber: number,
  commitId: string,
  issues: AIIssue[]
) {
  // Limit to 20 inline comments to avoid spam
  const limitedIssues = issues.slice(0, 20);

  for (const issue of limitedIssues) {
    try {
      const comment = buildInlineComment({
        severity: issue.severity,
        category: issue.category,
        message: issue.message,
        suggestion: issue.suggestion,
        line: issue.line,
      });

      await client.postReviewComment(owner, repo, prNumber, commitId, issue.file, issue.line, comment);
    } catch (error) {
      console.error(`Failed to post inline comment:`, error);
    }
  }
}

/**
 * Convert QuickCheckIssue to AIIssue
 */
function convertQuickCheckToAIIssue(issue: QuickCheckIssue): AIIssue {
  return {
    file: issue.file,
    line: issue.line,
    severity: issue.severity,
    category: issue.category,
    message: `[Quick Check] ${issue.message}`,
    suggestion: issue.suggestion,
  };
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
