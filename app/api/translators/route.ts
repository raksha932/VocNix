import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const org = await Repository.getDefaultOrganization();
    const translators = await Repository.getTranslators(org.id);
    return NextResponse.json({ success: true, translators });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, email, native_languages } = body;

    if (!full_name || !email) {
      return NextResponse.json({ success: false, error: 'Full name and email are required' }, { status: 400 });
    }

    const org = await Repository.getDefaultOrganization();
    const translator = await Repository.createTranslator({
      organization_id: org.id,
      full_name,
      email,
      native_languages: native_languages || [],
    });

    return NextResponse.json({ success: true, translator });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
