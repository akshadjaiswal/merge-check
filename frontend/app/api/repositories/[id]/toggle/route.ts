import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { toggleRepositoryActive } from '@/lib/supabase/queries';

/**
 * Toggle Repository Active Status
 * POST /api/repositories/[id]/toggle
 */

export async function POST(
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
    const { is_active } = await request.json();

    // Toggle repository
    await toggleRepositoryActive(id, is_active);

    return NextResponse.json({ success: true, is_active });
  } catch (error) {
    console.error('Error toggling repository:', error);
    return NextResponse.json(
      { error: 'Failed to toggle repository' },
      { status: 500 }
    );
  }
}
