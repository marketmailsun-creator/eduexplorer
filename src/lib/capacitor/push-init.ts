/**
 * Initialize Capacitor Push Notifications for native iOS/Android via FCM.
 * Call this once on app startup in a client component.
 * Does nothing in the browser (Capacitor is only active in native context).
 *
 * Prerequisites (required before this runs without crashing):
 *   1. Firebase project created at https://console.firebase.google.com
 *   2. Android app added with package name: ai.eduexplorer.app
 *   3. google-services.json downloaded → placed in android/app/
 *   4. Run: npm run cap:sync
 *
 * For iOS:
 *   5. Apple Developer account required ($99/year)
 *   6. APNs key uploaded to Firebase Console → Project Settings → Cloud Messaging
 */
export async function initCapacitorPush() {
  if (typeof window === 'undefined') return;
  if (!(window as any).Capacitor?.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const { receive } = await PushNotifications.requestPermissions();
    console.log('[Push] Permission status:', receive);

    if (receive !== 'granted') return;

    // Register with FCM — requires google-services.json in android/app/
    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      console.log('[Push] FCM token received:', token.value.slice(0, 20) + '...');
      try {
        await fetch('/api/push/fcm-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fcmToken: token.value }),
        });
      } catch (err) {
        console.error('[Push] Failed to save FCM token:', err);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push] FCM registration error:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Received in foreground:', notification.title);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      // Navigate to the URL from the notification data if present
      const url = action.notification.data?.url;
      if (url && typeof window !== 'undefined') {
        window.location.href = url;
      }
    });
  } catch (err) {
    // Capacitor push not available (web context or plugin not loaded) — safe to ignore
    console.log('[Push] Not available:', err);
  }
}
