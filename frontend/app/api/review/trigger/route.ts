import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRepositoryByFullName, createReview, getUserById } from '@/lib/supabase/queries';
import { parseRepoFullName } from '@/lib/github/webhooks';

/**
 * Manual Review Trigger
 * POST /api/review/trigger
 *
 * Allows manually triggering a review for any PR (useful for testing)
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    // Get user from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get('mergecheck_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user to access their GitHub token
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { repo_full_name, pr_number } = body;

    if (!repo_full_name || !pr_number) {
      return NextResponse.json(
        { error: 'Missing repo_full_name or pr_number' },
        { status: 400 }
      );
    }

    // Check if repository is being tracked
    const repo = await getRepositoryByFullName(repo_full_name);

    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found. Please add it from the dashboard first.' },
        { status: 404 }
      );
    }

    if (!repo.is_active) {
      return NextResponse.json(
        { error: 'Repository is not active. Please activate it from the dashboard.' },
        { status: 400 }
      );
    }

    // Parse repo owner and name
    const { owner, repo: repoName } = parseRepoFullName(repo_full_name);

    // Fetch PR details to validate it exists using user token (read-only operation)
    let prData;
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/pulls/${pr_number}`,
        {
          headers: {
            Authorization: `Bearer ${user.github_access_token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`PR #${pr_number} not found`);
      }

      prData = await response.json();
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to fetch PR #${pr_number}. Make sure it exists.` },
        { status: 404 }
      );
    }

    // Create review record
    // Note: We skip posting the initial "reviewing..." comment for manual triggers
    // because user OAuth tokens don't have permission to post as the GitHub App.
    // The background processor will handle all GitHub interactions using the proper installation token.
    const review = await createReview({
      repository_id: repo.id,
      pr_number: pr_number,
      pr_title: prData.title,
    });

    // Trigger background processing
    // Note: For manual triggers, we use a fake installation ID (0)
    // The process endpoint should handle this gracefully
    triggerBackgroundProcessing({
      reviewId: review.id,
      installationId: 0, // No installation ID for manual triggers
      owner,
      repo: repoName,
      prNumber: pr_number,
      headSha: prData.head.sha,
      userToken: user.github_access_token, // Pass user token for API calls
    });

    return NextResponse.json({
      message: 'Review triggered successfully',
      review_id: review.id,
      pr_number: pr_number,
    });
  } catch (error) {
    console.error('Manual trigger error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Trigger background review processing
 */
function triggerBackgroundProcessing(data: {
  reviewId: string;
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  headSha: string;
  userToken?: string;
}) {
  fetch(`${APP_URL}/api/review/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GITHUB_WEBHOOK_SECRET}`,
    },
    body: JSON.stringify(data),
  }).catch(error => {
    console.error('Background processing error:', error);
  });
}
