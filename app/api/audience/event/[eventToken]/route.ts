import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { eventToken: string } }
) {
  try {
    const { eventToken } = params;
    if (!eventToken) {
      return NextResponse.json({ success: false, error: 'Event token is required' }, { status: 400 });
    }

    const event = await Repository.getEventByPublicToken(eventToken);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found or access link is invalid' }, { status: 404 });
    }

    if (event.status === 'ended' || event.status === 'expired') {
      return NextResponse.json({
        success: false,
        error: `This event has ${event.status}. Listening is closed.`,
        event: {
          id: event.id,
          title: event.title,
          status: event.status,
        },
      }, { status: 403 });
    }

    // Check if the audience member has a locked language cookie
    const lockCookieName = 'vocnix_audience_lock_' + eventToken;
    const lockedRoomId = req.cookies.get(lockCookieName)?.value || null;

    // Map languages with their respective room ID and current status
    const languages = (event.languages || []).map((lang) => {
      const room = event.rooms?.find((r) => r.event_language_id === lang.id);
      return {
        id: lang.id,
        languageName: lang.language_name,
        languageCode: lang.language_code,
        roomId: room?.id || null,
        roomStatus: room?.status || 'idle',
      };
    });

    // Language-specific audience link resolution:
    // If ?lang= or ?room= is passed, prioritize the explicit language requested by the translator's share link
    const requestedLangParam = req.nextUrl.searchParams.get('lang')?.toLowerCase().trim();
    const requestedRoomParam = req.nextUrl.searchParams.get('room')?.trim();

    let resolvedLockedRoomId = lockedRoomId;
    let matchedRequestedLang = null;

    if (requestedLangParam) {
      matchedRequestedLang = languages.find(
        (l) =>
          l.languageCode.toLowerCase() === requestedLangParam ||
          l.languageName.toLowerCase() === requestedLangParam
      );
      if (matchedRequestedLang?.roomId) {
        resolvedLockedRoomId = matchedRequestedLang.roomId;
      }
    } else if (requestedRoomParam) {
      matchedRequestedLang = languages.find((l) => l.roomId === requestedRoomParam);
      if (matchedRequestedLang?.roomId) {
        resolvedLockedRoomId = matchedRequestedLang.roomId;
      }
    }

    const response = NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        status: event.status,
        scheduledStart: event.scheduled_start,
      },
      languages,
      lockedRoomId: resolvedLockedRoomId,
      requestedLanguage: matchedRequestedLang,
    });

    // If an explicit language channel was accessed, establish the lock cookie immediately
    if (matchedRequestedLang?.roomId) {
      const forwardedProto = req.headers.get('x-forwarded-proto');
      const host = req.headers.get('host') || '';
      const isHttps =
        forwardedProto === 'https' ||
        (process.env.NODE_ENV === 'production' &&
          !host.includes('localhost') &&
          !host.includes('127.0.0.1'));
      response.cookies.set(lockCookieName, matchedRequestedLang.roomId, {
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
