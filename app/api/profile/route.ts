import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, signSession, SESSION_COOKIE_NAME, UserSession } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    let profile = await Repository.getProfileById(session.userId);
    if (!profile && session.email) {
      profile = await Repository.getProfileByEmail(session.email);
    }

    const identifier = profile?.username || session.username || profile?.email || session.email;

    const profileData = {
      id: profile?.id || session.userId,
      full_name: profile?.full_name || session.full_name || session.name || 'Admin',
      email: profile?.email || session.email,
      username: profile?.username || session.username || 'admin',
      identifier: identifier,
      avatar_url: profile?.avatar_url || session.avatar || '',
      password_status: 'Configured',
      role: profile?.role || session.role,
    };

    return NextResponse.json({ success: true, profile: profileData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    let profile = await Repository.getProfileById(session.userId);
    if (!profile && session.email) {
      profile = await Repository.getProfileByEmail(session.email);
    }

    const profileId = profile?.id || session.userId;

    const body = await req.json().catch(() => ({}));
    const { full_name, avatar_url, email, newPassword } = body;

    // 1. Password update handler
    if (newPassword !== undefined) {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      const updated = await Repository.updatePassword(profileId, newPassword);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Failed to update password in database' },
          { status: 500 }
        );
      }
    }

    // 2. Profile attributes update handler
    let updatedProfile = profile;
    const hasProfileUpdates = full_name !== undefined || avatar_url !== undefined || email !== undefined;

    if (hasProfileUpdates) {
      // Validate avatar if provided (allow max 5MB data URL or valid image URL)
      if (avatar_url && typeof avatar_url === 'string' && avatar_url.length > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Profile picture must be under 5MB' },
          { status: 400 }
        );
      }

      updatedProfile = await Repository.updateProfile(profileId, {
        full_name,
        avatar_url,
        email,
      });
    }

    // 3. Re-issue updated session cookie
    const updatedName = full_name !== undefined ? full_name.trim() : session.name;
    const updatedAvatar = avatar_url !== undefined ? avatar_url : session.avatar;
    const updatedEmail = email !== undefined ? email.trim().toLowerCase() : session.email;

    const newSession: UserSession = {
      ...session,
      email: updatedEmail,
      full_name: full_name !== undefined ? full_name.trim() : session.full_name,
      name: updatedName || 'Admin',
      avatar: updatedAvatar,
    };

    const token = await signSession(newSession);

    const forwardedProto = req.headers.get('x-forwarded-proto');
    const isHttps = process.env.NODE_ENV === 'production' || forwardedProto === 'https' || req.nextUrl?.protocol === 'https:';

    const response = NextResponse.json({
      success: true,
      message: newPassword !== undefined ? 'Password updated successfully.' : 'Profile updated successfully.',
      profile: {
        id: updatedProfile?.id || profileId,
        full_name: updatedProfile?.full_name || updatedName,
        email: updatedProfile?.email || updatedEmail,
        username: updatedProfile?.username || session.username,
        identifier: updatedProfile?.username || session.username || updatedEmail,
        avatar_url: updatedProfile?.avatar_url || updatedAvatar,
        role: updatedProfile?.role || session.role,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
