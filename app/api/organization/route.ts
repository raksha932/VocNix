import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';
import { resolveRequestOrganization } from '@/lib/auth/organization-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const org = await resolveRequestOrganization(req);
    return NextResponse.json({ success: true, organization: org });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, logo_url, contact_number } = body;
    const org = await resolveRequestOrganization(req);

    const updated = await Repository.updateOrganization(org.id, { name, slug, logo_url, contact_number });
    return NextResponse.json({ success: true, organization: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
