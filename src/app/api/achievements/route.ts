import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAchievementsForUser } from '@/lib/services/achievement.service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const achievements = await getAchievementsForUser(session.user.id);
  return NextResponse.json({ achievements });
}
