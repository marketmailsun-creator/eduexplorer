// ============================================================
// FILE: src/app/api/cron/quota-monitor/route.ts
// Triggered daily at 07:00 UTC by Vercel Cron (see vercel.json).
// Reads yesterday's API usage counters from Redis and sends a
// summary email to ADMIN_EMAIL so you can spot unexpected spikes.
// Protect with CRON_SECRET env var.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/db/redis';
import { sendAdminAlert } from '@/lib/services/email.service';

export const dynamic = 'force-dynamic';

const SERVICES = ['perplexity', 'groq', 'anthropic', 'gemini', 'elevenlabs'];

export async function GET(req: NextRequest) {
  // Verify Vercel Cron auth
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10);

  const counts: Record<string, number> = {};
  for (const service of SERVICES) {
    try {
      const raw = await redis.get(`quota:${service}:${dateStr}`);
      counts[service] = raw ? Number(raw) : 0;
    } catch {
      counts[service] = -1; // error reading
    }
  }

  const lines = SERVICES.map(s => `  ${s.padEnd(14)} ${counts[s] < 0 ? '(error reading)' : counts[s] + ' calls'}`);

  const body = [
    `Daily API Usage Report — ${dateStr}`,
    '',
    ...lines,
    '',
    'No action needed unless numbers look unexpectedly high.',
    'Alert emails are also sent automatically when individual services error.',
  ].join('\n');

  try {
    await sendAdminAlert(`Daily usage report — ${dateStr}`, body);
    console.log('✅ Quota monitor email sent');
  } catch (err) {
    console.error('❌ Quota monitor email failed:', err);
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, date: dateStr, counts });
}
