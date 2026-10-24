import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';
import { resolveRequestOrganization } from '@/lib/auth/organization-context';
import { isResendConfigured, sendTranslatorAssignmentEmail } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const org = await resolveRequestOrganization(req);
    const body = await req.json();
    const { eventId, roomId, translatorEmail, translatorName } = body;

    if (!eventId || !roomId || !translatorEmail) {
      return NextResponse.json(
        { success: false, error: 'Event ID, Room ID, and Translator Email are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = translatorEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // 1. Resolve event and room
    const event = await Repository.getEventById(eventId);
    if (!event || event.organization_id !== org.id) {
      return NextResponse.json(
        { success: false, error: 'Event not found or does not belong to your organization.' },
        { status: 404 }
      );
    }

    const room = event.rooms?.find((r) => r.id === roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Translation room not found for this event.' },
        { status: 404 }
      );
    }

    const language = event.languages?.find((l) => l.id === room.event_language_id);
    const languageName = language?.language_name || 'Live Translation';

    // 2. Build direct booth access URL
    const redirectOrigin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const roomUrl = `${redirectOrigin}/translator/room/${room.secure_room_token}`;

    // 3. Resolve translator name
    let finalTranslatorName = translatorName?.trim();
    if (!finalTranslatorName) {
      const orgTranslators = await Repository.getTranslators(org.id);
      const matched = orgTranslators.find((t) => t.email.toLowerCase() === cleanEmail);
      if (matched) {
        finalTranslatorName = matched.full_name;
        // Optionally assign to room
        await Repository.assignTranslator(room.id, matched.id).catch(() => {});
      } else {
        finalTranslatorName = cleanEmail.split('@')[0];
      }
    }

    // 4. Send email via Resend
    if (!isResendConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Resend email service is not configured. Please verify your API key in infra/.resend-email-key or environment variables.',
      }, { status: 503 });
    }

    const emailResult = await sendTranslatorAssignmentEmail({
      to: cleanEmail,
      translatorName: finalTranslatorName,
      eventTitle: event.title,
      languageName,
      roomUrl,
      scheduledStart: event.scheduled_start,
      orgName: org.name,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.error || 'Failed to dispatch email via Resend.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Assignment email successfully sent to ${cleanEmail}`,
      emailId: emailResult.id,
    });
  } catch (err: any) {
    console.error('[API /api/translators/notify] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to send translator notification' },
      { status: 500 }
    );
  }
}
