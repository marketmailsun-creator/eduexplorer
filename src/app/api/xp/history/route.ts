import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getXPHistory } from '@/lib/services/xp.service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));

  const data = await getXPHistory(session.user.id, page);
  return NextResponse.json(data);
}
