'use client';
// ============================================================
// FILE: src/components/features/DailyGoalWidget.tsx
// Shows today's learning goal progress on the Explore page.
// Fetches progress from /api/progress/me and goal from /api/user/preferences.
// Users can update their goal inline.
// ============================================================

import { useEffect, useState } from 'react';
import { Target, CheckCircle2, Flame } from 'lucide-react';

interface DailyGoalWidgetProps {
  /** compact = small pill, suitable for explore page header area */
  compact?: boolean;
}

export function DailyGoalWidget({ compact = false }: DailyGoalWidgetProps) {
  const [topicsToday, setTopicsToday] = useState<number>(0);
  const [dailyGoal, setDailyGoal] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/progress/me').then(r => r.ok ? r.json() : null),
      fetch('/api/user/preferences').then(r => r.ok ? r.json() : null),
    ])
      .then(([progress, prefs]) => {
        if (progress) {
          setTopicsToday(progress.topicsThisWeek ?? 0); // using week proxy; ideally a today-specific count
          setStreak(progress.streak ?? 0);
        }
        if (prefs?.dailyGoal) setDailyGoal(prefs.dailyGoal);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateGoal = async (newGoal: number) => {
    setSaving(true);
    setDailyGoal(newGoal);
    setShowPicker(false);
    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyGoal: newGoal }),
      });
    } catch {}
    finally { setSaving(false); }
  };

  if (loading) return null;

  const completed = topicsToday >= dailyGoal;
  const progressPct = Math.min((topicsToday / dailyGoal) * 100, 100);

  // ── Compact pill mode (for Explore page header) ─────────────
  if (compact) {
    return (
      <div className="relative inline-flex items-center gap-2">
        <button
          onClick={() => setShowPicker(v => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
                      border transition-all duration-200 shadow-sm
                      ${completed
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700'
                      }`}
        >
          {completed
            ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            : <Target className="h-3.5 w-3.5" />
          }
          <span>
            {topicsToday}/{dailyGoal} today
          </span>
          {streak > 0 && (
            <span className="flex items-center gap-0.5 text-orange-500 ml-0.5">
              <Flame className="h-3 w-3" />
              {streak}
            </span>
          )}
        </button>

        {/* Goal picker dropdown */}
        {showPicker && (
          <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 min-w-[160px]">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Daily goal</p>
            {[1, 2, 3].map(n => (
              <button
                key={n}
                onClick={() => updateGoal(n)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                            ${dailyGoal === n
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'hover:bg-gray-50 text-gray-700'
                            }`}
              >
                {n} topic{n > 1 ? 's' : ''} per day
              </button>
            ))}
          </div>
        )}

        {/* Click outside to close */}
        {showPicker && (
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
        )}
      </div>
    );
  }

  // ── Full card mode (for Progress page) ──────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-500" />
          <span className="font-bold text-gray-900">Daily Goal</span>
        </div>
        <button
          onClick={() => setShowPicker(v => !v)}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
        >
          {saving ? 'Saving…' : 'Change'}
        </button>
      </div>

      {/* Goal picker */}
      {showPicker && (
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => updateGoal(n)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all
                          ${dailyGoal === n
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
                          }`}
            >
              {n}/day
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      <div className="flex items-end gap-3 mb-3">
        <p className={`text-4xl font-extrabold ${completed ? 'text-green-600' : 'text-gray-900'}`}>
          {topicsToday}
          <span className="text-lg font-semibold text-gray-400 ml-1">/ {dailyGoal}</span>
        </p>
        {completed && <span className="text-sm text-green-600 font-semibold pb-1">Goal reached! 🎉</span>}
      </div>

      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700
                      ${completed
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1.5">
        {completed
          ? `You've hit your goal for today! Keep the ${streak}-day streak going.`
          : `${dailyGoal - topicsToday} more topic${dailyGoal - topicsToday > 1 ? 's' : ''} to hit your daily goal`
        }
      </p>
    </div>
  );
}
