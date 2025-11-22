import { createClient } from './server';
import { User, Repository, Review, Comment, ReviewStats } from '@/types';

/**
 * Supabase Query Utilities
 * CRUD operations for all database tables
 */

// ============================================
// USER OPERATIONS
// ============================================

export async function createOrUpdateUser(data: {
  github_id: number;
  username: string;
  email?: string;
  avatar_url?: string;
  github_access_token: string;
  installation_id?: number;
}): Promise<User> {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('mergecheck_users')
    .upsert(
      {
        github_id: data.github_id,
        username: data.username,
        email: data.email,
        avatar_url: data.avatar_url,
        github_access_token: data.github_access_token,
        installation_id: data.installation_id,
      },
      {
        onConflict: 'github_id',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return user;
}

export async function getUserByGitHubId(githubId: number): Promise<User | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mergecheck_users')
    .select('*')
    .eq('github_id', githubId)
    .single();

  if (error) return null;
  return data;
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mergecheck_users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function incrementUserReviewCount(userId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('mergecheck_users')
    .update({
      reviews_this_month: supabase.rpc('increment', { row_id: userId }),
    })
    .eq('id', userId);
}

// ============================================
// REPOSITORY OPERATIONS
// ============================================

export async function createOrUpdateRepository(data: {
  user_id: string;
  github_repo_id: number;
  full_name: string;
  is_active?: boolean;
}): Promise<Repository> {
  const supabase = await createClient();

  const { data: repo, error } = await supabase
    .from('mergecheck_repositories')
    .upsert(
      {
        user_id: data.user_id,
        github_repo_id: data.github_repo_id,
        full_name: data.full_name,
        is_active: data.is_active ?? true,
      },
      {
        onConflict: 'github_repo_id',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return repo;
}

export async function getRepositoryByGitHubId(githubRepoId: number): Promise<Repository | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mergecheck_repositories')
    .select('*')
    .eq('github_repo_id', githubRepoId)
    .single();

  if (error) return null;
  return data;
}

export async function getUserRepositories(userId: string): Promise<Repository[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mergecheck_repositories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

export async function toggleRepositoryActive(repoId: string, isActive: boolean): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('mergecheck_repositories')
    .update({ is_active: isActive })
    .eq('id', repoId);
}

// ============================================
// REVIEW OPERATIONS
// ============================================

export async function createReview(data: {
  repository_id: string;
  pr_number: number;
  pr_title?: string;
}): Promise<Review> {
  const supabase = await createClient();

  const { data: review, error } = await supabase
    .from('mergecheck_reviews')
    .insert({
      repository_id: data.repository_id,
      pr_number: data.pr_number,
      pr_title: data.pr_title,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return review;
}

export async function updateReview(
  reviewId: string,
  data: Partial<Omit<Review, 'id' | 'created_at'>>
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('mergecheck_reviews')
    .update(data)
    .eq('id', reviewId);
}

export async function completeReview(
  reviewId: string,
  data: {
    total_files: number;
    reviewed_files: number;
    skipped_files: number;
    issues_found: number;
    critical_count: number;
    warning_count: number;
    suggestion_count: number;
    ai_calls_made: number;
    cache_hits: number;
    tokens_used: number;
    ai_response?: any;
    review_duration_ms: number;
  }
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('mergecheck_reviews')
    .update({
      ...data,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', reviewId);
}

export async function markReviewFailed(reviewId: string, errorMessage: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('mergecheck_reviews')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', reviewId);
}

export async function getReviewById(reviewId: string): Promise<Review | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mergecheck_reviews')
    .select('*')
    .eq('id', reviewId)
    .single();

  if (error) return null;
  return data;
}

export async function getRecentReviews(repositoryId: string, limit = 10): Promise<Review[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mergecheck_reviews')
    .select('*')
    .eq('repository_id', repositoryId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

export async function getUserReviews(userId: string, limit = 20): Promise<Review[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mergecheck_reviews')
    .select('*, mergecheck_repositories!inner(user_id)')
    .eq('mergecheck_repositories.user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

// ============================================
// COMMENT OPERATIONS
// ============================================

export async function createComment(data: {
  review_id: string;
  file_path: string;
  line_number: number;
  severity: 'critical' | 'warning' | 'suggestion';
  category: 'security' | 'performance' | 'quality' | 'best-practice';
  message: string;
  suggestion?: string;
  github_comment_id?: number;
  was_cached?: boolean;
}): Promise<Comment> {
  const supabase = await createClient();

  const { data: comment, error } = await supabase
    .from('mergecheck_comments')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return comment;
}

export async function createComments(comments: Array<Omit<Comment, 'id' | 'created_at'>>): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('mergecheck_comments')
    .insert(comments);
}

export async function getReviewComments(reviewId: string): Promise<Comment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mergecheck_comments')
    .select('*')
    .eq('review_id', reviewId)
    .order('severity', { ascending: true })
    .order('file_path', { ascending: true });

  if (error) return [];
  return data;
}

// ============================================
// STATS OPERATIONS
// ============================================

export async function getUserStats(userId: string): Promise<ReviewStats> {
  const supabase = await createClient();

  // Get user's total reviews this month
  const { data: user } = await supabase
    .from('mergecheck_users')
    .select('reviews_this_month')
    .eq('id', userId)
    .single();

  // Get aggregate stats from reviews
  const { data: reviews } = await supabase
    .from('mergecheck_reviews')
    .select('reviewed_files, cache_hits, ai_calls_made, tokens_used, review_duration_ms')
    .eq('status', 'completed')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

  if (!reviews || reviews.length === 0) {
    return {
      reviews_this_month: user?.reviews_this_month || 0,
      total_files_reviewed: 0,
      cache_hit_rate: 0,
      avg_review_time_ms: 0,
      ai_calls_saved: 0,
      tokens_used: 0,
    };
  }

  const total_files_reviewed = reviews.reduce((sum, r) => sum + (r.reviewed_files || 0), 0);
  const total_cache_hits = reviews.reduce((sum, r) => sum + (r.cache_hits || 0), 0);
  const total_ai_calls = reviews.reduce((sum, r) => sum + (r.ai_calls_made || 0), 0);
  const total_tokens = reviews.reduce((sum, r) => sum + (r.tokens_used || 0), 0);
  const total_duration = reviews.reduce((sum, r) => sum + (r.review_duration_ms || 0), 0);

  const cache_hit_rate = total_files_reviewed > 0 ? total_cache_hits / total_files_reviewed : 0;
  const ai_calls_saved = total_cache_hits; // Each cache hit saves one AI call
  const avg_review_time_ms = reviews.length > 0 ? total_duration / reviews.length : 0;

  return {
    reviews_this_month: user?.reviews_this_month || 0,
    total_files_reviewed,
    cache_hit_rate,
    avg_review_time_ms,
    ai_calls_saved,
    tokens_used: total_tokens,
  };
}
