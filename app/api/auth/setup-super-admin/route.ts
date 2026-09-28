import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/db/supabase';
import { Repository } from '@/lib/db/repository';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, confirmPassword, fullName, setupKey } = body;

    // 1. Security Check: Allow initial setup if zero super admins exist OR if setupKey matches
    const hasSuperAdmin = await Repository.hasSuperAdmin();
    const configuredKey = process.env.SUPER_ADMIN_SETUP_KEY || 'vocnix-platform-setup-2026';

    if (hasSuperAdmin) {
      if (!setupKey || setupKey !== configuredKey) {
        return NextResponse.json(
          {
            success: false,
            error: 'Super Admin account already exists. New Super Admins can only be provisioned by an existing Super Admin from within the platform.',
          },
          { status: 403 }
        );
      }
    }

    // 2. Validate input fields
    if (!username || !username.trim()) {
      return NextResponse.json({ success: false, error: 'Username is required.' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email address is required.' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match.' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // 3. Uniqueness checks
    const usernameAvailable = await Repository.isUsernameAvailable(cleanUsername);
    if (!usernameAvailable) {
      return NextResponse.json({ success: false, error: 'Username is already in use.' }, { status: 409 });
    }

    let authUserId: string = randomUUID();

    // 4. Create in Supabase Auth
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
            role: 'super_admin',
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

    // 5. Store verified super_admin profile in database
    await Repository.createProfile({
      id: authUserId,
      username: cleanUsername,
      email: cleanEmail,
      role: 'super_admin',
      full_name: fullName?.trim() || cleanUsername,
      password,
    });

    return NextResponse.json({
      success: true,
      message: 'Super Admin account provisioned successfully! You can now log in at /super-admin/login.',
    });
  } catch (err: any) {
    console.error('[API /api/auth/setup-super-admin] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to setup Super Admin.' },
      { status: 500 }
    );
  }
}
