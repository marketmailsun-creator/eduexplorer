import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();

  // ── Weekly activity (last 7 days) ──────────────────────────
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentQueries = await prisma.query.findMany({
    where: { userId, createdAt: { gte: sevenDaysAgo }, status: 'completed' },
    select: { createdAt: true, queryText: true, id: true },
    orderBy: { createdAt: 'desc' },
  });

  // Build day-by-day booleans [6 days ago ... today]
  const weekActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return recentQueries.some(q => {
      const qd = new Date(q.createdAt);
      return qd.getFullYear() === d.getFullYear() &&
             qd.getMonth() === d.getMonth() &&
             qd.getDate() === d.getDate();
    });
  });

  // ── Streak calculation ──────────────────────────────────────
  const allDates = await prisma.query.findMany({
    where: { userId, status: 'completed' },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const uniqueDays = [...new Set(
    allDates.map(q => new Date(q.createdAt).toDateString())
  )];
  let streak = 0;
  let longest = 0;
  let temp = 0;
  const todayStr = now.toDateString();
  // Use a separate Date object so we don't mutate `now` (mutation would break weekly activity)
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toDateString();
  if (uniqueDays.includes(todayStr) || uniqueDays.includes(yesterdayStr)) {
    for (let i = 0; i < uniqueDays.length; i++) {
      const d = new Date(uniqueDays[i]);
      const prev = i > 0 ? new Date(uniqueDays[i - 1]) : null;
      const diffDays = prev ? Math.round((new Date(uniqueDays[0]).getTime() - d.getTime()) / 86400000) : 0;
      if (i === 0 || diffDays === i) { temp++; }
      else { longest = Math.max(longest, temp); temp = 1; }
    }
    streak = temp;
    longest = Math.max(longest, temp);
  }

  // ── Quiz stats ──────────────────────────────────────────────
  const quizScores = await prisma.quizScore.findMany({
    where: { userId },
    select: { score: true, totalQuestions: true },
  });
  const quizAvg = quizScores.length
    ? Math.round(quizScores.reduce((a, q) => a + (q.score / q.totalQuestions) * 100, 0) / quizScores.length)
    : 0;

  // ── Recent topics ───────────────────────────────────────────
  const recentTopics = recentQueries.slice(0, 5).map(q => ({
    id: q.id,
    text: q.queryText,
    date: new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  // ── Badges ─────────────────────────────────────────────────
  const totalTopics = await prisma.query.count({ where: { userId, status: 'completed' } });
  const inlineBadges: string[] = [];
  if (streak >= 3)    inlineBadges.push('🔥 3-Day Streak');
  if (streak >= 7)    inlineBadges.push('⚡ Week Warrior');
  if (totalTopics >= 10) inlineBadges.push('📚 Knowledge Seeker');
  if (totalTopics >= 50) inlineBadges.push('🧠 Scholar');
  if (quizAvg >= 80)  inlineBadges.push('🏆 Quiz Master');
  if (quizScores.length >= 5) inlineBadges.push('🎯 Quiz Enthusiast');

  // Also include formally unlocked achievements from the Achievement system
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: { select: { name: true, iconName: true } } },
    orderBy: { unlockedAt: 'desc' },
  });
  const achievementBadges = userAchievements.map(
    ua => `${ua.achievement.iconName || '🏅'} ${ua.achievement.name}`
  );

  // Merge, deduplicating by string value
  const badges = [...new Set([...inlineBadges, ...achievementBadges])];

  return NextResponse.json({
    streak,
    longestStreak: longest,
    topicsThisWeek: recentQueries.length,
    topicsAllTime: totalTopics,
    quizAverage: quizAvg,
    quizCount: quizScores.length,
    weekActivity,
    recentTopics,
    badges,
  });
}