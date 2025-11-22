import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Repository } from './useRepositories';

interface ToggleRepoParams {
  repository: Repository;
  isActive: boolean;
}

/**
 * Hook to toggle repository active status
 * Includes optimistic updates and auto-refetch
 */
export function useToggleRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ repository, isActive }: ToggleRepoParams) => {
      // If repo is not tracked yet, create it first
      if (!repository.id || !repository.is_tracked) {
        const createRes = await fetch('/api/repositories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            github_repo_id: repository.github_repo_id,
            full_name: repository.full_name,
          }),
        });

        if (!createRes.ok) {
          throw new Error('Failed to add repository');
        }

        const { repository: createdRepo } = await createRes.json();
        repository = { ...repository, id: createdRepo.id, is_tracked: true };
      }

      // Now toggle the status
      const res = await fetch(`/api/repositories/${repository.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!res.ok) {
        throw new Error('Failed to toggle repository');
      }

      return { repository, isActive };
    },

    // Optimistic update
    onMutate: async ({ repository, isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['repositories'] });

      // Snapshot previous value
      const previousRepos = queryClient.getQueryData<Repository[]>(['repositories']);

      // Optimistically update
      queryClient.setQueryData<Repository[]>(['repositories'], (old) => {
        if (!old) return old;
        return old.map((repo) =>
          repo.github_repo_id === repository.github_repo_id
            ? { ...repo, is_active: isActive, is_tracked: true }
            : repo
        );
      });

      return { previousRepos };
    },

    // On success
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'Repository activated!' : 'Repository deactivated');
      // Refetch to get latest server state
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },

    // On error, rollback
    onError: (error, _, context) => {
      if (context?.previousRepos) {
        queryClient.setQueryData(['repositories'], context.previousRepos);
      }
      toast.error('Failed to toggle repository');
      console.error('Toggle error:', error);
    },
  });
}
