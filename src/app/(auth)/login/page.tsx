'use client';
// src/app/(auth)/login/page.tsx — REPLACE EXISTING

import { useState, Suspense, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, BookOpen, Smartphone, MessageCircle, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

type Step = 'phone' | 'otp';

function LoginContent() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();

  const [step, setStep]             = useState<Step>('phone');
  const [phone, setPhone]           = useState('');
  const [otp, setOtp]               = useState('');
  const [channel, setChannel]       = useState<'whatsapp' | 'sms'>('whatsapp');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.replace('/explore');
    }
  }, [status, session, router]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Step 1: Send OTP ────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Prepend +91 if user enters 10-digit Indian number
    const normalizedPhone = phone.startsWith('+')
      ? phone
      : phone.length === 10 ? `+91${phone}` : `+${phone}`;

    try {
      const res = await fetch('/api/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, purpose: 'login' }),
      });
      const data = await res.json();

      if (!res.ok) {
        // 404 = not registered → nudge to signup
        if (res.status === 404) {
          setError("No account found. Don't have one?");
        } else {
          setError(data.error || 'Failed to send OTP');
        }
        return;
      }

      setChannel(data.channel);
      setPhone(normalizedPhone);
      setStep('otp');
      setResendTimer(30);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, purpose: 'login' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      // Session cookie is set by the API — refresh session then navigate
      await update();
      router.replace('/explore');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Resend OTP ──────────────────────────────────────────────
  async function handleResend() {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'login' }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendTimer(30);
        setOtp('');
      } else {
        setError(data.error || 'Failed to resend');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 text-white">
        <div className="mb-8">
          <div className="p-3 bg-white/20 rounded-xl w-fit mb-6">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">EduExplorer</h1>
          <p className="text-indigo-100 text-lg leading-relaxed">
            AI-powered learning. Any topic. Instant lessons, quizzes, flashcards and more.
          </p>
        </div>
        <div className="space-y-3">
          {[
            'AI-generated articles & audio',
            'Interactive quizzes & flashcards',
            'Track your learning streak',
            'Study groups & leaderboards',
          ].map(f => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3" />
              </div>
              <span className="text-indigo-100 text-sm">{f}</span>
            </div>
          ))}
        </div>
        {/* WhatsApp badge */}
        <div className="mt-10 flex items-center gap-3 bg-white/10 rounded-xl p-4">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">Login via WhatsApp OTP</p>
            <p className="text-indigo-200 text-xs">No passwords. No Google. Just your phone.</p>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-3">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">EduExplorer</h1>
          </div>

          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">
                {step === 'phone' ? 'Welcome Back' : 'Enter OTP'}
              </CardTitle>
              <CardDescription>
                {step === 'phone'
                  ? 'Enter your mobile number to receive an OTP'
                  : `OTP sent via ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} to ${phone}`}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">

              {/* ── Step 1: Phone input ── */}
              {step === 'phone' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium">
                        +91
                      </span>
                      <Input
                        type="tel"
                        placeholder="9876543210"
                        value={phone.replace(/^\+91/, '')}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="h-11 rounded-l-none"
                        required
                        maxLength={10}
                        pattern="[0-9]{10}"
                        disabled={loading}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      You'll receive an OTP on WhatsApp
                    </p>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                      {error.includes("Don't have one") && (
                        <Link href="/signup" className="ml-1 text-indigo-600 font-semibold underline">
                          Sign up
                        </Link>
                      )}
                    </div>
                  )}

                  <Button type="submit" disabled={loading || phone.replace(/\D/g,'').length < 10}
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold">
                    {loading
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP...</>
                      : <><MessageCircle className="mr-2 h-4 w-4" />Send OTP via WhatsApp</>}
                  </Button>
                </form>
              )}

              {/* ── Step 2: OTP input ── */}
              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
                    <ArrowLeft className="h-4 w-4" /> Change number
                  </button>

                  {/* Channel badge */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                    ${channel === 'whatsapp' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                    <MessageCircle className="h-4 w-4" />
                    OTP sent via {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      6-digit OTP
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-12 text-center text-2xl tracking-[0.5em] font-bold"
                      maxLength={6}
                      required
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={loading || otp.length < 6}
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold">
                    {loading
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
                      : 'Verify & Login'}
                  </Button>

                  <div className="text-center text-sm text-gray-500">
                    Didn't receive OTP?{' '}
                    {resendTimer > 0 ? (
                      <span className="text-gray-400">Resend in {resendTimer}s</span>
                    ) : (
                      <button type="button" onClick={handleResend} disabled={loading}
                        className="text-indigo-600 font-semibold hover:text-indigo-800 disabled:opacity-50">
                        Resend OTP
                      </button>
                    )}
                  </div>
                </form>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">or</span>
                </div>
              </div>

              <p className="text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link href="/signup" className="text-indigo-600 font-semibold hover:text-indigo-800">
                  Sign up free
                </Link>
              </p>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
