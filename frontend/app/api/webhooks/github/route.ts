import { NextRequest, NextResponse } from 'next/server';
import { GitHubWebhookPayload } from '@/types';
import { verifyWebhookSignature, shouldProcessEvent, buildReviewingComment, parseRepoFullName } from '@/lib/github/webhooks';
import { GitHubAPIClient } from '@/lib/github/api';
import { getRepositoryByGitHubId, createReview } from '@/lib/supabase/queries';

/**
 * GitHub Webhook Handler
 * Receives PR events and triggers review processing
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');

    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse payload
    const payload: GitHubWebhookPayload = JSON.parse(rawBody);

    console.log(`Received ${event} webhook:`, payload.action);

    // Check if we should process this event
    if (!event || !shouldProcessEvent(event, payload.action)) {
      return NextResponse.json({ message: 'Event not processed' }, { status: 200 });
    }

    // Extract data
    const { pull_request, repository, installation } = payload;

    if (!installation) {
      console.error('No installation ID in webhook');
      return NextResponse.json({ error: 'No installation' }, { status: 400 });
    }

    // Check if repository is being tracked
    const repo = await getRepositoryByGitHubId(repository.id);

    if (!repo || !repo.is_active) {
      console.log(`Repository ${repository.full_name} not tracked or inactive`);
      return NextResponse.json({ message: 'Repository not tracked' }, { status: 200 });
    }

    // Create GitHub client
    const githubClient = await GitHubAPIClient.fromInstallation(installation.id);
    const { owner, repo: repoName } = parseRepoFullName(repository.full_name);

    // Post initial "reviewing..." comment
    const reviewingComment = buildReviewingComment();
    await githubClient.postPRComment(owner, repoName, pull_request.number, reviewingComment);

    // Create review record
    const review = await createReview({
      repository_id: repo.id,
      pr_number: pull_request.number,
      pr_title: pull_request.title,
    });

    // Trigger background processing (don't wait for it)
    // We return 200 OK immediately so GitHub doesn't timeout
    triggerBackgroundProcessing({
      reviewId: review.id,
      installationId: installation.id,
      owner,
      repo: repoName,
      prNumber: pull_request.number,
      headSha: pull_request.head.sha,
    });

    return NextResponse.json({
      message: 'Webhook received, review started',
      review_id: review.id,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Trigger background review processing
 * This runs asynchronously without blocking the webhook response
 */
function triggerBackgroundProcessing(data: {
  reviewId: string;
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  headSha: string;
}) {
  // Call the review processing API in the background
  fetch(`${APP_URL}/api/review/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GITHUB_WEBHOOK_SECRET}`, // Internal auth
    },
    body: JSON.stringify(data),
  }).catch(error => {
    console.error('Background processing error:', error);
  });
}

// Allow POST requests only
export async function GET() {
  return NextResponse.json({ message: 'Webhook endpoint - POST only' });
}
