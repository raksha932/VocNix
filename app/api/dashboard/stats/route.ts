import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const org = await Repository.getDefaultOrganization();
    const stats = await Repository.getDashboardStats(org.id);
    const logs = await Repository.getActivityLogs(org.id, 10);
    const events = await Repository.getEvents(org.id);

    return NextResponse.json({
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      },
      stats,
      recentEvents: events.slice(0, 5),
      activityLogs: logs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load dashboard metrics' },
      { status: 500 }
    );
  }
}
