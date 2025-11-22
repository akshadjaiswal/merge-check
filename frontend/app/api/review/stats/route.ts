import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserStats, getUserReviews } from '@/lib/supabase/queries';

/**
 * Get Review Statistics
 * GET /api/review/stats
 */

export async function GET(request: NextRequest) {
  try {
    // Get user from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get('mergecheck_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user stats
    const stats = await getUserStats(userId);

    // Get recent reviews
    const recentReviews = await getUserReviews(userId, 10);

    return NextResponse.json({
      stats,
      recent_reviews: recentReviews,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
