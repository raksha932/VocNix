import { validatePasswordPolicy } from '@/lib/auth/password';
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

    // Password policy verification (min 8 chars, 1 letter, 1 number)
    const policyResult = validatePasswordPolicy(password);
    if (!policyResult.valid) {
      return NextResponse.json({ success: false, error: policyResult.error }, { status: 400 });
    }

    // 3. Uniqueness checks with concrete diagnostics
    const usernameAvailable = await Repository.isUsernameAvailable(cleanUsername);
    if (!usernameAvailable) {
      console.warn(`[Registration Conflict] Username already exists: "${cleanUsername}"`);
      return NextResponse.json(
        {
          success: false,
          code: 'USERNAME_TAKEN',
          error: 'This username is already in use. Please choose another username or sign in if this is your account.',
          existingIdentifier: cleanUsername,
        },
        { status: 409 }
      );
    }

    const emailRegistered = await Repository.isEmailRegistered(cleanEmail);
    if (emailRegistered) {
      console.warn(`[Registration Conflict] Email already registered: "${cleanEmail}"`);
      return NextResponse.json(
        {
          success: false,
          code: 'ACCOUNT_EXISTS',
          error: 'An account with this email address already exists. Please sign in instead.',
          existingIdentifier: cleanEmail,
        },
        { status: 409 }
      );
    }

    let authUserId: string = randomUUID();

    // 4. Supabase Auth Account Creation (with network error resiliency)
    if (isSupabaseConfigured()) {
      try {
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
            console.warn('[Signup] Supabase admin auth warning:', adminAuthErr.message);
          } else if (adminUserData?.user) {
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
            console.warn('[Signup] Supabase client auth warning:', clientAuthErr.message);
          } else if (clientAuthData?.user) {
            authUserId = clientAuthData.user.id;
          }
        }
      } catch (authErr: any) {
        // Network-level error reaching Supabase (e.g. invalid URL, paused project, DNS failure)
        console.warn(
          `[Signup] Supabase Auth endpoint unreachable (${authErr?.message || authErr}). Falling back to repository profile storage.`
        );
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
