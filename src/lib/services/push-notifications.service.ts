import webpush from 'web-push';
import { prisma } from '../db/prisma';

// Set VAPID keys (generate with: npx web-push generate-vapid-keys)
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function savePushSubscription(
  userId: string,
  subscription: PushSubscription
) {
  await prisma.pushSubscription.create({
    data: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function sendPushNotification(
  userId: string,
  payload: {
    title: string;
    body: string;
    url?: string;
  }
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const notifications = subscriptions.map((sub) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    return webpush
      .sendNotification(pushSubscription, JSON.stringify(payload))
      .catch((error) => {
        console.error('Push notification failed:', error);
        // Remove invalid subscriptions
        if (error.statusCode === 410) {
          prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      });
  });

  await Promise.all(notifications);
}

// Schedule quiz reminders
export async function scheduleQuizReminder(userId: string, queryId: string) {
  const query = await prisma.query.findUnique({
    where: { id: queryId },
  });

  if (!query) return;

  // Send reminder after 24 hours (use a job queue in production)
  setTimeout(async () => {
    await sendPushNotification(userId, {
      title: 'Quiz Time! 📝',
      body: `Test your knowledge on "${query.queryText}"`,
      url: `/results/${queryId}`,
    });
  }, 24 * 60 * 60 * 1000);
}