// ============================================
// DATABASE MODELS
// ============================================

export interface User {
  id: string;
  github_id: number;
  username: string;
  email?: string;
  avatar_url?: string;
  github_access_token: string;
  installation_id?: number;
  reviews_this_month: number;
  plan: 'free' | 'pro' | 'team';
  created_at: string;
}

export interface Repository {
  id: string;
  user_id: string;
  github_repo_id: number;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  repository_id: string;
  pr_number: number;
  pr_title?: string;
  status: 'pending' | 'completed' | 'failed';
  total_files?: number;
  reviewed_files?: number;
  skipped_files?: number;
  issues_found: number;
  critical_count: number;
  warning_count: number;
  suggestion_count: number;
  ai_calls_made: number;
  cache_hits: number;
  tokens_used: number;
  ai_response?: any;
  error_message?: string;
  review_duration_ms?: number;
  created_at: string;
  completed_at?: string;
}

export interface Comment {
  id: string;
  review_id: string;
  file_path: string;
  line_number: number;
  severity: 'critical' | 'warning' | 'suggestion';
  category: 'security' | 'performance' | 'quality' | 'best-practice';
  message: string;
  suggestion?: string;
  github_comment_id?: number;
  was_cached: boolean;
  created_at: string;
}

export interface CacheEntry {
  id: string;
  content_hash: string;
  file_path: string;
  issues: AIIssue[];
  hit_count: number;
  created_at: string;
  last_used_at: string;
}

// ============================================
// GITHUB WEBHOOK PAYLOADS
// ============================================

export interface GitHubWebhookPayload {
  action: 'opened' | 'synchronize' | 'reopened' | 'closed';
  pull_request: {
    number: number;
    title: string;
    state: string;
    html_url: string;
    diff_url: string;
    user: {
      login: string;
      avatar_url: string;
    };
    head: {
      sha: string;
      ref: string;
    };
    base: {
      sha: string;
      ref: string;
    };
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  installation?: {
    id: number;
  };
}

export interface GitHubPRFile {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  blob_url: string;
  raw_url: string;
  contents_url: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  email?: string;
  name?: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
  };
  html_url: string;
  description?: string;
}

// ============================================
// AI & REVIEW TYPES
// ============================================

export interface AIIssue {
  file: string;
  line: number;
  severity: 'critical' | 'warning' | 'suggestion';
  category: 'security' | 'performance' | 'quality' | 'best-practice';
  message: string;
  suggestion?: string;
}

export interface QuickCheckIssue {
  type: 'sql_injection' | 'hardcoded_secret' | 'console_log' | 'missing_await' | 'dangerous_html';
  file: string;
  line: number;
  severity: 'critical' | 'warning' | 'suggestion';
  category: 'security' | 'performance' | 'quality' | 'best-practice';
  message: string;
  suggestion?: string;
}

export interface FileBatch {
  batch_id: number;
  directory: string;
  files: ReviewFile[];
  estimated_tokens: number;
}

export interface ReviewFile {
  path: string;
  diff: string;
  context: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
}

export interface SkippedFile {
  path: string;
  reason: 'lockfile' | 'generated' | 'binary' | 'large' | 'config' | 'documentation' | 'test';
}

export type FilePriority = 'critical' | 'high' | 'medium' | 'low';

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ReviewStats {
  reviews_this_month: number;
  total_files_reviewed: number;
  cache_hit_rate: number;
  avg_review_time_ms: number;
  ai_calls_saved: number;
  tokens_used: number;
}

export interface DashboardData {
  user: User;
  stats: ReviewStats;
  recent_reviews: Review[];
  repositories: Repository[];
}

export interface ReviewDetailData {
  review: Review;
  repository: Repository;
  comments: Comment[];
  skipped_files: SkippedFile[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// GROQ API TYPES
// ============================================

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqCompletionRequest {
  messages: GroqChatMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
}

export interface GroqCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================
// UTILITY TYPES
// ============================================

export interface CacheKey {
  hash: string;
  file_path: string;
  diff_content: string;
}

export interface ReviewContext {
  repository: Repository;
  pr_number: number;
  pr_title: string;
  installation_id: number;
  github_repo_id: number;
  full_name: string;
}

export interface ProcessingMetrics {
  total_files: number;
  reviewed_files: number;
  skipped_files: number;
  cache_hits: number;
  ai_calls: number;
  tokens_used: number;
  duration_ms: number;
}
