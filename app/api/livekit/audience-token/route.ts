import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';
import { createAudienceToken, getLiveKitConfig } from '@/lib/livekit/tokenService';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventToken, roomId, sessionKey, languageCode } = body;

    if (!eventToken || !roomId) {
      return NextResponse.json(
        { success: false, error: 'Event token and room ID are required' },
        { status: 400 }
      );
    }

    // 1. Verify Event
    const event = await Repository.getEventByPublicToken(eventToken);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found or invalid access link' },
        { status: 404 }
      );
    }

    if (event.status === 'ended' || event.status === 'expired') {
      return NextResponse.json(
        { success: false, error: `This event has ${event.status}. Listening is closed.` },
        { status: 403 }
      );
    }

    // 2. Strict Server-Side Language Lock Enforcement
    const lockCookieName = `vocnix_audience_lock_${eventToken}`;
    const lockedRoomId = req.cookies.get(lockCookieName)?.value;

    const isExplicitLanguageRequest = Boolean(
      languageCode && (event.languages || []).some(
        (l) => l.language_code.toLowerCase() === languageCode.toLowerCase()
      )
    );

    if (lockedRoomId && lockedRoomId !== roomId && !isExplicitLanguageRequest) {
      const lockedRoom = event.rooms.find(r => r.id === lockedRoomId);
      const lockedLang = event.languages.find(l => l.id === lockedRoom?.event_language_id);
      return NextResponse.json(
        {
          success: false,
          error: `Language access restricted. Your session is locked to ${lockedLang?.language_name || 'your initially selected language'}. Language switching is not permitted.`,
          lockedRoomId,
          lockedLanguageName: lockedLang?.language_name,
        },
        { status: 403 }
      );
    }

    // 3. Verify Room belongs to Event
    const room = event.rooms.find(r => r.id === roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Translation room not found for this event' },
        { status: 404 }
      );
    }

    const language = event.languages.find(l => l.id === room.event_language_id);

    if (languageCode && language?.language_code.toLowerCase() !== languageCode.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Language parameter does not match the target translation channel' },
        { status: 400 }
      );
    }

    // 4. Validate LiveKit config
    const livekitConfig = getLiveKitConfig();
    if (!livekitConfig.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Audio server is not configured on the backend. Please verify your environment settings.',
        },
        { status: 503 }
      );
    }

    // 4b. Enforce audience capacity limit based on active subscription plan
    const plan = await Repository.getOrganizationPlan(event.organization_id);
    const maxListeners = plan.max_listeners || 50;
    const currentEventListeners = await Repository.getActiveEventListeners(event.id);
    if (currentEventListeners >= maxListeners) {
      return NextResponse.json(
        {
          success: false,
          error: `Audience limit reached (${maxListeners} listeners allowed on ${plan.name}). Contact host or upgrade subscription.`,
        },
        { status: 403 }
      );
    }

    // 5. Generate listener identity and restricted LiveKit audience token
    const clientSessionKey = sessionKey || randomBytes(12).toString('hex');
    const listenerIdentity = `listener_${clientSessionKey.slice(0, 8)}`;

    const token = await createAudienceToken({
      roomName: room.livekit_room_name,
      listenerIdentity,
    });

    // 6. Register audience join to maintain authoritative listener counts
    const ip = req.headers.get('x-forwarded-for') || req.ip || '';
    const ua = req.headers.get('user-agent') || '';
    const currentListeners = await Repository.registerAudienceJoin(room.id, clientSessionKey, { ip, ua });

    const response = NextResponse.json({
      success: true,
      token,
      wsUrl: livekitConfig.url,
      sessionKey: clientSessionKey,
      room: {
        id: room.id,
        livekitRoomName: room.livekit_room_name,
        status: room.status,
        languageName: language?.language_name || 'Translation',
        languageCode: language?.language_code || 'xx',
        listeners: currentListeners,
      },
    });

    // 7. Lock session to this room via secure HTTP cookie
    const forwardedProto = req.headers.get('x-forwarded-proto');
    const host = req.headers.get('host') || '';
    const isHttps = forwardedProto === 'https' || (process.env.NODE_ENV === 'production' && !host.includes('localhost') && !host.includes('127.0.0.1'));

    response.cookies.set(lockCookieName, room.id, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours lock
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while generating audience token' },
      { status: 500 }
    );
  }
}
