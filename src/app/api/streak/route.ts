import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getStreakInfo } from '@/lib/services/streak.service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const streak = await getStreakInfo(session.user.id);
  return NextResponse.json(streak);
}
