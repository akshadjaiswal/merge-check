import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GitHubAPIClient } from '@/lib/github/api';
import { getUserById, getUserRepositories, createOrUpdateRepository } from '@/lib/supabase/queries';

/**
 * List User Repositories
 * GET /api/repositories
 */

export async function GET(request: NextRequest) {
  try {
    // Get user from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get('mergecheck_user_id')?.value;
    const githubToken = cookieStore.get('mergecheck_github_token')?.value;

    if (!userId || !githubToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get repositories from GitHub
    const githubClient = GitHubAPIClient.fromUserToken(githubToken);
    const githubRepos = await githubClient.listUserRepositories();

    // Get tracked repositories from database
    const trackedRepos = await getUserRepositories(userId);
    const trackedRepoIds = new Set(trackedRepos.map(r => r.github_repo_id));

    // Merge data
    const repositories = githubRepos.map(repo => {
      const tracked = trackedRepos.find(r => r.github_repo_id === repo.id);
      return {
        id: tracked?.id,
        github_repo_id: repo.id,
        full_name: repo.full_name,
        name: repo.name,
        private: repo.private,
        description: repo.description,
        html_url: repo.html_url,
        is_active: tracked?.is_active ?? false,
        is_tracked: trackedRepoIds.has(repo.id),
      };
    });

    return NextResponse.json({ repositories });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}

/**
 * Add Repository to Tracking
 * POST /api/repositories
 */

export async function POST(request: NextRequest) {
  try {
    // Get user from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get('mergecheck_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { github_repo_id, full_name } = await request.json();

    // Create or update repository
    const repository = await createOrUpdateRepository({
      user_id: userId,
      github_repo_id,
      full_name,
      is_active: true,
    });

    return NextResponse.json({ repository });
  } catch (error) {
    console.error('Error adding repository:', error);
    return NextResponse.json(
      { error: 'Failed to add repository' },
      { status: 500 }
    );
  }
}
