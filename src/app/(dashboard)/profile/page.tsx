'use client';
// ============================================================
// FILE: src/app/(dashboard)/profile/page.tsx  — REPLACE EXISTING
// Enhanced profile page with:
//   • Avatar upload / change
//   • Member since + learning time estimate
//   • Streak card (visible without going to Progress)
//   • Badges earned inline
//   • Notification Preferences panel
//   • Plan badge + upgrade CTA
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Flame, Trophy, Crown, Calendar, Clock, Camera, Mail,
  BookOpen, Brain, ChevronRight, Loader2, Upload,
} from 'lucide-react';
import Link from 'next/link';
import { NotificationPreferences } from '@/components/features/NotificationPreferences';

// ── Avatar upload component ───────────────────────────────────
function AvatarUpload({
  name,
  image,
  onUploaded,
}: {
  name: string;
  image: string | null;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(image);
  const [error, setError] = useState('');

  const initials = name
    ? name.trim().split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-teal-500'];
  const color = colors[name.charCodeAt(0) % colors.length] || 'bg-indigo-500';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2 MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }

    setError('');
    // Local preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/user/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        onUploaded(data.url);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Upload failed — please try again');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-4 ring-white
                        shadow-xl ${!preview ? color : ''} flex items-center justify-center`}>
        {preview
          ? <img src={preview} alt={name} className="w-full h-full object-cover" />
          : <span className="text-3xl font-bold text-white">{initials}</span>
        }
        {uploading && (
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Camera button */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-1 right-1 w-8 h-8 bg-indigo-600 rounded-full
                   flex items-center justify-center shadow-lg border-2 border-white
                   hover:bg-indigo-700 transition-colors"
      >
        <Camera className="h-4 w-4 text-white" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {error && (
        <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-red-500 whitespace-nowrap">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────
function StatPill({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className={`flex-1 flex flex-col items-center py-4 px-3 rounded-2xl ${color}`}>
      <Icon className="h-5 w-5 mb-1 opacity-80" />
      <span className="text-2xl font-extrabold leading-none">{value}</span>
      <span className="text-xs mt-0.5 opacity-75 font-medium">{label}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profileData, setProfileData] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/user/profile').then(r => r.ok ? r.json() : null),
      fetch('/api/progress/me').then(r => r.ok ? r.json() : null),
    ]).then(([profile, progress]) => {
      setProfileData(profile);
      setProgressData(progress);
      setCurrentImage(profile?.image ?? null);
    }).finally(() => setLoading(false));
  }, []);

  const handleAvatarUploaded = async (url: string) => {
    setCurrentImage(url);
    // Refresh session so header updates too
    await updateSession();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const user = profileData;
  const progress = progressData;

  // Member since
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  // Rough learning time estimate (avg 8 min per topic)
  const totalTopics = progress?.topicsAllTime ?? user?._count?.queries ?? 0;
  const estimatedHours = Math.round((totalTopics * 8) / 60);

  const streak  = progress?.streak ?? 0;
  const badges: string[] = progress?.badges ?? [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ── Hero header ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500
                      px-5 pt-10 pb-20 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute top-20 -left-6 w-24 h-24 rounded-full bg-white" />
        </div>

        <h1 className="text-xl font-extrabold tracking-tight relative">My Profile</h1>
        <p className="text-indigo-200 text-sm mt-0.5 relative">Your learning identity</p>
      </div>

      {/* ── Profile card (overlaps header) ──────────────────── */}
      <div className="max-w-lg mx-auto px-4 -mt-14 space-y-4">

        <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-6 border border-gray-50">
          {/* Avatar + name row */}
          <div className="flex items-end gap-4 mb-5">
            <AvatarUpload
              name={user?.name ?? ''}
              image={currentImage}
              onUploaded={handleAvatarUploaded}
            />
            <div className="flex-1 pb-2">
              <h2 className="text-xl font-extrabold text-gray-900 leading-tight">
                {user?.name ?? 'Learner'}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-400 truncate max-w-[200px]">{user?.email}</span>
              </div>
              {memberSince && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-400">Member since {memberSince}</span>
                </div>
              )}
            </div>
          </div>

          {/* Plan badge */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl
                           bg-gradient-to-r from-gray-50 to-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <Crown className={`h-5 w-5 ${user?.plan === 'pro' ? 'text-yellow-500' : 'text-gray-400'}`} />
              <span className="font-semibold text-sm text-gray-800">
                {user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </span>
            </div>
            {user?.plan !== 'pro' && (
              <Link
                href="/upgrade"
                className="text-xs font-bold px-3 py-1.5 rounded-lg
                           bg-gradient-to-r from-indigo-600 to-purple-600
                           text-white hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Upgrade →
              </Link>
            )}
          </div>

          {/* ── Stat row ─────────────────────────────────────── */}
          <div className="flex gap-3">
            {/* Streak — most prominent */}
            <div className={`flex-1 flex flex-col items-center py-4 px-3 rounded-2xl
                             ${streak > 0
                               ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white'
                               : 'bg-gray-50 text-gray-600'}`}>
              <Flame className={`h-5 w-5 mb-1 ${streak > 0 ? 'text-white' : 'text-orange-400'}`} />
              <span className="text-2xl font-extrabold leading-none">{streak}</span>
              <span className="text-xs mt-0.5 opacity-80 font-medium">day streak</span>
            </div>

            <StatPill
              icon={BookOpen}
              value={totalTopics}
              label="topics"
              color="bg-blue-50 text-blue-700"
            />

            <StatPill
              icon={Clock}
              value={estimatedHours > 0 ? `${estimatedHours}h` : '<1h'}
              label="learned"
              color="bg-purple-50 text-purple-700"
            />

            <StatPill
              icon={Brain}
              value={`${progress?.quizAverage ?? 0}%`}
              label="quiz avg"
              color="bg-green-50 text-green-700"
            />
          </div>
        </div>

        {/* ── Badges ──────────────────────────────────────────── */}
        {badges.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="font-bold text-gray-900 text-sm">Badges Earned</span>
              <span className="ml-auto text-xs text-gray-400">{badges.length} total</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs
                             font-semibold bg-gradient-to-r from-yellow-50 to-amber-50
                             border border-yellow-200 text-yellow-800 shadow-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {badges.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
                <Trophy className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">No badges yet</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Keep a 3-day streak and score 80%+ on quizzes to earn badges
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Notification Preferences ─────────────────────────── */}
        <NotificationPreferences />

        {/* ── Quick links ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {[
            { href: '/progress', icon: '📊', label: 'View Full Progress' },
            { href: '/library',  icon: '📚', label: 'My Library' },
            { href: '/groups',   icon: '👥', label: 'Study Groups' },
            { href: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
          ].map(({ href, icon, label }, i, arr) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-4 hover:bg-gray-50
                          transition-colors group
                          ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <span className="text-lg">{icon}</span>
              <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {label}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>
          ))}
        </div>

        {/* ── Sign out ─────────────────────────────────────────── */}
        <div className="pb-2">
          <Link
            href="/api/auth/signout"
            className="block w-full text-center py-3 rounded-xl text-sm font-medium
                       text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            Sign out
          </Link>
        </div>

      </div>
    </div>
  );
}
