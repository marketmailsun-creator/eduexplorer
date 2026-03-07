import { getAdminMessaging } from './firebase-admin';

/**
 * Send a push notification via Firebase Cloud Messaging (FCM).
 * Used for native Android/iOS push in the Capacitor app.
 * Returns true on success, false if FCM is not configured or send fails.
 */
export async function sendFcmNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  const messaging = getAdminMessaging();
  if (!messaging) return false;

  try {
    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },
      apns: {
        payload: {
          aps: { badge: 1, sound: 'default' },
        },
      },
    });
    return true;
  } catch (err) {
    // Log but don't throw — caller should fall back to VAPID
    console.error('[FCM] Send failed:', err instanceof Error ? err.message : err);
    return false;
  }
}
