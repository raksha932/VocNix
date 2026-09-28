import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, confirmPassword } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ success: false, error: 'New password is required.' }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ success: false, error: 'Password must contain at least one letter and one number.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.auth.updateUser({ password });
        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.',
    });
  } catch (err: any) {
    console.error('[API /api/auth/reset-password] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update password.' },
      { status: 500 }
    );
  }
}
