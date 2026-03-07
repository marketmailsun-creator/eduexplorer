// ============================================================
// FILE: src/app/api/push/test-notification/route.ts
// DEV-ONLY endpoint: sends a test push notification to the
// authenticated user via FCM (native) or VAPID (browser).
// Returns 403 in production.
// Usage: POST /api/push/test-notification (no body needed)
// ============================================================

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { sendFcmNotification } from '@/lib/firebase/firebase-messaging';
import { sendPushNotification } from '@/lib/services/push-notifications.service';

export async function POST() {
  // Only available in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { fcmToken: true, name: true },
  });

  const payload = {
    title: '🔔 Test Notification',
    body: `Hello ${user?.name ?? 'there'}! Push notifications are working correctly.`,
    url: '/explore',
  };

  let fcmResult = false;
  let vapidResult = false;

  // Try FCM first (native app users)
  if (user?.fcmToken) {
    fcmResult = await sendFcmNotification(
      user.fcmToken,
      payload.title,
      payload.body,
      { url: payload.url }
    );
  }

  // Try VAPID (browser push subscription)
  try {
    await sendPushNotification(session.user.id, payload);
    vapidResult = true;
  } catch {
    vapidResult = false;
  }

  return NextResponse.json({
    fcm: {
      attempted: !!user?.fcmToken,
      sent: fcmResult,
      tokenPresent: !!user?.fcmToken,
    },
    vapid: {
      attempted: true,
      sent: vapidResult,
    },
    message: fcmResult || vapidResult
      ? 'Test notification sent! Check your device/browser.'
      : 'No active push subscriptions found. Subscribe to push notifications first (native app or browser).',
  });
}
