import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';
import { resolveRequestOrganization } from '@/lib/auth/organization-context';
import { isResendConfigured, sendTranslatorInviteEmail } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const org = await resolveRequestOrganization(req);
    const translators = await Repository.getTranslators(org.id);
    return NextResponse.json({ success: true, translators });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, email, native_languages } = body;

    if (!full_name || !email) {
      return NextResponse.json({ success: false, error: 'Full name and email are required' }, { status: 400 });
    }

    const org = await resolveRequestOrganization(req);
    const translator = await Repository.createTranslator({
      organization_id: org.id,
      full_name,
      email,
      native_languages: native_languages || [],
    });

    // Dispatch welcome email to the newly invited translator via Resend
    if (isResendConfigured()) {
      sendTranslatorInviteEmail({
        to: email.trim().toLowerCase(),
        translatorName: full_name.trim(),
        orgName: org.name,
        nativeLanguages: native_languages || [],
      }).catch((err) => {
        console.warn('[Translators] Invite email dispatch warning:', err);
      });
    }

    return NextResponse.json({ success: true, translator });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Translator ID is required' }, { status: 400 });
    }

    await Repository.deleteTranslator(id);
    return NextResponse.json({ success: true, message: 'Translator deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
