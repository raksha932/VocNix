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

    const { roomId, sessionKey, eventToken } = body;

    if (!roomId || !sessionKey) {
      return NextResponse.json({ success: false, error: 'roomId and sessionKey required' }, { status: 400 });
    }

    const updatedListeners = await Repository.registerAudienceLeave(roomId, sessionKey);

    const response = NextResponse.json({
      success: true,
      listeners: updatedListeners,
      listenerCount: updatedListeners,
    });

    // Clear audience lock cookies so listener can re-select language or exit cleanly
    if (eventToken) {
      const lockCookieName = `vocnix_audience_lock_${eventToken}`;
      response.cookies.set(lockCookieName, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    }

    // Also clear any general audience lock cookies present on request
    const allCookies = req.cookies.getAll();
    for (const c of allCookies) {
      if (c.name.startsWith('vocnix_audience_lock_')) {
        response.cookies.set(c.name, '', {
          path: '/',
          maxAge: 0,
          expires: new Date(0),
        });
      }
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
