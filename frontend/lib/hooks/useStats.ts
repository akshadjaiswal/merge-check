import { useQuery } from '@tanstack/react-query';
import { ReviewStats } from '@/types';

/**
 * Hook to fetch dashboard statistics
 * Cached for 5 minutes
 */
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async (): Promise<ReviewStats> => {
      const res = await fetch('/api/review/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      return data.stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
