import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';
import { createAudienceToken, getLiveKitConfig } from '@/lib/livekit/tokenService';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventToken, roomId, sessionKey } = body;

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

    // 2. Verify Room belongs to Event
    const room = event.rooms.find(r => r.id === roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Translation room not found for this event' },
        { status: 404 }
      );
    }

    const language = event.languages.find(l => l.id === room.event_language_id);

    // 3. Validate LiveKit config
    const livekitConfig = getLiveKitConfig();
    if (!livekitConfig.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error:
            'LiveKit server is not configured on the backend. Please provide LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.',
        },
        { status: 503 }
      );
    }

    // 4. Generate listener identity and restricted LiveKit audience token
    const clientSessionKey = sessionKey || randomBytes(12).toString('hex');
    const listenerIdentity = `listener_${clientSessionKey.slice(0, 8)}`;

    const token = await createAudienceToken({
      roomName: room.livekit_room_name,
      listenerIdentity,
    });

    // 5. Register audience join to maintain authoritative listener counts
    const ip = req.headers.get('x-forwarded-for') || req.ip || '';
    const ua = req.headers.get('user-agent') || '';
    const currentListeners = await Repository.registerAudienceJoin(room.id, clientSessionKey, { ip, ua });

    return NextResponse.json({
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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while generating audience token' },
      { status: 500 }
    );
  }
}
