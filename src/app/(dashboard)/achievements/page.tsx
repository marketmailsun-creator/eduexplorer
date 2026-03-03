import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAchievementsForUser, checkAndUnlockAchievements } from '@/lib/services/achievement.service';
import { prisma } from '@/lib/db/prisma';
import { Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Canonical achievement definitions — mirrors prisma/seed-achievements.ts
const ACHIEVEMENTS = [
  { code: 'first_quiz',   name: 'Quiz Starter',        description: 'Complete your first quiz',                    xpReward: 5,   iconName: '🎯' },
  { code: 'quiz_perfect', name: 'Perfect Score',        description: 'Score 100% on any quiz',                      xpReward: 20,  iconName: '⭐' },
  { code: 'streak_3',     name: 'Streak Starter',       description: 'Maintain a 3-day learning streak',            xpReward: 10,  iconName: '🔥' },
  { code: 'streak_7',     name: 'Week Warrior',         description: 'Maintain a 7-day learning streak',            xpReward: 20,  iconName: '⚡' },
  { code: 'streak_30',    name: 'Month Master',         description: 'Maintain a 30-day learning streak',           xpReward: 100, iconName: '🏆' },
  { code: 'explorer_10',  name: 'Curious Explorer',     description: 'Search and explore 10 unique topics',         xpReward: 15,  iconName: '🔭' },
  { code: 'xp_100',       name: 'Knowledge Seeker',     description: 'Earn 100 XP total',                           xpReward: 0,   iconName: '📚' },
  { code: 'xp_500',       name: 'Learning Champion',    description: 'Earn 500 XP total',                           xpReward: 0,   iconName: '🎓' },
];

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;

  // ── Auto-seed achievements if the table is empty ──────────────────────────
  // This is idempotent: createMany with skipDuplicates is a no-op if already seeded.
  const existingCount = await prisma.achievement.count();
  if (existingCount < ACHIEVEMENTS.length) {
    await prisma.achievement.createMany({ data: ACHIEVEMENTS, skipDuplicates: true });
  }

  // ── Retroactively unlock any earned achievements ───────────────────────────
  // Checks user's current stats (XP, streak, quiz count, etc.) and unlocks
  // any achievements they've already earned but haven't been awarded yet.
  await checkAndUnlockAchievements(userId);

  // ── Fetch data ────────────────────────────────────────────────────────────
  const [achievements, userRecord] = await Promise.all([
    getAchievementsForUser(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { totalXP: true } }),
  ]);

  const unlocked = achievements.filter((a) => a.unlocked).length;
  const totalXP = userRecord?.totalXP ?? 0;
  const totalXPFromBadges = achievements
    .filter((a) => a.unlocked && a.xpReward > 0)
    .reduce((sum, a) => sum + a.xpReward, 0);

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="h-7 w-7 text-yellow-500" />
        <h1 className="text-2xl font-bold">Achievements</h1>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-6">
        <p className="text-gray-600">
          {unlocked}/{achievements.length} badges unlocked
        </p>
        <span className="text-gray-300 hidden sm:inline">·</span>
        <p className="text-indigo-600 font-semibold">
          {totalXP} XP total earned
        </p>
        {totalXPFromBadges > 0 && (
          <>
            <span className="text-gray-300 hidden sm:inline">·</span>
            <p className="text-yellow-600 text-sm">
              {totalXPFromBadges} XP from badges
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {achievements.map((a) => (
          <div
            key={a.code}
            className={`rounded-xl border p-4 text-center space-y-2 transition-all ${
              a.unlocked
                ? 'border-yellow-400 bg-yellow-50 shadow-sm'
                : 'border-gray-200 bg-gray-50 opacity-50 grayscale'
            }`}
          >
            <div className="text-4xl">{a.iconName}</div>
            <div className="font-semibold text-sm leading-tight">{a.name}</div>
            <div className="text-xs text-muted-foreground">{a.description}</div>
            {a.xpReward > 0 && (
              <div className="text-xs font-medium text-yellow-600">+{a.xpReward} XP</div>
            )}
            {a.unlocked && a.unlockedAt ? (
              <div className="text-xs text-green-600 font-medium">
                ✓ {new Date(a.unlockedAt).toLocaleDateString()}
              </div>
            ) : (
              <div className="text-xs text-gray-400">Locked</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
