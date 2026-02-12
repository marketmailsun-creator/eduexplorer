// ============================================================
// FILE: src/app/api/quiz/schedule-reminders/route.ts
// Called by PracticeQuizViewer right after score is submitted.
// Schedules day-3 and day-7 push notification reminders.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { queryId } = await req.json();
    if (!queryId) {
      return NextResponse.json({ error: 'queryId required' }, { status: 400 });
    }

    const userId = session.user.id;
    const now = new Date();

    // Day 3 and Day 7 reminder timestamps (same time of day they completed quiz)
    const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Upsert both reminders — safe to call multiple times for same quiz
    await prisma.$transaction([
      prisma.quizReviewReminder.upsert({
        where: { userId_queryId_dayNumber: { userId, queryId, dayNumber: 3 } },
        create: { userId, queryId, dayNumber: 3, sendAt: day3 },
        update: { sendAt: day3, sent: false }, // reset if they retook quiz
      }),
      prisma.quizReviewReminder.upsert({
        where: { userId_queryId_dayNumber: { userId, queryId, dayNumber: 7 } },
        create: { userId, queryId, dayNumber: 7, sendAt: day7 },
        update: { sendAt: day7, sent: false },
      }),
    ]);

    console.log(`✅ Scheduled day-3 and day-7 reminders for user ${userId}, query ${queryId}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('❌ Schedule reminders error:', error);
    // Non-critical — don't break the quiz flow
    return NextResponse.json({ ok: false });
  }
}
