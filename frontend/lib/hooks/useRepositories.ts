import { useQuery } from '@tanstack/react-query';

export interface Repository {
  id?: string;
  github_repo_id: number;
  full_name: string;
  name: string;
  private: boolean;
  description?: string;
  html_url?: string;
  is_active: boolean;
  is_tracked: boolean;
}

/**
 * Hook to fetch repositories list
 * Cached for 10 minutes
 */
export function useRepositories() {
  return useQuery({
    queryKey: ['repositories'],
    queryFn: async (): Promise<Repository[]> => {
      const res = await fetch('/api/repositories');
      if (!res.ok) throw new Error('Failed to fetch repositories');
      const data = await res.json();
      return data.repositories || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
