import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      try {
        const text = await req.text();
        if (text) body = JSON.parse(text);
      } catch {}
    }

    const { roomId, sessionKey } = body;

    if (!roomId || !sessionKey) {
      return NextResponse.json({ success: false, error: 'roomId and sessionKey required' }, { status: 400 });
    }

    const updatedListeners = await Repository.registerAudienceLeave(roomId, sessionKey);
    return NextResponse.json({
      success: true,
      listeners: updatedListeners,
      listenerCount: updatedListeners,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
