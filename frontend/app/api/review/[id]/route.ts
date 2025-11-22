import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getReviewById, getReviewComments } from '@/lib/supabase/queries';

/**
 * Get Single Review Details
 * GET /api/review/[id]
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get('mergecheck_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get review
    const review = await getReviewById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Get comments for this review
    const comments = await getReviewComments(id);

    return NextResponse.json({
      review,
      comments,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}
