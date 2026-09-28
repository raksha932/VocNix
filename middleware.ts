import { NextResponse, NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Exclude public authentication pages from route guards
  const publicAuthPaths = [
    '/admin/login',
    '/admin/signup',
    '/admin/forgot-password',
    '/super-admin/login',
    '/super-admin/forgot-password',
    '/super-admin/setup',
    '/login',
    '/auth',
    '/api/auth',
    '/api/health',
  ];

  if (publicAuthPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // 2. Super Admin Portal Protection (/admin)
  // Note: /admin/login, /admin/signup, /admin/forgot-password were exempted above
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      const loginUrl = new URL('/super-admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access control: Admin is strictly prohibited from accessing Super Admin
    if (session.role !== 'super_admin') {
      const redirectUrl = new URL('/dashboard?error=access_denied', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  // 3. Organization Admin Dashboard Protection (/dashboard)
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // 4. Super Admin Protected API routes (/api/admin)
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
