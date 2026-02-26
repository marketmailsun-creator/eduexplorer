import { prisma } from '@/lib/db/prisma';
import { awardXP } from './xp.service';

/**
 * Updates the user's streak. Call once per day per user on any qualifying activity.
 * Returns { streakUpdated, newStreak, weekBonusAwarded }.
 */
export async function updateStreak(userId: string): Promise<{
  streakUpdated: boolean;
  newStreak: number;
  weekBonusAwarded: boolean;
}> {
  const now = new Date();
  const todayStr = toDateStr(now);

  // Get or create streak record
  let streak = await prisma.userStreak.findUnique({ where: { userId } });
  if (!streak) {
    streak = await prisma.userStreak.create({
      data: { userId, currentStreak: 0, longestStreak: 0 },
    });
  }

  const lastActive = streak.lastActiveDate;
  const lastActiveStr = lastActive ? toDateStr(lastActive) : null;

  // Already updated today — idempotent
  if (lastActiveStr === todayStr) {
    return { streakUpdated: false, newStreak: streak.currentStreak, weekBonusAwarded: false };
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateStr(yesterday);

  // Calculate new streak
  let newStreak: number;
  if (lastActiveStr === yesterdayStr) {
    // Consecutive day
    newStreak = streak.currentStreak + 1;
  } else {
    // Streak broken or first activity ever
    newStreak = 1;
  }

  const longestStreak = Math.max(streak.longestStreak, newStreak);

  // Check week bonus (every 7th day of streak)
  let weekBonusAwarded = false;
  let weekBonusLastAwardedAt = streak.weekBonusLastAwardedAt;

  if (newStreak > 0 && newStreak % 7 === 0) {
    const lastBonusDay = streak.weekBonusLastAwardedAt
      ? Math.floor(streak.weekBonusLastAwardedAt.getTime() / (7 * 24 * 60 * 60 * 1000))
      : -1;
    const currentCycle = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));

    if (lastBonusDay !== currentCycle) {
      await awardXP(userId, 20, 'week_streak_bonus', { streak: newStreak });
      weekBonusAwarded = true;
      weekBonusLastAwardedAt = now;
    }
  }

  // Persist streak record
  await prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastActiveDate: now,
      weekBonusLastAwardedAt,
    },
  });

  // Sync denormalized fields on User for fast leaderboard access
  await prisma.user.update({
    where: { id: userId },
    data: { currentStreak: newStreak, longestStreak, lastActiveDate: now },
  });

  return { streakUpdated: true, newStreak, weekBonusAwarded };
}

/**
 * Get streak info for a user.
 */
export async function getStreakInfo(userId: string) {
  const streak = await prisma.userStreak.findUnique({ where: { userId } });
  if (!streak) return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, weekBonusLastAwardedAt: null };
  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveDate: streak.lastActiveDate,
    weekBonusLastAwardedAt: streak.weekBonusLastAwardedAt,
  };
}

/**
 * Get users at risk of losing their streak.
 * Criteria: last active was yesterday, no activity today, streak >= 2.
 */
export async function getStreakAtRiskUsers() {
  const now = new Date();
  const yesterdayStart = new Date(now);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);

  return prisma.userStreak.findMany({
    where: {
      currentStreak: { gte: 2 },
      lastActiveDate: {
        gte: yesterdayStart,
        lte: yesterdayEnd,
      },
    },
    select: { userId: true, currentStreak: true },
  });
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}
