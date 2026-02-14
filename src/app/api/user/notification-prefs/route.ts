// ============================================================
// FILE: src/app/api/user/notification-prefs/route.ts
// Stores and retrieves per-user notification preferences.
// We store them in the UserPreferences.theme field as JSON
// (hack — or add a proper notifPrefs Json column, see bottom).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const prefsSchema = z.object({
  pushEnabled:         z.boolean().optional(),
  streakReminder:      z.boolean().optional(),
  streakTime:          z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quizReminders:       z.boolean().optional(),
  savedTopicsUpdates:  z.boolean().optional(),
  leaderboardChanges:  z.boolean().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
      select: { notifPrefs: true },
    });

    // Return stored JSON prefs (null if never set — component uses defaults)
    const stored = (prefs?.notifPrefs as Record<string, unknown>) ?? {};
    return NextResponse.json(stored);
  } catch (error) {
    console.error('Get notif prefs error:', error);
    return NextResponse.json({});
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updates = prefsSchema.parse(body);

    // Fetch existing to merge
    const existing = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
      select: { notifPrefs: true },
    });

    const merged = {
      ...((existing?.notifPrefs as Record<string, unknown>) ?? {}),
      ...updates,
    };

    await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, notifPrefs: merged },
      update: { notifPrefs: merged },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Save notif prefs error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// ============================================================
// REQUIRED: Add notifPrefs column to UserPreferences
//
// 1. In prisma/schema.prisma, add to UserPreferences model:
//      notifPrefs Json?
//
// 2. Run: npx prisma migrate dev --name add_notif_prefs
//
// That's it. The route above handles the rest.
// ============================================================
