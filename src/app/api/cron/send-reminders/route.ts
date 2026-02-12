// ============================================================
// FILE: src/app/api/cron/send-reminders/route.ts
// Triggered daily by Vercel Cron (see vercel.json).
// Finds all due reminders and sends push notifications.
// Protect with CRON_SECRET env var.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendPushNotification } from '@/lib/services/push-notifications.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel Cron call
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all unsent reminders that are due (sendAt <= now)
    const dueReminders = await prisma.quizReviewReminder.findMany({
      where: {
        sent: false,
        sendAt: { lte: now },
      },
      include: {
        query: { select: { queryText: true } },
        user:  { select: { name: true } },
      },
      take: 100, // Process max 100 at a time to stay within timeout
    });

    console.log(`⏰ Processing ${dueReminders.length} due reminders`);

    let sent = 0;
    let failed = 0;

    for (const reminder of dueReminders) {
      try {
        const topic = reminder.query.queryText;
        const userName = reminder.user.name?.split(' ')[0] || 'there';

        const payload =
          reminder.dayNumber === 3
            ? {
                title: '🧠 Time to review!',
                body: `It's been 3 days — test yourself on "${topic}" to lock it in.`,
                url: `/results/${reminder.queryId}`,
              }
            : {
                title: '📚 Weekly review',
                body: `One week since you studied "${topic}". Revisit to boost retention!`,
                url: `/results/${reminder.queryId}`,
              };

        await sendPushNotification(reminder.userId, payload);

        // Mark as sent
        await prisma.quizReviewReminder.update({
          where: { id: reminder.id },
          data: { sent: true },
        });

        sent++;
      } catch (err) {
        console.error(`❌ Failed to send reminder ${reminder.id}:`, err);
        failed++;
      }
    }

    console.log(`✅ Reminders sent: ${sent}, failed: ${failed}`);
    return NextResponse.json({ processed: dueReminders.length, sent, failed });
  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
