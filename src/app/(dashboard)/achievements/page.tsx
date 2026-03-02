import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAchievementsForUser } from '@/lib/services/achievement.service';
import { Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const achievements = await getAchievementsForUser(session.user.id);
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const totalXPFromBadges = achievements
    .filter((a) => a.unlocked && a.xpReward > 0)
    .reduce((sum, a) => sum + a.xpReward, 0);

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="h-7 w-7 text-yellow-500" />
        <h1 className="text-2xl font-bold">Achievements</h1>
      </div>
      <p className="text-gray-600 mb-6">
        {unlocked}/{achievements.length} badges unlocked &bull; {totalXPFromBadges} XP earned from badges
      </p>

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
