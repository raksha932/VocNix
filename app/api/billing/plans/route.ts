import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plans = await Repository.getPlans();
    return NextResponse.json({ success: true, plans });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planSlug } = body;
    if (!planSlug) {
      return NextResponse.json({ success: false, error: 'planSlug is required' }, { status: 400 });
    }

    const org = await Repository.getDefaultOrganization();
    const result = await Repository.upgradeSubscription(org.id, planSlug);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
