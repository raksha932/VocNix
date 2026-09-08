import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { code, name } = body;
    if (!code || !name) {
      return NextResponse.json({ success: false, error: 'Language code and name required' }, { status: 400 });
    }

    const room = await Repository.addEventLanguage(params.id, { code, name });
    return NextResponse.json({ success: true, room });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const languageId = searchParams.get('languageId');
    if (!languageId) {
      return NextResponse.json({ success: false, error: 'languageId is required' }, { status: 400 });
    }

    const deleted = await Repository.removeEventLanguage(params.id, languageId);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
