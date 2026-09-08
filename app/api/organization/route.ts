import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const org = await Repository.getDefaultOrganization();
    return NextResponse.json({ success: true, organization: org });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug } = body;
    const org = await Repository.getDefaultOrganization();

    const updated = await Repository.updateOrganization(org.id, { name, slug });
    return NextResponse.json({ success: true, organization: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
