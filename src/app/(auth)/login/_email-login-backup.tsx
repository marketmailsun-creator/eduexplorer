'use client';
// ============================================================
// FILE: src/app/(auth)/login/_email-login-backup.tsx
// BACKUP of login/page.tsx before phone-login became primary.
// The underscore prefix means Next.js ignores this file for routing.
// To restore: copy this content back to login/page.tsx
// ============================================================

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Check, CheckCircle2, AlertCircle, Mail, Smartphone } from 'lucide-react';
import Link from 'next/link';

const emailAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_EMAIL_AUTH === 'true';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified') === 'true';
  const tokenError = searchParams.get('error');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resentSuccess, setResentSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUnverifiedEmail('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Check if email is verified before attempting sign in
    try {
      const checkRes = await fetch('/api/auth/check-verified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const checkData = await checkRes.json();

      if (checkData.needsVerification) {
        setUnverifiedEmail(email);
        setLoading(false);
        return;
      }
    } catch {
      // If check fails, proceed normally
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push('/explore');
    }
  }

  async function handleResendVerification() {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      setResentSuccess(true);
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  }

  const tokenErrorMessage =
    tokenError === 'invalid_token' ? 'Verification link is invalid or has expired. Please request a new one.' :
    tokenError === 'missing_token' ? 'Missing verification token. Please use the link from your email.' :
    tokenError === 'verification_failed' ? 'Verification failed. Please try again.' :
    null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side — Brand */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-12 text-white">
        <div className="mb-8">
          <div className="p-3 bg-white/20 rounded-xl w-fit mb-6">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Welcome Back</h1>
          <p className="text-indigo-100 text-lg">
            Your learning streak is waiting. Pick up where you left off.
          </p>
        </div>

        {/* Topic categories showcase */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { emoji: '🔬', label: 'Science', color: 'bg-blue-500/30' },
            { emoji: '📐', label: 'Maths', color: 'bg-green-500/30' },
            { emoji: '💻', label: 'Tech', color: 'bg-purple-500/30' },
            { emoji: '📜', label: 'History', color: 'bg-amber-500/30' },
            { emoji: '🌍', label: 'Geography', color: 'bg-teal-500/30' },
            { emoji: '🎨', label: 'Arts', color: 'bg-pink-500/30' },
          ].map(({ emoji, label, color }) => (
            <div key={label} className={`${color} rounded-xl px-3 py-2.5 flex items-center gap-2 text-sm font-medium`}>
              <span>{emoji}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold mb-3">
            Your progress matters
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[['🔥', 'Daily Streak'], ['⚡', 'XP Points'], ['🏆', 'Leaderboard']].map(([icon, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs text-indigo-200">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="flex items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in with your mobile number
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* ── Success: Email verified ── */}
            {verified && (
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Email verified!</p>
                  <p className="text-green-700 mt-0.5">You can now sign in to your account.</p>
                </div>
              </div>
            )}

            {/* ── Error: Token invalid/expired ── */}
            {tokenErrorMessage && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>{tokenErrorMessage}</p>
              </div>
            )}

            {/* ── Unverified email warning ── */}
            {unverifiedEmail && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Mail className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-semibold text-sm">Email not verified</p>
                    <p className="text-amber-700 text-xs mt-1">
                      Please verify your email before signing in. Check your inbox for the verification link.
                    </p>
                  </div>
                </div>
                {resentSuccess ? (
                  <div className="flex items-center gap-2 text-green-700 text-xs font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    New verification email sent!
                  </div>
                ) : (
                  <button
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="text-xs text-amber-700 font-semibold underline underline-offset-2 hover:text-amber-900 disabled:opacity-50"
                  >
                    {resending ? 'Sending...' : 'Resend verification email'}
                  </button>
                )}
              </div>
            )}

            {/* Mobile OTP Sign In — primary CTA */}
            <Link href="/phone-login" className="block w-full">
              <Button
                type="button"
                className="w-full h-12 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
              >
                <Smartphone className="mr-2 h-5 w-5" />
                Continue with Mobile (OTP)
              </Button>
            </Link>

            {emailAuthEnabled && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">or sign in with email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input name="email" type="email" placeholder="you@example.com" required disabled={loading} className="h-11" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <Input name="password" type="password" placeholder="••••••••" required disabled={loading} className="h-11" />
                  </div>
                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Signing in...</> : 'Sign In'}
                  </Button>
                </form>
              </>
            )}

            <div className="text-center text-sm">
              <span className="text-gray-600">Don&apos;t have an account? </span>
              <Link
                href={emailAuthEnabled ? '/signup' : '/phone-signup'}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Sign up for free
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
