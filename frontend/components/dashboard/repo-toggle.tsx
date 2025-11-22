'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Repository } from '@/lib/hooks/useRepositories';
import { TriggerReviewDialog } from './trigger-review-dialog';

interface RepoToggleProps {
  repository: Repository;
  onToggle: (isActive: boolean) => void;
}

export function RepoToggle({ repository, onToggle }: RepoToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isActive = repository.is_active;

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newState = !isActive;
      onToggle(newState);
    } finally {
      // Keep loading state for a bit to show feedback
      setTimeout(() => setIsLoading(false), 500);
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

            <div className="flex items-center gap-2 flex-wrap">
              {isActive ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-slate-600">
                  Inactive
                </Badge>
              )}
              {!repository.is_tracked && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                  Not tracked yet
                </Badge>
              )}
              {isActive && repository.is_tracked && (
                <TriggerReviewDialog repoFullName={repository.full_name} />
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
          title={isActive ? 'Click to deactivate' : 'Click to activate'}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            </div>
          ) : (
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                isActive ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          )}
        </button>
      </div>
    </Card>
  );
}
