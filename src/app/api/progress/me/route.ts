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
  const today = now.toDateString();
  const yesterday = new Date(now.setDate(now.getDate() - 1)).toDateString();
  if (uniqueDays.includes(today) || uniqueDays.includes(yesterday)) {
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
  const badges: string[] = [];
  if (streak >= 3)    badges.push('🔥 3-Day Streak');
  if (streak >= 7)    badges.push('⚡ Week Warrior');
  if (totalTopics >= 10) badges.push('📚 Knowledge Seeker');
  if (totalTopics >= 50) badges.push('🧠 Scholar');
  if (quizAvg >= 80)  badges.push('🏆 Quiz Master');
  if (quizScores.length >= 5) badges.push('🎯 Quiz Enthusiast');

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