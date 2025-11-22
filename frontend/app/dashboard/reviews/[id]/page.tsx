'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { DashboardNav } from '@/components/layout/dashboard-nav';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SeverityBadge } from '@/components/dashboard/severity-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Clock, Zap, FileCode, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Review, Comment } from '@/types';

export default function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [review, setReview] = useState<Review | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReviewData();
  }, [resolvedParams.id]);

  async function loadReviewData() {
    try {
      setIsLoading(true);
      setError(null);

      // In a real app, you'd have separate API routes for this
      // For now, we'll load from the review object directly
      const res = await fetch(`/api/review/${resolvedParams.id}`);
      if (!res.ok) throw new Error('Review not found');

      const data = await res.json();
      setReview(data.review);
      setComments(data.comments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review');
    } finally {
      setIsLoading(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50/30 to-white flex flex-col">
        <DashboardNav />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert className="border-rose-200 bg-rose-50">
            <AlertDescription className="text-rose-700">{error}</AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-cyan-50/30 to-white flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back Button */}
        <a
          href="/dashboard"
          className="text-cyan-600 hover:text-cyan-700 mb-6 inline-flex items-center gap-2 text-sm"
        >
          ← Back to Dashboard
        </a>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
        ) : review ? (
          <>
            {/* Header */}
            <Card className="p-6 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    PR #{review.pr_number}
                  </h1>
                  <p className="text-lg text-slate-600">{review.pr_title}</p>
                </div>
                {review.status === 'completed' && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {review.review_duration_ms
                    ? `${Math.round(review.review_duration_ms / 1000)}s`
                    : 'N/A'}
                </div>
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  {review.reviewed_files}/{review.total_files} files reviewed
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {review.cache_hits} cache hits
                </div>
              </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Total Issues</p>
                    <p className="text-3xl font-bold text-slate-900">{review.issues_found}</p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-cyan-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Cache Hit Rate</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {review.reviewed_files
                        ? Math.round((review.cache_hits / review.reviewed_files) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                  <Zap className="w-10 h-10 text-cyan-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">AI Calls</p>
                    <p className="text-3xl font-bold text-slate-900">{review.ai_calls_made}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-cyan-600" />
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <Card className="p-6">
              <Tabs defaultValue="issues" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="issues">Issues Found ({review.issues_found})</TabsTrigger>
                  <TabsTrigger value="files">Files Reviewed ({review.reviewed_files})</TabsTrigger>
                  <TabsTrigger value="skipped">Files Skipped ({review.skipped_files})</TabsTrigger>
                </TabsList>

                <TabsContent value="issues">
                  {comments.length > 0 ? (
                    <div className="space-y-4">
                      {/* Critical Issues */}
                      {review.critical_count > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <SeverityBadge severity="critical" count={review.critical_count} />
                          </div>
                          <div className="space-y-3">
                            {comments
                              .filter(c => c.severity === 'critical')
                              .map(comment => (
                                <IssueCard key={comment.id} comment={comment} />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Warnings */}
                      {review.warning_count > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center gap-2 mb-3">
                            <SeverityBadge severity="warning" count={review.warning_count} />
                          </div>
                          <div className="space-y-3">
                            {comments
                              .filter(c => c.severity === 'warning')
                              .map(comment => (
                                <IssueCard key={comment.id} comment={comment} />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {review.suggestion_count > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center gap-2 mb-3">
                            <SeverityBadge severity="suggestion" count={review.suggestion_count} />
                          </div>
                          <div className="space-y-3">
                            {comments
                              .filter(c => c.severity === 'suggestion')
                              .map(comment => (
                                <IssueCard key={comment.id} comment={comment} />
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                      <p className="text-lg font-medium">No issues found!</p>
                      <p className="text-sm">This PR looks good to merge</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="files">
                  <div className="text-center py-12 text-slate-500">
                    <p>File list would be displayed here</p>
                  </div>
                </TabsContent>

                <TabsContent value="skipped">
                  <div className="text-center py-12 text-slate-500">
                    <p>Skipped files would be displayed here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

function IssueCard({ comment }: { comment: Comment }) {
  const severityColors = {
    critical: 'border-rose-200 bg-rose-50',
    warning: 'border-amber-200 bg-amber-50',
    suggestion: 'border-cyan-200 bg-cyan-50',
  };

  return (
    <Card className={`p-4 border-l-4 ${severityColors[comment.severity]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono text-slate-700">{comment.file_path}:{comment.line_number}</code>
          <Badge variant="outline" className="text-xs">{comment.category}</Badge>
          {comment.was_cached && (
            <Badge variant="outline" className="text-xs bg-cyan-100 text-cyan-700">
              <Zap className="w-3 h-3 mr-1" />
              Cached
            </Badge>
          )}
        </div>
      </div>

      <p className="text-slate-900 mb-2">{comment.message}</p>

      {comment.suggestion && (
        <div className="mt-3 p-3 bg-white rounded border border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-1">Suggested fix:</p>
          <p className="text-sm text-slate-600">{comment.suggestion}</p>
        </div>
      )}
    </Card>
  );
}
