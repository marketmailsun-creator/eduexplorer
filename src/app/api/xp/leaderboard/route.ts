import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getXPLeaderboard } from '@/lib/services/xp.service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leaderboard = await getXPLeaderboard(50);
  return NextResponse.json({ leaderboard, currentUserId: session.user.id });
}
