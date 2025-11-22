import { useQuery } from '@tanstack/react-query';
import { ReviewStats, Review } from '@/types';

interface StatsAndReviewsData {
  stats: ReviewStats;
  recent_reviews: Review[];
}

/**
 * Shared hook that fetches both stats and recent reviews in a single API call
 * This prevents duplicate API calls since /api/review/stats returns both
 * Cached for 5 minutes
 */
export function useStatsAndReviews() {
  return useQuery({
    queryKey: ['stats-and-reviews'],
    queryFn: async (): Promise<StatsAndReviewsData> => {
      const res = await fetch('/api/review/stats');
      if (!res.ok) throw new Error('Failed to fetch stats and reviews');
      const data = await res.json();
      return {
        stats: data.stats,
        recent_reviews: data.recent_reviews || [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
