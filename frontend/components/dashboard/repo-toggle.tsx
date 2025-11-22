'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Repository {
  id?: string;
  github_repo_id: number;
  full_name: string;
  name: string;
  private: boolean;
  description?: string;
  is_active: boolean;
  is_tracked: boolean;
}

interface RepoToggleProps {
  repository: Repository;
  onToggle: (repoId: string, isActive: boolean) => Promise<void>;
}

export function RepoToggle({ repository, onToggle }: RepoToggleProps) {
  const [isActive, setIsActive] = useState(repository.is_active);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!repository.id) return;

    setIsLoading(true);
    try {
      const newState = !isActive;
      await onToggle(repository.id, newState);
      setIsActive(newState);
    } catch (error) {
      console.error('Failed to toggle repository:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn(
      'p-4 transition-all',
      isActive && 'border-cyan-200 bg-cyan-50/30'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Github className="w-5 h-5 text-slate-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 truncate">
                {repository.full_name}
              </h3>
              {repository.private && (
                <Lock className="w-3 h-3 text-slate-400" />
              )}
            </div>

            {repository.description && (
              <p className="text-sm text-slate-600 line-clamp-1 mb-2">
                {repository.description}
              </p>
            )}

            <div className="flex items-center gap-2">
              {isActive ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-slate-600">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={cn(
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
            isActive ? 'bg-cyan-600' : 'bg-slate-200'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              isActive ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>
    </Card>
  );
}
