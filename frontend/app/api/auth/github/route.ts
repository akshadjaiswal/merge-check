import { NextRequest, NextResponse } from 'next/server';

/**
 * GitHub OAuth Login
 * Redirects user to GitHub for OAuth authorization
 */

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    // Build GitHub OAuth URL
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');

    githubAuthUrl.searchParams.append('client_id', GITHUB_CLIENT_ID);
    githubAuthUrl.searchParams.append('redirect_uri', `${APP_URL}/api/auth/callback`);
    githubAuthUrl.searchParams.append('scope', 'user:email read:user repo');
    githubAuthUrl.searchParams.append('state', generateRandomState());

    // Redirect to GitHub
    return NextResponse.redirect(githubAuthUrl.toString());
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate GitHub OAuth' },
      { status: 500 }
    );
  }
}

/**
 * Generate random state for CSRF protection
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
