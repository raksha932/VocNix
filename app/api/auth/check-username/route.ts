import { NextRequest, NextResponse } from 'next/server';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username || !username.trim()) {
      return NextResponse.json({ available: false, error: 'Username is required' }, { status: 400 });
    }

    const clean = username.trim().toLowerCase();
    const available = await Repository.isUsernameAvailable(clean);

    return NextResponse.json({ available, username: clean });
  } catch (err: any) {
    return NextResponse.json({ available: false, error: err.message }, { status: 500 });
  }
}
