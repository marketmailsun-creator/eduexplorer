// src/app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Web Push subscription shape: { endpoint, keys: { p256dh, auth } }
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription — missing endpoint or keys' },
        { status: 400 }
      );
    }

    // Upsert so re-subscribing on the same device doesn't duplicate
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: {
        // Refresh keys in case they rotated
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: session.user.id,
      },
    });

    console.log('✅ Push subscription saved for user', session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Push subscribe error:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}