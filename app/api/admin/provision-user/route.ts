import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, UserRole } from '@/lib/auth/session';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/db/supabase';
import { Repository } from '@/lib/db/repository';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize: Only existing Super Admins can provision accounts
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Super Admins can provision new administrator accounts.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { username, email, password, role, fullName } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Username, email, and password are required.' },
        { status: 400 }
      );
    }

    const targetRole: UserRole = role === 'super_admin' ? 'super_admin' : 'admin';
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check availability
    const usernameAvailable = await Repository.isUsernameAvailable(cleanUsername);
    if (!usernameAvailable) {
      return NextResponse.json({ success: false, error: 'Username is already taken.' }, { status: 409 });
    }

    const emailRegistered = await Repository.isEmailRegistered(cleanEmail);
    if (emailRegistered) {
      return NextResponse.json({ success: false, error: 'Email is already registered.' }, { status: 409 });
    }

    let authUserId: string = randomUUID();

    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data, error } = await admin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: {
            username: cleanUsername,
            full_name: fullName?.trim() || cleanUsername,
            role: targetRole,
          },
        });

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        if (data?.user) {
          authUserId = data.user.id;
        }
      }
    }

    const newProfile = await Repository.createProfile({
      id: authUserId,
      username: cleanUsername,
      email: cleanEmail,
      role: targetRole,
      full_name: fullName?.trim() || cleanUsername,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully provisioned new ${targetRole === 'super_admin' ? 'Super Admin' : 'Admin'} account: ${cleanUsername}`,
      user: newProfile,
    });
  } catch (err: any) {
    console.error('[API /api/admin/provision-user] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to provision account.' },
      { status: 500 }
    );
  }
}
