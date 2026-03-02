import { prisma } from '@/lib/db/prisma';
import { awardXP } from './xp.service';

export interface UnlockedAchievement {
  code: string;
  name: string;
  iconName: string;
  xpReward: number;
}

/**
 * Check and unlock achievements for a user after an XP/streak event.
 * Returns newly unlocked achievements (empty array if none).
 */
export async function checkAndUnlockAchievements(
  userId: string
): Promise<UnlockedAchievement[]> {
  const [user, streakRecord, allAchievements, userAchievements, topicsCount, quizCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { totalXP: true, currentStreak: true },
      }),
      prisma.userStreak.findUnique({ where: { userId } }),
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
      prisma.query.count({ where: { userId } }),
      prisma.quizScore.count({ where: { userId } }),
    ]);

  if (!user) return [];

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
  const newlyUnlocked: UnlockedAchievement[] = [];

  const streak = streakRecord?.currentStreak ?? 0;

  // Check for a perfect quiz (score == totalQuestions)
  // Note: must capture result first — if queryRaw returns [], [0]?.count is undefined
  // and undefined !== '0' would incorrectly evaluate to true.
  const perfectQuizRows = quizCount > 0
    ? await prisma.$queryRaw<{ count: string }[]>`
        SELECT COUNT(*) as count FROM "quiz_scores"
        WHERE "userId" = ${userId}
          AND score = "totalQuestions"
        LIMIT 1
      `
    : [];
  const hasPerfectQuiz = perfectQuizRows.length > 0 && Number(perfectQuizRows[0].count) > 0;

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;

    let shouldUnlock = false;

    switch (achievement.code) {
      case 'first_quiz':
        shouldUnlock = quizCount >= 1;
        break;
      case 'quiz_perfect':
        shouldUnlock = hasPerfectQuiz;
        break;
      case 'streak_3':
        shouldUnlock = streak >= 3;
        break;
      case 'streak_7':
        shouldUnlock = streak >= 7;
        break;
      case 'streak_30':
        shouldUnlock = streak >= 30;
        break;
      case 'explorer_10':
        shouldUnlock = topicsCount >= 10;
        break;
      case 'xp_100':
        shouldUnlock = user.totalXP >= 100;
        break;
      case 'xp_500':
        shouldUnlock = user.totalXP >= 500;
        break;
    }

    if (shouldUnlock) {
      try {
        await prisma.userAchievement.create({
          data: { userId, achievementId: achievement.id },
        });
        if (achievement.xpReward > 0) {
          await awardXP(userId, achievement.xpReward, 'achievement_bonus', {
            achievementCode: achievement.code,
          });
        }
        newlyUnlocked.push({
          code: achievement.code,
          name: achievement.name,
          iconName: achievement.iconName,
          xpReward: achievement.xpReward,
        });
      } catch {
        // Race condition — already unlocked by a parallel request; safe to ignore
      }
    }
  }

  return newlyUnlocked;
}

/**
 * Get all achievements with user unlock status.
 */
export async function getAchievementsForUser(userId: string) {
  const [all, userAchievements] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { xpReward: 'asc' } }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: { select: { code: true } } },
    }),
  ]);

  const unlockedMap = new Map(
    userAchievements.map((ua) => [ua.achievement.code, ua.unlockedAt])
  );

  return all.map((a) => ({
    ...a,
    unlocked: unlockedMap.has(a.code),
    unlockedAt: unlockedMap.get(a.code) ?? null,
  }));
}
