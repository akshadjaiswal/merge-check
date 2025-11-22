'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SeverityBadge } from './severity-badge';
import { Review } from '@/types';
import { ExternalLink, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { useReviewPolling } from '@/lib/hooks/useReviewPolling';

interface ReviewTableProps {
  reviews: Review[];
}

function ReviewRow({ review }: { review: Review }) {
  // Poll for status updates if review is pending
  useReviewPolling(review.id, review.status);

  return (
    <TableRow key={review.id} className="hover:bg-slate-50">
      <TableCell className="font-medium">
        <Link
          href={`/dashboard/reviews/${review.id}`}
          className="text-cyan-600 hover:text-cyan-700 hover:underline"
        >
          #{review.pr_number}
        </Link>
        <div className="text-sm text-slate-500 mt-1 line-clamp-1">
          {review.pr_title}
        </div>
      </TableCell>

      <TableCell>
        {review.status === 'completed' && (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )}
        {review.status === 'pending' && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing...
          </Badge>
        )}
        {review.status === 'failed' && (
          <Badge className="bg-rose-100 text-rose-700 border-rose-300">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )}
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap gap-1">
          {review.critical_count > 0 && (
            <SeverityBadge severity="critical" count={review.critical_count} />
          )}
          {review.warning_count > 0 && (
            <SeverityBadge severity="warning" count={review.warning_count} />
          )}
          {review.suggestion_count > 0 && (
            <SeverityBadge severity="suggestion" count={review.suggestion_count} />
          )}
          {review.status === 'completed' && review.issues_found === 0 && (
            <span className="text-sm text-emerald-600 font-medium">✓ Clean</span>
          )}
          {review.status === 'pending' && (
            <span className="text-sm text-amber-600">Analyzing...</span>
          )}
        </div>
      </TableCell>

      <TableCell className="text-sm text-slate-600">
        {review.status === 'completed'
          ? `${review.reviewed_files}/${review.total_files}`
          : review.status === 'pending'
          ? <span className="text-amber-600">Processing...</span>
          : '-'
        }
      </TableCell>

      <TableCell className="text-sm text-slate-600">
        {review.cache_hits > 0 ? (
          <span className="text-cyan-600 font-medium">
            {review.cache_hits} cached
          </span>
        ) : review.status === 'completed' ? (
          <span className="text-slate-400">None</span>
        ) : (
          '-'
        )}
      </TableCell>

      <TableCell className="text-sm text-slate-600">
        {review.review_duration_ms
          ? `${Math.round(review.review_duration_ms / 1000)}s`
          : '-'}
      </TableCell>

      <TableCell className="text-sm text-slate-600">
        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
      </TableCell>

      <TableCell className="text-right">
        <Link href={`/dashboard/reviews/${review.id}`}>
          <button className="text-cyan-600 hover:text-cyan-700 p-1">
            <ExternalLink className="w-4 h-4" />
          </button>
        </Link>
      </TableCell>
    </TableRow>
  );
}

export function ReviewTable({ reviews }: ReviewTableProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="text-lg font-medium">No reviews yet</p>
        <p className="text-sm">Reviews will appear here when PRs are opened</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>PR</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Issues</TableHead>
            <TableHead>Files</TableHead>
            <TableHead>Cache Hits</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
