/**
 * Initialize Capacitor Push Notifications for native iOS/Android.
 * Call this once on app startup in a client component.
 * Does nothing in the browser (Capacitor is only active in native context).
 *
 * ⚠️  IMPORTANT: PushNotifications.register() is intentionally disabled.
 *     Calling register() requires google-services.json + Firebase setup.
 *     Without it, the native FirebaseApp throws IllegalStateException and
 *     crashes the WebView entirely (not catchable from JavaScript).
 *
 *     To enable push notifications:
 *     1. Create a Firebase project at https://console.firebase.google.com
 *     2. Add Android app with package name: ai.eduexplorer.app
 *     3. Download google-services.json → place in android/app/
 *     4. Create backend endpoint: POST /api/push/register-native-token
 *     5. Uncomment the register() block below and re-sync: npm run cap:sync
 */
export async function initCapacitorPush() {
  if (typeof window === 'undefined') return;
  if (!(window as any).Capacitor?.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Request permission only — does NOT crash without google-services.json.
    // Stores the OS permission state so we don't need to prompt again later.
    const { receive } = await PushNotifications.requestPermissions();
    console.log('[Push] Permission status:', receive);

    // ── Re-enable this block after adding android/app/google-services.json ──
    // if (receive !== 'granted') return;
    // await PushNotifications.register();
    // PushNotifications.addListener('registration', async (token) => {
    //   console.log('Native push token:', token.value);
    //   await fetch('/api/push/register-native-token', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ token: token.value }),
    //   });
    // });
    // PushNotifications.addListener('registrationError', (err) => {
    //   console.error('Push registration error:', err);
    // });
    // ────────────────────────────────────────────────────────────────────────
  } catch (err) {
    // Capacitor push not available (web context or plugin not loaded) — safe to ignore
    console.log('[Push] Not available:', err);
  }
}
