import { createHash } from 'crypto';
import { CacheKey, AIIssue, CacheEntry } from '@/types';
import { createClient } from '@/lib/supabase/server';

/**
 * Cache Management
 * Handles caching of AI review results using SHA-256 hashing
 */

/**
 * Generate cache key from file path and diff content
 */
export function generateCacheKey(filePath: string, diffContent: string): CacheKey {
  const contentToHash = `${filePath}:${diffContent}`;

  const hash = createHash('sha256')
    .update(contentToHash)
    .digest('hex');

  return {
    hash,
    file_path: filePath,
    diff_content: diffContent,
  };
}

/**
 * Check if cached result exists for a file diff
 */
export async function checkCache(filePath: string, diffContent: string): Promise<AIIssue[] | null> {
  try {
    const supabase = await createClient();
    const cacheKey = generateCacheKey(filePath, diffContent);

    const { data, error } = await supabase
      .from('mergecheck_cache')
      .select('*')
      .eq('content_hash', cacheKey.hash)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if cache is still valid (less than 30 days old)
    const lastUsed = new Date(data.last_used_at);
    const daysSinceLastUse = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastUse > 30) {
      // Cache expired, delete it
      await supabase
        .from('mergecheck_cache')
        .delete()
        .eq('id', data.id);
      return null;
    }

    // Update cache hit metrics
    await supabase
      .from('mergecheck_cache')
      .update({
        hit_count: data.hit_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', data.id);

    return data.issues as AIIssue[];
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
}

/**
 * Store AI review result in cache
 */
export async function storeInCache(
  filePath: string,
  diffContent: string,
  issues: AIIssue[]
): Promise<void> {
  try {
    const supabase = await createClient();
    const cacheKey = generateCacheKey(filePath, diffContent);

    // Check if entry already exists
    const { data: existing } = await supabase
      .from('mergecheck_cache')
      .select('id')
      .eq('content_hash', cacheKey.hash)
      .single();

    if (existing) {
      // Update existing entry
      await supabase
        .from('mergecheck_cache')
        .update({
          issues,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Insert new entry
      await supabase
        .from('mergecheck_cache')
        .insert({
          content_hash: cacheKey.hash,
          file_path: filePath,
          issues,
          hit_count: 1,
          last_used_at: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('Error storing in cache:', error);
    // Don't throw, caching failure shouldn't break the review
  }
}

/**
 * Batch check cache for multiple files
 */
export async function batchCheckCache(
  files: Array<{ path: string; diff: string }>
): Promise<Map<string, AIIssue[]>> {
  const results = new Map<string, AIIssue[]>();

  for (const file of files) {
    const cached = await checkCache(file.path, file.diff);
    if (cached) {
      results.set(file.path, cached);
    }
  }

  return results;
}

/**
 * Batch store multiple file results in cache
 */
export async function batchStoreInCache(
  results: Array<{ path: string; diff: string; issues: AIIssue[] }>
): Promise<void> {
  const promises = results.map(({ path, diff, issues }) =>
    storeInCache(path, diff, issues)
  );

  await Promise.allSettled(promises);
}

/**
 * Clean up old cache entries (older than 30 days)
 */
export async function cleanupOldCache(): Promise<number> {
  try {
    const supabase = await createClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('mergecheck_cache')
      .delete()
      .lt('last_used_at', thirtyDaysAgo.toISOString())
      .select();

    if (error) {
      console.error('Error cleaning up cache:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error cleaning up cache:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  total_entries: number;
  total_hits: number;
  avg_hit_count: number;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('mergecheck_cache')
      .select('hit_count');

    if (error || !data) {
      return { total_entries: 0, total_hits: 0, avg_hit_count: 0 };
    }

    const total_entries = data.length;
    const total_hits = data.reduce((sum, entry) => sum + entry.hit_count, 0);
    const avg_hit_count = total_entries > 0 ? total_hits / total_entries : 0;

    return {
      total_entries,
      total_hits,
      avg_hit_count: Math.round(avg_hit_count * 100) / 100,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { total_entries: 0, total_hits: 0, avg_hit_count: 0 };
  }
}
