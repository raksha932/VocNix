import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';
import { createTranslatorToken, getLiveKitConfig } from '@/lib/livekit/tokenService';
import { Logger } from '@/lib/logger/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secureRoomToken, translatorName } = body;

    if (!secureRoomToken) {
      return NextResponse.json(
        { success: false, error: 'Secure room token is required' },
        { status: 400 }
      );
    }

    // 1. Verify token & room existence
    const roomDetails = await Repository.getRoomBySecureToken(secureRoomToken);
    if (!roomDetails) {
      return NextResponse.json(
        { success: false, error: 'Invalid or revoked translator room token' },
        { status: 404 }
      );
    }

    const { room, event, language } = roomDetails;

    // 2. Validate event lifecycle
    if (event.status === 'ended' || event.status === 'expired') {
      return NextResponse.json(
        { success: false, error: `This event has ${event.status}. Broadcasting is closed.` },
        { status: 403 }
      );
    }

    // 3. Enforce usage limits
    const usage = await Repository.getOrganizationUsage(event.organization_id);
    if (usage.isLimitExceeded) {
      return NextResponse.json(
        {
          success: false,
          error: `Organization broadcast limit reached (${usage.usedMinutes} of ${usage.quotaMinutes} minutes used). Please upgrade plan to continue.`,
        },
        { status: 403 }
      );
    }

    // 4. Validate LiveKit configuration
    const livekitConfig = getLiveKitConfig();
    if (!livekitConfig.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error:
            'LiveKit server is not configured on the backend. Please provide LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in your environment.',
        },
        { status: 503 }
      );
    }

    // 5. Start authoritative translator session in database
    const session = await Repository.startTranslatorSession(room.id);

    // 6. Generate secure, short-lived LiveKit token with publishing rights
    const identity = `translator_${session.id.slice(0, 8)}`;
    const name = translatorName?.trim() || `Translator (${language.language_name})`;
    const livekitToken = await createTranslatorToken({
      roomName: room.livekit_room_name,
      translatorIdentity: identity,
      translatorName: name,
    });

    return NextResponse.json({
      success: true,
      token: livekitToken,
      wsUrl: livekitConfig.url,
      sessionId: session.id,
      room: {
        id: room.id,
        livekitRoomName: room.livekit_room_name,
        languageName: language.language_name,
        languageCode: language.language_code,
        eventTitle: event.title,
        startedAt: session.started_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while generating translator token' },
      { status: 500 }
    );
  }
}
