// src/app/api/cron/whatsapp-notifications/route.ts — CREATE NEW
//
// Called by Vercel Cron (or any cron service).
// Add to vercel.json:
//   {
//     "crons": [
//       { "path": "/api/cron/whatsapp-notifications", "schedule": "0 9 * * 1" }
//     ]
//   }
// (runs every Monday at 9 AM UTC = 2:30 PM IST)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  sendWeeklyProgress,
  sendQuizReminder,
} from '@/lib/services/msg91.service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify this is a legitimate cron call
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get('type') || 'weekly';
  const results = { sent: 0, failed: 0, skipped: 0 };

  try {
    if (type === 'weekly') {
      await sendWeeklyProgressMessages(results);
    } else if (type === 'quiz') {
      await sendQuizReminderMessages(results);
    }

    console.log(`[WhatsApp Cron] ${type} complete:`, results);
    return NextResponse.json({ success: true, type, ...results });

  } catch (err) {
    console.error('[WhatsApp Cron] Error:', err);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}

// ── Weekly Progress Messages ──────────────────────────────────
async function sendWeeklyProgressMessages(results: { sent: number; failed: number; skipped: number }) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get users with phone + whatsapp opt-in who were active this week
  const users = await prisma.user.findMany({
    where: {
      phone: { not: null },
      whatsappOptIn: true,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      queries: {
        where: { createdAt: { gte: oneWeekAgo }, status: 'completed' },
        select: { id: true },
      },
      quizScores: {
        where: { completedAt: { gte: oneWeekAgo } },
        select: { score: true, totalQuestions: true },
      },
    },
  });

  for (const user of users) {
    if (!user.phone) { results.skipped++; continue; }

    const topicsCount = user.queries.length;
    if (topicsCount === 0) { results.skipped++; continue; } // skip inactive users

    // Calculate streak
    const streak = await calculateStreak(user.id);

    // Calculate quiz average this week
    const quizAvg = user.quizScores.length > 0
      ? Math.round(
          user.quizScores.reduce((sum, s) => sum + (s.score / s.totalQuestions) * 100, 0)
          / user.quizScores.length
        )
      : 0;

    const ok = await sendWeeklyProgress({
      phone: user.phone,
      name: user.name || 'there',
      topicsCount,
      streak,
      quizAverage: quizAvg,
      profileUrl: `${process.env.NEXT_PUBLIC_APP_URL}/progress`,
    });

    ok ? results.sent++ : results.failed++;

    // Small delay to avoid rate limits
    await sleep(200);
  }
}

// ── Quiz Reminder Messages ────────────────────────────────────
async function sendQuizReminderMessages(results: { sent: number; failed: number; skipped: number }) {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find quiz scores from 3-7 days ago — user explored topic but may not have re-tested
  const scores = await prisma.quizScore.findMany({
    where: {
      completedAt: { gte: sevenDaysAgo, lte: threeDaysAgo },
    },
    include: {
      user: {
        select: { id: true, name: true, phone: true, whatsappOptIn: true },
      },
      query: {
        select: { id: true, queryText: true },
      },
    },
    orderBy: { completedAt: 'desc' },
    distinct: ['userId', 'queryId'], // one reminder per topic per user
  });

  for (const score of scores) {
    const { user, query } = score;
    if (!user.phone || !user.whatsappOptIn) { results.skipped++; continue; }

    const lastScorePct = Math.round((score.score / score.totalQuestions) * 100);
    const quizUrl = `${process.env.NEXT_PUBLIC_APP_URL}/results/${query.id}`;

    const ok = await sendQuizReminder({
      phone: user.phone,
      name: user.name || 'there',
      topic: query.queryText,
      lastScore: lastScorePct,
      quizUrl,
    });

    ok ? results.sent++ : results.failed++;
    await sleep(200);
  }
}

// ── Helpers ───────────────────────────────────────────────────
async function calculateStreak(userId: string): Promise<number> {
  const queries = await prisma.query.findMany({
    where: { userId, status: 'completed' },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const uniqueDays = [...new Set(
    queries.map(q => new Date(q.createdAt).toDateString())
  )];

  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (!uniqueDays.includes(today) && !uniqueDays.includes(yesterday)) return 0;

  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date(Date.now() - i * 86400000).toDateString();
    if (uniqueDays[i] === expected) streak++;
    else break;
  }
  return streak;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
