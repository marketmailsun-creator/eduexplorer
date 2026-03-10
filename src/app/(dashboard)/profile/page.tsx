'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Flame, Trophy, Crown, Calendar, Clock, Camera, Mail,
  BookOpen, Brain, ChevronRight, Loader2, Phone, CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { NotificationPreferences } from '@/components/features/NotificationPreferences';
import { PushNotificationSetup } from '@/components/pwa/PushNotificationSetup';
import { DeleteAccountSection } from '@/components/features/DeleteAccountSection';
import { ChangePasswordSection } from '@/components/features/ChangePasswordSection';
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  const [imgError, setImgError] = useState(false);
  const [error, setError] = useState('');

  // Reset image error whenever preview changes (e.g. after upload)
  useEffect(() => {
    setImgError(false);
  }, [preview]);

  const initials = name
    ? name.trim().split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-teal-500'];
  const color = name ? (colors[name.charCodeAt(0) % colors.length] || 'bg-indigo-500') : 'bg-indigo-500';

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
                        shadow-xl ${!(preview && !imgError) ? color : ''} flex items-center justify-center`}>
        {preview && !imgError
          ? <img
              src={preview}
              alt={name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
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

// ── Phone section component ───────────────────────────────────
function PhoneSection({
  phone,
  phoneVerified,
  onPhoneUpdated,
}: {
  phone: string | null;
  phoneVerified: string | null;
  onPhoneUpdated: (phone: string) => void;
}) {
  type PhoneStep = 'idle' | 'enter_phone' | 'enter_otp';
  const [step, setStep] = useState<PhoneStep>('idle');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const handleSendOtp = async () => {
    setPhoneError('');
    const digits = phoneInput.replace(/\D/g, '');
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
      setPhoneError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${digits}`, channel: 'sms' }),
      });
      const data = await res.json();
      if (!res.ok) { setPhoneError(data.error || 'Failed to send OTP'); return; }
      setStep('enter_otp');
      setResendCountdown(60);
    } catch {
      setPhoneError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    setOtpError('');
    if (otpInput.length !== 6) { setOtpError('Enter the 6-digit code'); return; }
    setVerifying(true);
    try {
      const res = await fetch('/api/user/phone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phoneInput.replace(/\D/g, '')}`, code: otpInput }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.error || 'Verification failed'); return; }
      onPhoneUpdated(data.phone);
      setStep('idle');
      setPhoneInput('');
      setOtpInput('');
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    setStep('idle');
    setPhoneInput('');
    setOtpInput('');
    setPhoneError('');
    setOtpError('');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Phone className="h-4 w-4 text-indigo-600" />
        </div>
        <span className="font-bold text-gray-900 text-sm">Phone Number</span>
      </div>

      {step === 'idle' && (
        <div className="flex items-center justify-between">
          {phone ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">{phone}</span>
              {phoneVerified && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">No phone number added</span>
          )}
          <button
            onClick={() => { setStep('enter_phone'); setPhoneInput(phone ? phone.replace('+91', '') : ''); }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            {phone ? 'Change' : 'Add Phone'}
          </button>
        </div>
      )}

      {step === 'enter_phone' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Mobile Number</label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 whitespace-nowrap">
                🇮🇳 +91
              </span>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit number"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                className="flex-1"
              />
            </div>
            {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSendOtp}
              disabled={sending || phoneInput.replace(/\D/g, '').length !== 10}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 flex-1"
            >
              {sending ? <><Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Sending...</> : 'Send OTP'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
          </div>
        </div>
      )}

      {step === 'enter_otp' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">OTP sent to <strong>+91 {phoneInput}</strong></p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Enter 6-digit OTP</label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={otpInput}
              onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-lg tracking-widest font-mono"
              maxLength={6}
            />
            {otpError && <p className="text-xs text-red-500 mt-1">{otpError}</p>}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleVerify}
              disabled={verifying || otpInput.length !== 6}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 flex-1"
            >
              {verifying ? <><Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Verifying...</> : 'Verify'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
          </div>
          <div className="flex items-center justify-between text-xs">
            <button onClick={() => { setStep('enter_phone'); setOtpInput(''); }} className="text-gray-400 hover:text-gray-600">
              ← Change number
            </button>
            {resendCountdown > 0 ? (
              <span className="text-gray-400">Resend in {resendCountdown}s</span>
            ) : (
              <button onClick={handleSendOtp} className="text-indigo-600 hover:text-indigo-700 font-medium">
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}
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
    await updateSession();
  };

  const handlePhoneUpdated = (newPhone: string) => {
    setProfileData((prev: any) => ({ ...prev, phone: newPhone, phoneVerified: new Date().toISOString() }));
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

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  const totalTopics = progress?.topicsAllTime ?? user?._count?.queries ?? 0;
  const estimatedHours = Math.round((totalTopics * 8) / 60);

  const streak  = progress?.streak ?? 0;
  const badges: string[] = progress?.badges ?? [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ── Hero header ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500
                      px-5 pt-10 pb-20 text-white relative overflow-hidden">
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
            <div className="flex-1 min-w-0 pb-2">
              <h2 className="text-xl font-extrabold text-gray-900 leading-tight truncate">
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

          {/* Plan badge + subscription */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl
                           bg-gradient-to-r from-gray-50 to-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <Crown className={`h-5 w-5 flex-shrink-0 ${user?.plan === 'pro' ? 'text-yellow-500' : 'text-gray-400'}`} />
              <div>
                <span className="font-semibold text-sm text-gray-800 block">
                  {user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </span>
                {user?.subscription && (
                  <span className="text-xs text-gray-400 block mt-0.5">
                    {user.subscription.plan === 'yearly' ? 'Yearly' : 'Monthly'} · Renews{' '}
                    {new Date(user.subscription.endDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
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

        {/* ── Phone Number ─────────────────────────────────────── */}
        <PhoneSection
          phone={user?.phone ?? null}
          phoneVerified={user?.phoneVerified ?? null}
          onPhoneUpdated={handlePhoneUpdated}
        />

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

        {/* ── Activity Heatmap ─────────────────────────────────── */}
        <ActivityHeatmap />

        {/* ── Push Notifications ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Push Notifications</h3>
              <p className="text-xs text-gray-500 mt-0.5">Get study reminders and quiz alerts on this device</p>
            </div>
            <PushNotificationSetup />
          </div>
        </div>

        {/* ── Notification Preferences ─────────────────────────── */}
        <NotificationPreferences />
        <DeleteAccountSection hasPassword={user?.hasPassword ?? false} />
        <ChangePasswordSection hasPassword={user?.hasPassword ?? false} />

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
