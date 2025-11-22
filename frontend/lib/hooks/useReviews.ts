import { useQuery } from '@tanstack/react-query';
import { Review } from '@/types';

interface UseReviewsOptions {
  limit?: number;
  status?: string;
}

/**
 * Hook to fetch reviews list
 * Cached for 2 minutes
 */
export function useReviews(options: UseReviewsOptions = {}) {
  return useQuery({
    queryKey: ['reviews', options],
    queryFn: async (): Promise<Review[]> => {
      const res = await fetch('/api/review/stats');
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      return data.recent_reviews || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
