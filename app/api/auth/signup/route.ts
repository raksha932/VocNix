import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getSupabaseClient, isSupabaseConfigured } from '@/lib/db/supabase';
import { Repository } from '@/lib/db/repository';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, confirmPassword, fullName } = body;

    // 1. Field presence validation
    if (!username || typeof username !== 'string' || !username.trim()) {
      return NextResponse.json({ success: false, error: 'Username is required.' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email address is required.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ success: false, error: 'Password is required.' }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match.' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // 2. Format validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json(
        { success: false, error: 'Username must be between 3 and 30 characters and contain only letters, numbers, or underscores.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Password policy: At least 8 characters, at least 1 letter and 1 number
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least one letter and one number.' },
        { status: 400 }
      );
    }

    // 3. Uniqueness checks
    const usernameAvailable = await Repository.isUsernameAvailable(cleanUsername);
    if (!usernameAvailable) {
      return NextResponse.json(
        { success: false, error: 'This username is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    const emailRegistered = await Repository.isEmailRegistered(cleanEmail);
    if (emailRegistered) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists. Please log in.' },
        { status: 409 }
      );
    }

    let authUserId: string = randomUUID();

    // 4. Supabase Auth Account Creation
    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      const client = getSupabaseClient();

      if (admin) {
        // Use admin client with auto-confirmed email for immediate login readiness
        const { data: adminUserData, error: adminAuthErr } = await admin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: {
            username: cleanUsername,
            full_name: fullName?.trim() || cleanUsername,
            role: 'admin',
          },
        });

        if (adminAuthErr) {
          if (adminAuthErr.message.toLowerCase().includes('already registered')) {
            return NextResponse.json(
              { success: false, error: 'An account with this email is already registered.' },
              { status: 409 }
            );
          }
          return NextResponse.json({ success: false, error: adminAuthErr.message }, { status: 400 });
        }

        if (adminUserData?.user) {
          authUserId = adminUserData.user.id;
        }
      } else if (client) {
        // Standard signup fallback
        const { data: clientAuthData, error: clientAuthErr } = await client.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              username: cleanUsername,
              full_name: fullName?.trim() || cleanUsername,
              role: 'admin',
            },
          },
        });

        if (clientAuthErr) {
          return NextResponse.json({ success: false, error: clientAuthErr.message }, { status: 400 });
        }

        if (clientAuthData?.user) {
          authUserId = clientAuthData.user.id;
        }
      }
    }

    // 5. Store authoritative profile with assigned 'admin' role in database
    await Repository.createProfile({
      id: authUserId,
      username: cleanUsername,
      email: cleanEmail,
      role: 'admin', // Enforced: users CANNOT choose their own role
      full_name: fullName?.trim() || cleanUsername,
      password,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Admin account created successfully! You can now log in.',
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API /api/auth/signup] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Registration failed due to a server error. Please try again.' },
      { status: 500 }
    );
  }
}
