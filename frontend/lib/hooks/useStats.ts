import { useStatsAndReviews } from './useStatsAndReviews';

/**
 * Hook to fetch dashboard statistics
 * Derives from shared useStatsAndReviews hook to prevent duplicate API calls
 * Cached for 5 minutes
 */
export function useStats() {
  const { data, isLoading, error, refetch } = useStatsAndReviews();

  return {
    data: data?.stats,
    isLoading,
    error,
    refetch,
  };
}
