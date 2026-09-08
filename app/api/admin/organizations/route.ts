import { NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const organizations = await Repository.getAllOrganizations();
    const plans = await Repository.getPlans();
    return NextResponse.json({ success: true, organizations, plans });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
