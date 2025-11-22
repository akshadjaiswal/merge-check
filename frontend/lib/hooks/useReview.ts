import { useQuery } from '@tanstack/react-query';
import { Review, Comment } from '@/types';

interface ReviewDetail {
  review: Review;
  comments: Comment[];
}

/**
 * Hook to fetch single review details
 * Cached for 10 minutes (reviews don't change often)
 */
export function useReview(reviewId: string) {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: async (): Promise<ReviewDetail> => {
      const res = await fetch(`/api/review/${reviewId}`);
      if (!res.ok) throw new Error('Review not found');
      return await res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!reviewId, // Only run if reviewId exists
  });
}
