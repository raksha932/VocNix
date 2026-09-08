import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { action, planSlug, days } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action is required' }, { status: 400 });
    }

    // 1. Suspend Organization
    if (action === 'suspend') {
      const org = await Repository.suspendOrganization(params.id);
      if (!org) return NextResponse.json({ success: false, error: 'Org not found' }, { status: 404 });
      return NextResponse.json({ success: true, organization: org, message: 'Organization suspended' });
    }

    // 2. Reactivate Organization
    if (action === 'reactivate') {
      const org = await Repository.reactivateOrganization(params.id);
      if (!org) return NextResponse.json({ success: false, error: 'Org not found' }, { status: 404 });
      return NextResponse.json({ success: true, organization: org, message: 'Organization reactivated' });
    }

    // 3. Change Plan
    if (action === 'change_plan') {
      if (!planSlug) {
        return NextResponse.json({ success: false, error: 'planSlug is required' }, { status: 400 });
      }
      const result = await Repository.upgradeSubscription(params.id, planSlug);
      return NextResponse.json({ success: true, organization: result.org, message: `Plan updated to ${planSlug}` });
    }

    // 4. Extend Trial
    if (action === 'extend_trial') {
      const extendDays = days ? parseInt(days, 10) : 30;
      const result = await Repository.extendTrial(params.id, extendDays);
      if (!result) return NextResponse.json({ success: false, error: 'Org not found' }, { status: 404 });
      return NextResponse.json({
        success: true,
        organization: result.org,
        newTrialEnd: result.newTrialEnd,
        message: `Trial extended by ${extendDays} days`,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown Super Admin action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
