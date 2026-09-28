import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  const explicitRedirect = req.nextUrl.searchParams.get('redirect');

  let targetPath = '/admin/login';
  if (explicitRedirect) {
    targetPath = explicitRedirect;
  } else if (session?.role === 'super_admin') {
    targetPath = '/super-admin/login';
  } else if (session?.role === 'admin') {
    targetPath = '/admin/login';
  }

  const redirectOrigin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const response = NextResponse.redirect(new URL(targetPath, redirectOrigin));
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
