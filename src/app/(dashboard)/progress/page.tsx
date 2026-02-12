'use client';
// ============================================================
// FILE: src/app/(dashboard)/progress/page.tsx
// Full progress dashboard — streak, weekly activity, quiz avg
// Add to mobile nav and sidebar navigation
// ============================================================

import { useEffect, useState } from 'react';
import { Flame, BookOpen, Brain, TrendingUp, Trophy, Target, Calendar, Star, Zap } from 'lucide-react';

interface ProgressData {
  streak: number;
  longestStreak: number;
  topicsThisWeek: number;
  topicsAllTime: number;
  quizAverage: number;
  quizCount: number;
  weekActivity: boolean[];   // 7 booleans, Sun→Sat
  recentTopics: { id: string; text: string; date: string }[];
  badges: string[];
}

// ─────────────────────────────────────────────
// Client page component
// ─────────────────────────────────────────────
export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/progress/me')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ProgressSkeleton />;
  if (!data) return null;

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const quizColor = data.quizAverage >= 80 ? '#10b981' : data.quizAverage >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-5 pt-10 pb-16 text-white">
        <h1 className="text-2xl font-extrabold tracking-tight">Your Progress</h1>
        <p className="text-indigo-200 text-sm mt-1">Keep the streak alive! 🔥</p>
      </div>

      <div className="px-4 -mt-10 space-y-4 max-w-lg mx-auto">

        {/* Streak card */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
              <Flame className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{data.streak}
                <span className="text-base font-semibold text-gray-500 ml-1">day{data.streak !== 1 ? 's' : ''}</span>
              </p>
              <p className="text-sm text-gray-500">Current streak · Best: {data.longestStreak} days</p>
            </div>
          </div>

          {/* Weekly heatmap */}
          <div className="mt-5">
            <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">This Week</p>
            <div className="grid grid-cols-7 gap-1.5">
              {data.weekActivity.map((active, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-lg transition-all ${
                    active
                      ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-sm'
                      : 'bg-gray-100'
                  }`} />
                  <span className="text-[10px] text-gray-400">{dayLabels[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <BookOpen className="h-5 w-5 text-blue-500 mb-2" />
            <p className="text-2xl font-extrabold text-gray-900">{data.topicsThisWeek}</p>
            <p className="text-xs text-gray-500 mt-0.5">Topics this week</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <Brain className="h-5 w-5 text-violet-500 mb-2" />
            <p className="text-2xl font-extrabold text-gray-900">{data.topicsAllTime}</p>
            <p className="text-xs text-gray-500 mt-0.5">Topics all time</p>
          </div>
        </div>

        {/* Quiz avg */}
        {data.quizCount > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                <span className="font-bold text-gray-900">Quiz Average</span>
              </div>
              <span className="text-xs text-gray-400">{data.quizCount} quiz{data.quizCount !== 1 ? 'zes' : ''} taken</span>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-extrabold" style={{ color: quizColor }}>
                {data.quizAverage}%
              </p>
              <p className="text-sm text-gray-500 pb-1">
                {data.quizAverage >= 80 ? '🌟 Excellent!' : data.quizAverage >= 60 ? '💪 Keep going!' : '📖 Keep practicing!'}
              </p>
            </div>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${data.quizAverage}%`, background: quizColor }}
              />
            </div>
          </div>
        )}

        {/* Badges */}
        {data.badges.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-bold text-gray-900">Your Badges</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.badges.map((badge, i) => (
                <span key={i} className="px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 
                                          border border-yellow-200 rounded-full text-sm font-semibold text-yellow-800">
                  {badge}
                </span>
              ))}
            </div>
            {data.badges.length === 0 && (
              <p className="text-sm text-gray-400">Complete quizzes and keep your streak to earn badges!</p>
            )}
          </div>
        )}

        {/* Recent topics */}
        {data.recentTopics.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="font-bold text-gray-900">Recent Topics</span>
            </div>
            <div className="space-y-2">
              {data.recentTopics.map((t) => (
                <a
                  key={t.id}
                  href={`/results/${t.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors line-clamp-1 flex-1">
                    {t.text}
                  </span>
                  <span className="text-xs text-gray-400 ml-3 shrink-0">{t.date}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Encouragement if no activity */}
        {data.topicsAllTime === 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 text-center border border-indigo-100">
            <Zap className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Start Your Learning Journey!</h3>
            <p className="text-sm text-gray-600 mb-4">Search your first topic to begin tracking your progress.</p>
            <a
              href="/explore"
              className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Explore a Topic →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-5 pt-10 pb-16">
        <div className="h-7 w-40 bg-white/20 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-52 bg-white/15 rounded animate-pulse" />
      </div>
      <div className="px-4 -mt-10 space-y-4 max-w-lg mx-auto">
        {[80, 48, 64].map((h, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm animate-pulse" style={{ height: h }} />
        ))}
      </div>
    </div>
  );
}
