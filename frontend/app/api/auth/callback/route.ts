import { NextRequest, NextResponse } from 'next/server';
import { GitHubAPIClient } from '@/lib/github/api';
import { createOrUpdateUser } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/server';

/**
 * GitHub OAuth Callback Handler
 * Exchanges code for access token and creates/updates user
 */

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      return NextResponse.redirect(`${APP_URL}/?error=${error}`);
    }

    if (!code) {
      return NextResponse.redirect(`${APP_URL}/?error=no_code`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('No access token received');
    }

    // Get user info from GitHub
    const githubClient = GitHubAPIClient.fromUserToken(accessToken);
    const githubUser = await githubClient.getAuthenticatedUser();

    // Create or update user in database
    const user = await createOrUpdateUser({
      github_id: githubUser.id,
      username: githubUser.login,
      email: githubUser.email,
      avatar_url: githubUser.avatar_url,
      github_access_token: accessToken,
    });

    // Create session using Supabase Auth
    const supabase = await createClient();

    // Store user session data
    // Note: You might want to use a proper session management solution
    // For now, we'll use Supabase's built-in auth
    const { error: sessionError } = await supabase.auth.signInWithPassword({
      email: `github_${user.github_id}@mergecheck.app`,
      password: accessToken, // In production, hash this properly
    });

    // If user doesn't exist in Supabase Auth, create them
    if (sessionError) {
      await supabase.auth.signUp({
        email: `github_${user.github_id}@mergecheck.app`,
        password: accessToken,
        options: {
          data: {
            github_id: user.github_id,
            username: user.username,
            avatar_url: user.avatar_url,
          },
        },
      });
    }

    // Redirect to dashboard
    const response = NextResponse.redirect(`${APP_URL}/dashboard`);

    // Set custom auth cookie with user ID
    response.cookies.set('mergecheck_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.set('mergecheck_github_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${APP_URL}/?error=auth_failed`);
  }
}
