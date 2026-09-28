import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getSupabaseClient, isSupabaseConfigured } from '@/lib/db/supabase';
import { Repository } from '@/lib/db/repository';
import { SESSION_COOKIE_NAME, signSession, UserSession, UserRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, requiredRole } = body;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json(
        { success: false, error: 'Username or email address is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Password is required.' },
        { status: 400 }
      );
    }

    const targetRole: UserRole = requiredRole === 'super_admin' ? 'super_admin' : 'admin';
    const cleanIdentifier = identifier.trim().toLowerCase();

    // 1. Resolve identifier to profile
    let profile = await Repository.getProfileByIdentifier(cleanIdentifier);
    let resolvedEmail = cleanIdentifier.includes('@') ? cleanIdentifier : '';

    if (profile) {
      resolvedEmail = profile.email;
    } else if (!resolvedEmail) {
      // If entered a username and no profile exists with that username
      return NextResponse.json(
        { success: false, error: 'No account found with this username. Please check your username or register.' },
        { status: 404 }
      );
    }

    let authUserId = profile?.id || '';

    // 2. Real-Time Supabase Auth Credential Verification
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient() || getSupabaseAdmin();
      if (!client) {
        return NextResponse.json(
          { success: false, error: 'Authentication service temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }

      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (authError || !authData.user) {
        const errorMsg = authError?.message?.toLowerCase() || '';
        if (errorMsg.includes('invalid') || errorMsg.includes('credentials')) {
          return NextResponse.json(
            { success: false, error: 'Invalid username/email or password.' },
            { status: 401 }
          );
        }
        if (errorMsg.includes('not found') || errorMsg.includes('no user')) {
          return NextResponse.json(
            { success: false, error: 'No account found with this username or email.' },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { success: false, error: authError?.message || 'Authentication failed.' },
          { status: 401 }
        );
      }

      authUserId = authData.user.id;

      // Refresh / retrieve verified database profile
      if (!profile) {
        profile = await Repository.getProfileById(authUserId);
      }
    } else {
      // Fallback in-memory verification for local dev when external Supabase is not connected
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'No account found with this username or email.' },
          { status: 404 }
        );
      }

      const isValidPass = Repository.verifyLocalPassword(profile.id, password);
      if (!isValidPass) {
        return NextResponse.json(
          { success: false, error: 'Invalid username/email or password.' },
          { status: 401 }
        );
      }
    }

    // If profile still not found, check if it's the default seeded accounts
    if (!profile) {
      profile = await Repository.getProfileByEmail(resolvedEmail);
    }

    // 3. Strict Server-Side Role Verification
    const userRole: UserRole = profile?.role || (resolvedEmail === 'superadmin@vocnix.com' ? 'super_admin' : 'admin');

    if (targetRole === 'super_admin') {
      if (userRole !== 'super_admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'Access denied: This account has Admin privileges, not Super Admin. Please use the Admin Login page.',
            code: 'WRONG_ROLE_ADMIN',
          },
          { status: 403 }
        );
      }
    } else if (targetRole === 'admin') {
      // Admin login allows admin (and super_admin can also access admin console if desired)
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'Access denied: You do not have permissions for the Admin Console.',
            code: 'WRONG_ROLE',
          },
          { status: 403 }
        );
      }
    }

    // 4. Create authoritative user session
    const now = Date.now();
    const session: UserSession = {
      userId: authUserId || profile?.id || resolvedEmail,
      email: resolvedEmail,
      username: profile?.username || resolvedEmail.split('@')[0],
      name: profile?.full_name || profile?.username || resolvedEmail.split('@')[0],
      role: userRole,
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const signedToken = await signSession(session);
    const redirectUrl = targetRole === 'super_admin' ? '/admin' : '/dashboard';

    const response = NextResponse.json({
      success: true,
      message: 'Login successful.',
      redirectUrl,
      user: {
        id: session.userId,
        email: session.email,
        username: session.username,
        name: session.name,
        role: session.role,
      },
    });

    // Set secure HTTP-only session cookie
    response.cookies.set(SESSION_COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[API /api/auth/login] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'An unexpected server error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
