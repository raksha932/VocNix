import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const redirectOrigin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const response = NextResponse.redirect(new URL('/', redirectOrigin));
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
