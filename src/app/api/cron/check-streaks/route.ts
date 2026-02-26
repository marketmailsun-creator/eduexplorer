import { NextRequest, NextResponse } from 'next/server';
import { getStreakAtRiskUsers } from '@/lib/services/streak.service';
import { sendPushNotification } from '@/lib/services/push-notifications.service';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let streakAtRiskCount = 0;
  let reEngagedCount = 0;

  try {
    // 1. Streak at risk: last active yesterday, no activity today
    const atRisk = await getStreakAtRiskUsers();
    streakAtRiskCount = atRisk.length;

    for (const { userId, currentStreak } of atRisk) {
      await sendPushNotification(userId, {
        title: '🔥 Streak at risk!',
        body: `Your ${currentStreak}-day streak expires tonight. Open EduExplorer to keep it!`,
        url: '/explore',
      });
    }

    // 2. Re-engagement: no activity in 3+ days (streak already broken but had activity before)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const dormant = await prisma.userStreak.findMany({
      where: {
        lastActiveDate: { lt: threeDaysAgo },
        longestStreak: { gte: 1 }, // Had a streak at some point
      },
      select: { userId: true },
      take: 200,
    });
    reEngagedCount = dormant.length;

    for (const { userId } of dormant) {
      await sendPushNotification(userId, {
        title: '📚 Miss learning?',
        body: 'Come back and keep your XP growing! New topics are waiting for you.',
        url: '/explore',
      });
    }

    // 3. Auto-expire stale challenges (older than 48h and still PENDING/ACCEPTED)
    const expiredCount = await prisma.challenge.updateMany({
      where: {
        status: { in: ['PENDING', 'ACCEPTED'] },
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    return NextResponse.json({
      success: true,
      streakAtRisk: streakAtRiskCount,
      reEngaged: reEngagedCount,
      challengesExpired: expiredCount.count,
    });
  } catch (error) {
    console.error('Check-streaks cron error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
