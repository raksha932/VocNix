import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: NextRequest) {
  try {
    const org = await Repository.getDefaultOrganization();
    const stats = await Repository.getDashboardStats(org.id);
    const logs = await Repository.getActivityLogs(org.id, 10);
    const events = await Repository.getEvents(org.id);

    return NextResponse.json(
      {
        success: true,
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
        stats,
        recentEvents: events.slice(0, 5),
        activityLogs: logs,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load dashboard metrics' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
