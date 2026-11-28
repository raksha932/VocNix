import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } | Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { roomId } = resolvedParams;
    if (!roomId) {
      return NextResponse.json({ success: false, error: 'Room ID required' }, { status: 400 });
    }

    const announcements = await Repository.getRoomAnnouncements(roomId, 50);

    return NextResponse.json(
      {
        success: true,
        roomId,
        announcements,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } | Promise<{ roomId: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { roomId } = resolvedParams;
    if (!roomId) {
      return NextResponse.json({ success: false, error: 'Room ID required' }, { status: 400 });
    }

    const body = await req.json();
    const { id, message, senderName, languageCode } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Announcement message cannot be empty' },
        { status: 400 }
      );
    }

    // Limit message to 500 characters
    const trimmedMessage = message.trim().slice(0, 500);

    const announcement = await Repository.createRoomAnnouncement({
      id: id || undefined,
      roomId,
      senderName: senderName || 'Translator',
      languageCode: languageCode || undefined,
      message: trimmedMessage,
    });

    return NextResponse.json(
      {
        success: true,
        announcement,
      },
      { status: 201, headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
