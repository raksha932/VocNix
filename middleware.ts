import { NextResponse, NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Super Admin portal protection (/admin)
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      const loginUrl = new URL('/login/super-admin', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Strictly separate permissions: Admin must never access Super Admin pages
    if (session.role !== 'super_admin') {
      const redirectUrl = new URL('/dashboard?error=access_denied', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  // 2. Organization Admin dashboard protection (/dashboard)
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      const loginUrl = new URL('/login/admin', req.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // 3. Super Admin API protection (/api/admin)
  if (pathname.startsWith('/api/admin')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/api/admin/:path*'],
};
