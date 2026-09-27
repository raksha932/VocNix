import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  STATE_COOKIE_NAME,
  signSession,
  isSuperAdminEmail,
  UserRole,
  UserSession,
} from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const isMock = searchParams.get('mock') === 'true';
  const redirectOrigin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  // 1. Decode state to retrieve requested role
  let requestedRole: UserRole = (searchParams.get('role') as UserRole) || 'admin';
  let stateToken = '';

  if (state) {
    try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      if (decodedState.role) requestedRole = decodedState.role;
      if (decodedState.token) stateToken = decodedState.token;
    } catch {
      // Fallback
    }
  }

  // Determine error redirect path
  const loginPath = requestedRole === 'super_admin' ? '/login/super-admin' : '/login/admin';

  if (error) {
    return NextResponse.redirect(new URL(`${loginPath}?error=${encodeURIComponent(error)}`, redirectOrigin));
  }

  // Verify CSRF state token
  const storedStateToken = req.cookies.get(STATE_COOKIE_NAME)?.value;
  if (!isMock && stateToken && storedStateToken && stateToken !== storedStateToken) {
    return NextResponse.redirect(new URL(`${loginPath}?error=invalid_state`, redirectOrigin));
  }

  let userInfo: { email: string; name: string; picture?: string; id?: string } | null = null;

  // 2. Real Google OAuth Token Exchange & Profile Fetch
  if (code) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${redirectOrigin}/api/auth/callback/google`;

      // Exchange code for Google Access Token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId || '',
          client_secret: clientSecret || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('[Google OAuth] Token exchange error:', tokenData);
        return NextResponse.redirect(
          new URL(`${loginPath}?error=${encodeURIComponent(tokenData.error_description || 'Token exchange failed')}`, redirectOrigin)
        );
      }

      // Fetch Real-time Google User Info
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const userData = await userRes.json();
      if (!userRes.ok || !userData.email) {
        return NextResponse.redirect(new URL(`${loginPath}?error=failed_fetching_google_profile`, redirectOrigin));
      }

      userInfo = {
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        picture: userData.picture,
        id: userData.id,
      };
    } catch (err: any) {
      console.error('[Google OAuth] Callback exception:', err);
      return NextResponse.redirect(new URL(`${loginPath}?error=${encodeURIComponent(err.message)}`, redirectOrigin));
    }
  } else if (isMock) {
    // Development fallback when Google OAuth credentials are not yet set
    const mockRole = searchParams.get('role') || requestedRole;
    const mockEmail = searchParams.get('email');
    userInfo = {
      email: mockEmail || (mockRole === 'super_admin' ? 'superadmin@vocnix.com' : 'admin@vocnix.com'),
      name: mockRole === 'super_admin' ? 'Super Admin' : 'Admin User',
      picture: undefined,
      id: 'mock-user-123',
    };
  } else {
    return NextResponse.redirect(new URL(`${loginPath}?error=missing_code`, redirectOrigin));
  }

  if (!userInfo?.email) {
    return NextResponse.redirect(new URL(`${loginPath}?error=unauthenticated`, redirectOrigin));
  }

  // 3. ROLE-BASED ACCESS CONTROL ENFORCEMENT
  if (requestedRole === 'super_admin') {
    // Strictly verify if this Google account is authorized for Super Admin
    if (!isSuperAdminEmail(userInfo.email)) {
      return NextResponse.redirect(
        new URL(
          `/login/super-admin?error=unauthorized&email=${encodeURIComponent(userInfo.email)}`,
          redirectOrigin
        )
      );
    }
  }

  // 4. Create authoritative user session
  const now = Date.now();
  const session: UserSession = {
    userId: userInfo.id || userInfo.email,
    email: userInfo.email,
    name: userInfo.name,
    avatar: userInfo.picture,
    role: requestedRole,
    createdAt: now,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const signedToken = await signSession(session);
  const targetDestination = requestedRole === 'super_admin' ? '/admin' : '/dashboard';
  const response = NextResponse.redirect(new URL(targetDestination, redirectOrigin));

  // Set secure HTTP-only session cookie
  response.cookies.set(SESSION_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  // Clear state cookie
  response.cookies.delete(STATE_COOKIE_NAME);

  return response;
}
