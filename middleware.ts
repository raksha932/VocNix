import { NextResponse, NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME, IMPERSONATION_COOKIE_NAME } from '@/lib/auth/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. If an active authenticated session already exists, do not show login again; redirect to appropriate console
  const authEntryPaths = [
    '/admin/login',
    '/admin/signup',
    '/super-admin/login',
    '/super-admin/signup',
    '/super-admin/setup',
    '/login',
    '/login/admin',
    '/login/super-admin',
  ];

  if (authEntryPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;
    if (session) {
      const destination = session.role === 'super_admin' ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(destination, req.url));
    }
  }

  // 2. Generic /login redirect to /admin/login
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  // 3. Exclude public authentication paths and health check from route guards
  const publicAuthPaths = [
    '/admin/login',
    '/admin/signup',
    '/admin/forgot-password',
    '/super-admin/login',
    '/super-admin/signup',
    '/super-admin/setup',
    '/super-admin/forgot-password',
    '/auth',
    '/api/auth',
    '/api/health',
  ];

  if (publicAuthPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // 4. Super Admin Protected API routes (/api/admin/*)
  if (pathname.startsWith('/api/admin')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Super Admin access required', error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // 5. Admin Protected API routes (/api/dashboard/*)
  if (pathname.startsWith('/api/dashboard')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required', error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // 6. Super Admin Portal UI Protection (/admin and /super-admin/* non-auth pages)
  if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/super-admin')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      const loginUrl = new URL('/super-admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== 'super_admin') {
      // Role enforcement: Admins cannot access Super Admin features by changing URL
      const dashUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashUrl);
    }

    return NextResponse.next();
  }

  // 7. Organization Admin Dashboard UI Protection (/dashboard)
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based rule: Super Admin cannot access /dashboard directly without impersonation
    if (session.role === 'super_admin') {
      const impersonateOrgId = req.cookies.get(IMPERSONATION_COOKIE_NAME)?.value;
      const isImpersonatingQuery = req.nextUrl?.searchParams?.get('impersonate') === 'true';
      if (!impersonateOrgId && !isImpersonatingQuery) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/super-admin/:path*',
    '/dashboard/:path*',
    '/login',
    '/login/:path*',
    '/api/admin/:path*',
    '/api/dashboard/:path*',
  ],
};
