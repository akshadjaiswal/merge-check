'use client';

import { useEffect, useState } from 'react';
import { DashboardNav } from '@/components/layout/dashboard-nav';
import { Footer } from '@/components/layout/footer';
import { ReviewTable } from '@/components/dashboard/review-table';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw } from 'lucide-react';
import { Review } from '@/types';

export default function ReviewsPage() {
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [searchQuery, activeTab, allReviews]);

  async function loadReviews() {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/review/stats');
      if (!res.ok) throw new Error('Failed to load reviews');

      const data = await res.json();
      setAllReviews(data.recent_reviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }

  function filterReviews() {
    let filtered = allReviews;

    // Filter by status
    if (activeTab !== 'all') {
      filtered = filtered.filter(r => r.status === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.pr_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.pr_number.toString().includes(searchQuery)
      );
    }

    setFilteredReviews(filtered);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50/30 to-white flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">All Reviews</h1>
          <p className="text-slate-600">View and manage all your PR reviews</p>
        </div>

        {/* Error State */}
        {error && (
          <Alert className="mb-8 border-rose-200 bg-rose-50">
            <AlertDescription className="text-rose-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by PR number or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <button
              onClick={loadReviews}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </Card>

        {/* Reviews with Tabs */}
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                All ({allReviews.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({allReviews.filter(r => r.status === 'completed').length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({allReviews.filter(r => r.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="failed">
                Failed ({allReviews.filter(r => r.status === 'failed').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <>
                  {filteredReviews.length > 0 ? (
                    <ReviewTable reviews={filteredReviews} />
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <p className="text-lg font-medium">No reviews found</p>
                      <p className="text-sm">
                        {searchQuery
                          ? 'Try a different search term'
                          : activeTab !== 'all'
                          ? `No ${activeTab} reviews yet`
                          : 'Reviews will appear here when PRs are opened'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
