import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { STATE_COOKIE_NAME, UserRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedRole = (searchParams.get('role') || 'admin') as UserRole;
  const redirectOrigin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${redirectOrigin}/api/auth/callback/google`;

  // 1. Generate CSRF state incorporating role
  const stateRandom = randomBytes(16).toString('hex');
  const statePayload = JSON.stringify({ role: requestedRole, token: stateRandom });
  const encodedState = Buffer.from(statePayload).toString('base64url');

  // If Google Client ID is configured, redirect to Google's real OAuth page
  if (clientId && clientId !== 'your-google-client-id') {
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('state', encodedState);
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'select_account');

    const response = NextResponse.redirect(googleAuthUrl.toString());
    response.cookies.set(STATE_COOKIE_NAME, stateRandom, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    });

    return response;
  }

  // 2. If Google Client ID is not yet provided in .env.local, provide a real dev-auth redirect
  // so the application can be tested immediately while directing developer to add their credentials
  const devCallbackUrl = new URL('/api/auth/callback/google', redirectOrigin);
  devCallbackUrl.searchParams.set('mock', 'true');
  devCallbackUrl.searchParams.set('role', requestedRole);
  devCallbackUrl.searchParams.set('state', encodedState);

  const response = NextResponse.redirect(devCallbackUrl.toString());
  response.cookies.set(STATE_COOKIE_NAME, stateRandom, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });

  return response;
}
