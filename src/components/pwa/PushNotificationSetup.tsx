'use client';

import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PushNotificationSetup() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const isNativePlatform = () =>
    typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform();

  const subscribe = async () => {
    setLoading(true);

    try {
      // ── Native iOS/Android (Capacitor + FCM) ───────────────────────────────
      if (isNativePlatform()) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const { receive } = await PushNotifications.requestPermissions();
        if (receive !== 'granted') {
          alert('Please enable notifications in your device Settings → EduExplorer → Notifications');
          return;
        }
        await PushNotifications.register();
        setEnabled(true);
        console.log('✅ Native FCM push enabled');
        return;
      }

      // ── Web Push (VAPID) ───────────────────────────────────────────────────
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        alert('Please enable notifications in your browser settings');
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      // Save subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      setEnabled(true);
      console.log('✅ Web Push (VAPID) enabled');
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);

    try {
      if (isNativePlatform()) {
        // On native, just update local state — FCM token remains registered
        // until the user uninstalls or clears app data
        setEnabled(false);
        console.log('🔕 Native push toggled off locally');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        });
      }

      setEnabled(false);
      console.log('🔕 Web Push (VAPID) disabled');
    } catch (error) {
      console.error('❌ Unsubscribe failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={enabled ? unsubscribe : subscribe}
      disabled={loading}
      variant={enabled ? 'outline' : 'default'}
      size="sm"
      className="text-xs h-8 px-3 w-full sm:w-auto"
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {enabled ? 'Disabling…' : 'Enabling…'}
        </span>
      ) : enabled ? (
        <span className="flex items-center gap-1.5">
          <BellOff className="w-3.5 h-3.5" />
          Disable
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5" />
          Enable
        </span>
      )}
    </Button>
  );
}
