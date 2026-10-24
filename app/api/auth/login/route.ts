import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getSupabaseClient, isSupabaseConfigured } from '@/lib/db/supabase';
import { Repository } from '@/lib/db/repository';
import { SESSION_COOKIE_NAME, signSession, UserSession, UserRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { identifier, password, requiredRole } = body;

    // Missing fields validation
    if (
      !identifier ||
      typeof identifier !== 'string' ||
      !identifier.trim() ||
      !password ||
      typeof password !== 'string'
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username/email and password are required',
          error: 'Username/email and password are required',
        },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // 1. Resolve identifier to profile
    let profile = await Repository.getProfileByIdentifier(cleanIdentifier);
    let resolvedEmail = cleanIdentifier.includes('@') ? cleanIdentifier : '';

    if (profile) {
      resolvedEmail = profile.email;
    }

    let authUserId = profile?.id || '';
    let authUserMeta: any = null;

    // 2. Real-Time Supabase Auth Credential Verification (if configured)
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient() || getSupabaseAdmin();
      if (!client) {
        return NextResponse.json(
          {
            success: false,
            message: 'Authentication service temporarily unavailable. Please try again later.',
            error: 'Authentication service unavailable',
          },
          { status: 503 }
        );
      }

      // If user typed username, resolve to email before Supabase Auth signIn
      if (!resolvedEmail && profile?.email) {
        resolvedEmail = profile.email;
      }

      if (!resolvedEmail) {
        // Without an email and without a matching profile, reject uniformly
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid username/email or password',
            error: 'Invalid username/email or password',
          },
          { status: 401 }
        );
      }

      let { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      // Self-healing fallback: if Auth rejects but database profile exists with matching initial/verified password
      if ((authError || !authData?.user) && profile) {
        const isMatch = Repository.verifyLocalPassword(profile.id, password);
        if (isMatch) {
          const admin = getSupabaseAdmin();
          if (admin) {
            try {
              const { data: createdAuthUser, error: createErr } = await admin.auth.admin.createUser({
                id: profile.id,
                email: resolvedEmail,
                password,
                email_confirm: true,
                user_metadata: {
                  username: profile.username,
                  full_name: profile.full_name,
                  role: profile.role,
                },
              });

              if (!createErr && createdAuthUser?.user) {
                authData = { user: createdAuthUser.user, session: null } as any;
                authError = null;
              } else {
                const { data: usersList } = await admin.auth.admin.listUsers();
                const matched = usersList?.users?.find(
                  (u) => (u.email || '').toLowerCase() === resolvedEmail.toLowerCase()
                );
                if (matched) {
                  await admin.auth.admin.updateUserById(matched.id, {
                    password,
                    email_confirm: true,
                  });
                  authData = { user: matched, session: null } as any;
                  authError = null;
                }
              }
            } catch (healErr) {
              console.warn('[Login Auth Self-Healing Warning]:', healErr);
            }
          }
        }
      }

      if (authError || !authData?.user) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid username/email or password',
            error: 'Invalid username/email or password',
          },
          { status: 401 }
        );
      }

      authUserId = authData.user.id;
      authUserMeta = authData.user.user_metadata || null;

      // Refresh / retrieve verified database profile
      if (!profile) {
        profile = await Repository.getProfileById(authUserId);
      }
      if (!profile) {
        profile = await Repository.getProfileByEmail(resolvedEmail);
      }
    } else {
      // Fallback verification for local dev when external Supabase is not configured
      if (!profile) {
        profile = await Repository.getProfileByEmail(cleanIdentifier);
      }

      if (!profile) {
        // Do not reveal whether user exists
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid username/email or password',
            error: 'Invalid username/email or password',
          },
          { status: 401 }
        );
      }

      const isValidPass = Repository.verifyLocalPassword(profile.id, password);
      if (!isValidPass) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid username/email or password',
            error: 'Invalid username/email or password',
          },
          { status: 401 }
        );
      }
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid username/email or password',
          error: 'Invalid username/email or password',
        },
        { status: 401 }
      );
    }

    // Check account status if deactivated or suspended
    if (profile.status === 'inactive' || profile.status === 'suspended' || profile.status === 'disabled') {
      return NextResponse.json(
        {
          success: false,
          message: 'This account has been deactivated. Please contact an administrator.',
          error: 'Account deactivated',
        },
        { status: 403 }
      );
    }

    // 3. Strict Server-Side Role Retrieval (Database is single source of truth)
    const userRole: UserRole =
      profile.role ||
      (resolvedEmail === 'superadmin@vocnix.com' || cleanIdentifier === 'superadmin'
        ? 'super_admin'
        : 'admin');

    // Strict role validation if requiredRole is specified
    if (requiredRole === 'super_admin' && userRole !== 'super_admin') {
      return NextResponse.json(
        {
          success: false,
          code: 'WRONG_ROLE_ADMIN',
          message: 'Access restricted: Super Admin privileges required. Please use the Admin Login portal.',
          error: 'Access restricted: Super Admin privileges required. Please use the Admin Login portal.',
        },
        { status: 403 }
      );
    }

    // 4. Create authoritative user session
    const now = Date.now();
    const metaUsername = authUserMeta?.username || (!cleanIdentifier.includes('@') ? cleanIdentifier : '');
    const metaFullName = authUserMeta?.full_name || authUserMeta?.name || '';

    const username = (
      profile.username ||
      metaUsername ||
      resolvedEmail.split('@')[0]
    ).trim();

    const fullName = (
      profile.full_name ||
      metaFullName ||
      ''
    ).trim();

    const name = fullName || username || resolvedEmail.split('@')[0];

    const session: UserSession = {
      userId: authUserId || profile.id || resolvedEmail,
      email: resolvedEmail || profile.email,
      username,
      full_name: fullName || undefined,
      name,
      role: userRole,
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const signedToken = await signSession(session);
    const redirectUrl = userRole === 'super_admin' ? '/admin' : '/dashboard';

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      redirectUrl,
      user: {
        id: session.userId,
        username: session.username,
        email: session.email,
        role: session.role,
        name: session.name,
      },
    });

    // Determine cookie secure flag: enable in production or over HTTPS connections
    const forwardedProto = req.headers.get('x-forwarded-proto');
    const isHttps = process.env.NODE_ENV === 'production' || forwardedProto === 'https' || req.nextUrl?.protocol === 'https:';

    // Set secure HTTP-only session cookie
    response.cookies.set(SESSION_COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[API /api/auth/login] Error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected server error occurred. Please try again.',
        error: err.message || 'Server error',
      },
      { status: 500 }
    );
  }
}
