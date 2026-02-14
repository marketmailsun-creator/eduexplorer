'use client';
// ============================================================
// FILE: src/components/features/NotificationPreferences.tsx
// Full notification settings panel.
// Add inside the profile page between stats and quick actions.
// ============================================================

import { useEffect, useState } from 'react';
import { Bell, BellOff, Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface NotifPrefs {
  pushEnabled: boolean;
  streakReminder: boolean;
  streakTime: string;       // "HH:MM" 24h format, e.g. "20:00"
  quizReminders: boolean;
  savedTopicsUpdates: boolean;
  leaderboardChanges: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  pushEnabled: false,
  streakReminder: true,
  streakTime: '20:00',
  quizReminders: true,
  savedTopicsUpdates: false,
  leaderboardChanges: false,
};

// Helper — nicely display 24h time as 12h
function fmt12h(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationPreferences() {
  const [prefs, setPrefs]     = useState<NotifPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [savedMsg, setSavedMsg] = useState<'ok' | 'err' | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  // ── Load existing prefs from API ──────────────────────────
  useEffect(() => {
    // Check browser notification permission
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }

    fetch('/api/user/notification-prefs')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPrefs(prev => ({ ...prev, ...data })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Subscribe to push notifications ─────────────────────
  const enablePush = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      setPrefs(prev => ({ ...prev, pushEnabled: true }));
    } catch (err) {
      console.error('Push subscribe error:', err);
    }
  };

  const disablePush = async () => {
    try {
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
      setPrefs(prev => ({ ...prev, pushEnabled: false }));
    } catch (err) {
      console.error('Push unsubscribe error:', err);
    }
  };

  // ── Save preferences ──────────────────────────────────────
  const save = async (updates: Partial<NotifPrefs>) => {
    const next = { ...prefs, ...updates };
    setPrefs(next);
    setSaving(true);
    setSavedMsg(null);

    try {
      const res = await fetch('/api/user/notification-prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      setSavedMsg(res.ok ? 'ok' : 'err');
    } catch {
      setSavedMsg('err');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-indigo-500" />
          <span className="font-bold text-gray-900">Notifications</span>
        </div>
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Bell className="h-4 w-4 text-indigo-600" />
          </div>
          <span className="font-bold text-gray-900">Notifications</span>
        </div>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        {savedMsg === 'ok'  && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        {savedMsg === 'err' && <AlertCircle  className="h-4 w-4 text-red-500"   />}
      </div>

      <div className="p-5 space-y-1">

        {/* ── Master push toggle ────────────────────────────────── */}
        <div className={`flex items-center justify-between p-4 rounded-xl transition-colors
                         ${prefs.pushEnabled ? 'bg-indigo-50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                             ${prefs.pushEnabled ? 'bg-indigo-500' : 'bg-gray-200'}`}>
              {prefs.pushEnabled
                ? <Bell   className="h-4 w-4 text-white" />
                : <BellOff className="h-4 w-4 text-gray-500" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Push Notifications</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {permissionState === 'denied'
                  ? 'Blocked in browser — update in browser settings'
                  : prefs.pushEnabled ? 'Active on this device' : 'Enable to get reminders'}
              </p>
            </div>
          </div>

          {permissionState !== 'denied' && (
            <button
              onClick={() => prefs.pushEnabled ? disablePush() : enablePush()}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                          border-2 border-transparent transition-colors duration-200 focus:outline-none
                          ${prefs.pushEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform
                                transition-transform duration-200
                                ${prefs.pushEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          )}
        </div>

        {/* ── Individual preferences (only shown when push is enabled) ── */}
        {prefs.pushEnabled && (
          <div className="space-y-px pt-2">

            {/* Daily streak reminder + time picker */}
            <div className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-base mt-0.5">🔥</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Daily streak reminder</p>
                  <p className="text-xs text-gray-400 mt-0.5">Stay consistent with daily learning</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {prefs.streakReminder && (
                  <div className="flex items-center gap-1 bg-orange-50 border border-orange-100
                                   rounded-lg px-2 py-1">
                    <Clock className="h-3 w-3 text-orange-500" />
                    <input
                      type="time"
                      value={prefs.streakTime}
                      onChange={e => save({ streakTime: e.target.value })}
                      className="text-xs font-semibold text-orange-700 bg-transparent
                                 border-none outline-none w-16 cursor-pointer"
                    />
                  </div>
                )}
                <Toggle
                  checked={prefs.streakReminder}
                  color="orange"
                  onChange={v => save({ streakReminder: v })}
                />
              </div>
            </div>

            {/* Spaced repetition quiz reminders */}
            <div className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-base mt-0.5">🧠</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Quiz review reminders</p>
                  <p className="text-xs text-gray-400 mt-0.5">Day 3 & day 7 spaced repetition</p>
                </div>
              </div>
              <Toggle
                checked={prefs.quizReminders}
                color="blue"
                onChange={v => save({ quizReminders: v })}
              />
            </div>

            {/* New content from saved topics */}
            <div className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-base mt-0.5">📚</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Saved topic updates</p>
                  <p className="text-xs text-gray-400 mt-0.5">New related content on your saved topics</p>
                </div>
              </div>
              <Toggle
                checked={prefs.savedTopicsUpdates}
                color="green"
                onChange={v => save({ savedTopicsUpdates: v })}
              />
            </div>

            {/* Leaderboard changes */}
            <div className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-base mt-0.5">🏆</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Leaderboard changes</p>
                  <p className="text-xs text-gray-400 mt-0.5">When your quiz ranking changes</p>
                </div>
              </div>
              <Toggle
                checked={prefs.leaderboardChanges}
                color="yellow"
                onChange={v => save({ leaderboardChanges: v })}
              />
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable toggle switch ────────────────────────────────────
function Toggle({
  checked,
  color,
  onChange,
}: {
  checked: boolean;
  color: 'orange' | 'blue' | 'green' | 'yellow' | 'indigo';
  onChange: (v: boolean) => void;
}) {
  const bgOn: Record<string, string> = {
    orange: 'bg-orange-500',
    blue:   'bg-blue-500',
    green:  'bg-green-500',
    yellow: 'bg-yellow-500',
    indigo: 'bg-indigo-600',
  };

  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                  border-2 border-transparent transition-colors duration-200
                  ${checked ? bgOn[color] : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform
                        transition-transform duration-200
                        ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}
