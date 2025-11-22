import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Auth Middleware
 * Protects dashboard routes
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const userId = request.cookies.get('mergecheck_user_id');

    if (!userId) {
      // Redirect to home page if not authenticated
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
