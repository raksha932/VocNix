import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, sessionKey } = body;

    if (!roomId || !sessionKey) {
      return NextResponse.json({ success: false, error: 'roomId and sessionKey required' }, { status: 400 });
    }

    const updatedListeners = await Repository.registerAudienceLeave(roomId, sessionKey);
    return NextResponse.json({ success: true, listeners: updatedListeners });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
