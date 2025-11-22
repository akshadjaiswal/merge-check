'use client';

import { useEffect, useState } from 'react';
import { DashboardNav } from '@/components/layout/dashboard-nav';
import { Footer } from '@/components/layout/footer';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ReviewTable } from '@/components/dashboard/review-table';
import { RepoToggle } from '@/components/dashboard/repo-toggle';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GitPullRequest, Clock, Zap, TrendingUp, RefreshCw } from 'lucide-react';
import { Review, ReviewStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      setError(null);

      // Load stats and reviews
      const statsRes = await fetch('/api/review/stats');
      if (!statsRes.ok) throw new Error('Failed to load stats');
      const statsData = await statsRes.json();

      setStats(statsData.stats);
      setReviews(statsData.recent_reviews);

      // Load repositories
      const reposRes = await fetch('/api/repositories');
      if (!reposRes.ok) throw new Error('Failed to load repositories');
      const reposData = await reposRes.json();

      setRepositories(reposData.repositories);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRepoToggle(repoId: string, isActive: boolean) {
    await fetch(`/api/repositories/${repoId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50/30 to-white flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Monitor your code reviews and repository activity</p>
        </div>

        {/* Error State */}
        {error && (
          <Alert className="mb-8 border-rose-200 bg-rose-50">
            <AlertDescription className="text-rose-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </>
          ) : stats ? (
            <>
              <StatsCard
                title="Reviews This Month"
                value={stats.reviews_this_month}
                icon={GitPullRequest}
                description="Total PR reviews completed"
              />
              <StatsCard
                title="Cache Hit Rate"
                value={`${Math.round(stats.cache_hit_rate * 100)}%`}
                icon={Zap}
                description="AI calls saved by caching"
              />
              <StatsCard
                title="Avg Review Time"
                value={`${Math.round(stats.avg_review_time_ms / 1000)}s`}
                icon={Clock}
                description="Per pull request review"
              />
              <StatsCard
                title="AI Calls Saved"
                value={stats.ai_calls_saved}
                icon={TrendingUp}
                description="Thanks to smart caching"
              />
            </>
          ) : null}
        </div>

        {/* Recent Reviews */}
        <Card className="mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Recent Reviews</h2>
            <button
              onClick={loadDashboardData}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <ReviewTable reviews={reviews} />
          )}
        </Card>

        {/* Repositories */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Repositories</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : repositories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repositories.map((repo) => (
                <RepoToggle
                  key={repo.github_repo_id}
                  repository={repo}
                  onToggle={handleRepoToggle}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg font-medium">No repositories connected</p>
              <p className="text-sm">Install the GitHub App to get started</p>
            </div>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
}
