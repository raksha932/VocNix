import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// GET /api/events - List events for the default or authenticated organization
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const limitParam = searchParams.get('limit');
    const limit = all ? undefined : (limitParam ? parseInt(limitParam, 10) : undefined);

    const org = await Repository.getDefaultOrganization();
    const events = await Repository.getEvents(org.id, { limit });
    return NextResponse.json(
      { success: true, events, count: events.length },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch events' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// POST /api/events - Create dynamic event and auto-generate dynamic language translation rooms
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, scheduled_start, scheduled_end, languages } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Event title is required' },
        { status: 400 }
      );
    }

    if (!languages || !Array.isArray(languages) || languages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one language must be specified for dynamic translation rooms' },
        { status: 400 }
      );
    }

    const org = await Repository.getDefaultOrganization();

    // Check plan limits before creating
    const usage = await Repository.getOrganizationUsage(org.id);
    if (usage.isLimitExceeded) {
      return NextResponse.json(
        {
          success: false,
          error: `Organization plan limit exceeded (${usage.usedMinutes}/${usage.quotaMinutes} minutes used). Please upgrade your subscription.`,
        },
        { status: 403 }
      );
    }

    const result = await Repository.createEvent({
      organization_id: org.id,
      title: title.trim(),
      description,
      scheduled_start: scheduled_start || new Date().toISOString(),
      scheduled_end,
      languages,
    });

    return NextResponse.json(
      {
        success: true,
        event: result.event,
        rooms: result.rooms,
        message: `Created event with ${result.rooms.length} dynamic language translation room(s)`,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create event' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
