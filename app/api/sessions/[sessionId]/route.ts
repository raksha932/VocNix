import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const body = await req.json();
    const { action } = body; // 'pause' | 'resume' | 'stop'

    if (!action || !['pause', 'resume', 'stop'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "pause", "resume", or "stop"' },
        { status: 400 }
      );
    }

    if (action === 'pause') {
      const session = await Repository.pauseTranslatorSession(params.sessionId);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, session, status: 'paused' });
    }

    if (action === 'resume') {
      const session = await Repository.resumeTranslatorSession(params.sessionId);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, session, status: 'live' });
    }

    if (action === 'stop') {
      const result = await Repository.stopTranslatorSession(params.sessionId);
      if (!result) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        session: result.session,
        usageMinutes: result.usageMinutes,
        status: 'ended',
      });
    }

    return NextResponse.json({ success: false, error: 'Unhandled action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update session' },
      { status: 500 }
    );
  }
}
