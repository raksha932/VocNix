import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const redirectOrigin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const redirectTo = `${redirectOrigin}/auth/reset-password`;

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo,
        });

        if (error) {
          console.error('[Supabase Auth resetPasswordForEmail error]:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'If an account matches that email address, a password reset link has been sent to your inbox.',
    });
  } catch (err: any) {
    console.error('[API /api/auth/forgot-password] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process password reset request.' },
      { status: 500 }
    );
  }
}
