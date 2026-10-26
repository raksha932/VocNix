import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getSupabaseClient, isSupabaseConfigured } from '@/lib/db/supabase';
import { Repository } from '@/lib/db/repository';
import { isResendConfigured, sendPasswordResetEmail } from '@/lib/email/resend';

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

    const profile = await Repository.getProfileByEmail(cleanEmail);

    let resetUrl = `${redirectTo}?email=${encodeURIComponent(cleanEmail)}`;

    if (isSupabaseConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        try {
          const { data, error } = await admin.auth.admin.generateLink({
            type: 'recovery',
            email: cleanEmail,
            options: { redirectTo },
          });

          if (!error && data?.properties?.action_link) {
            resetUrl = data.properties.action_link;
          }
        } catch (linkErr) {
          console.warn('[Supabase generateLink warning]:', linkErr);
        }
      }
    }

    // Dispatch branded email via Resend if configured
    if (isResendConfigured()) {
      const emailResult = await sendPasswordResetEmail({
        to: cleanEmail,
        resetUrl,
        recipientName: profile?.full_name || undefined,
      });

      if (!emailResult.success) {
        console.warn('[ForgotPassword] Resend delivery warning:', emailResult.error);
      }
    } else if (isSupabaseConfigured()) {
      // Fall back to Supabase built-in mailer if Resend is not configured
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo,
        });
        if (error) {
          console.error('[Supabase Auth resetPasswordForEmail error]:', error);
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
