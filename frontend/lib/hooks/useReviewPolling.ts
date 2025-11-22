import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Poll review status for pending reviews
 * Auto-updates cache when status changes to completed/failed
 */
export function useReviewPolling(reviewId: string | null, currentStatus: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Only poll if review is pending
    if (!reviewId || currentStatus !== 'pending') {
      return;
    }

    console.log(`Starting polling for review ${reviewId}`);

    // Poll every 3 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/review/${reviewId}`);
        if (!res.ok) return;

        const data = await res.json();
        const review = data.review;

        // Update cache with new data
        queryClient.setQueryData(['review', reviewId], data);

        // If status changed from pending, invalidate lists and show notification
        if (review.status === 'completed') {
          console.log(`Review ${reviewId} completed!`);

          toast.success('Review completed!', {
            description: `Found ${review.issues_found} issue${review.issues_found !== 1 ? 's' : ''} in ${review.reviewed_files} files`,
          });

          // Invalidate stats/reviews list to update counts
          queryClient.invalidateQueries({ queryKey: ['stats-and-reviews'] });

          // Stop polling
          clearInterval(interval);
        } else if (review.status === 'failed') {
          console.log(`Review ${reviewId} failed`);

          toast.error('Review failed', {
            description: review.error_message || 'An error occurred during review',
          });

          // Invalidate to update UI
          queryClient.invalidateQueries({ queryKey: ['stats-and-reviews'] });

          // Stop polling
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup on unmount
    return () => {
      console.log(`Stopping polling for review ${reviewId}`);
      clearInterval(interval);
    };
  }, [reviewId, currentStatus, queryClient]);
}
