import { useMemo } from 'react';
import { useStatsAndReviews } from './useStatsAndReviews';
import { Review } from '@/types';

interface UseReviewsOptions {
  limit?: number;
  status?: string;
}

/**
 * Hook to fetch reviews list
 * Derives from shared useStatsAndReviews hook to prevent duplicate API calls
 * Supports client-side filtering by limit and status
 * Cached for 5 minutes
 */
export function useReviews(options: UseReviewsOptions = {}) {
  const { data, isLoading, error, refetch } = useStatsAndReviews();

  // Client-side filtering to avoid extra API calls
  const filteredReviews = useMemo(() => {
    let reviews = data?.recent_reviews || [];

    // Filter by status if provided
    if (options.status) {
      reviews = reviews.filter((r) => r.status === options.status);
    }

    // Limit results if provided
    if (options.limit) {
      reviews = reviews.slice(0, options.limit);
    }

    return reviews;
  }, [data?.recent_reviews, options.status, options.limit]);

  return {
    data: filteredReviews,
    isLoading,
    error,
    refetch,
  };
}
