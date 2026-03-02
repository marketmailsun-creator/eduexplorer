/**
 * Initialize Capacitor Push Notifications for native iOS/Android.
 * Call this once on app startup in a client component.
 * Does nothing in the browser (Capacitor is only active in native context).
 */
export async function initCapacitorPush() {
  // Only run in Capacitor native context
  if (typeof window === 'undefined') return;
  if (!(window as any).Capacitor?.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Request permission
    const { receive } = await PushNotifications.requestPermissions();
    if (receive !== 'granted') return;

    await PushNotifications.register();

    // Handle token registration — send to your backend
    PushNotifications.addListener('registration', (token) => {
      console.log('Native push token:', token.value);
      // TODO: POST token to /api/push/register-native-token
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });
  } catch (err) {
    // Capacitor push not available (web context) — safe to ignore
    console.log('Capacitor push not available:', err);
  }
}
