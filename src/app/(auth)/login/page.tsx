'use client';
// ============================================================
// FILE: src/app/(auth)/login/page.tsx  — REPLACE EXISTING
// Changes:
//   - Shows "Email verified!" success banner when ?verified=true
//   - Shows error banner for invalid/expired token
//   - Blocks login for unverified email users and offers resend
// ============================================================

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Check, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified') === 'true';
  const tokenError = searchParams.get('error');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
      router.refresh();
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl: '/explore', redirect: true });
    } catch {
      setError('Failed to sign in with Google');
      setGoogleLoading(false);
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
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12 text-white">
        <div className="mb-8">
          <div className="p-3 bg-white/20 rounded-xl w-fit mb-6">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">EduExplorer</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            AI-powered learning. Any topic. Instant lessons, quizzes, flashcards and more.
          </p>
        </div>
        <div className="space-y-3">
          {['AI-generated articles & audio', 'Interactive quizzes & flashcards', 'Track your learning streak', 'Study groups & leaderboards'].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3" />
              </div>
              <span className="text-blue-100 text-sm">{f}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 pt-8 mt-8 border-t border-white/20">
          {[['1M+', 'Topics'], ['50K+', 'Learners'], ['4.9★', 'Rating']].map(([val, label]) => (
            <div key={label}>
              <div className="text-3xl font-bold">{val}</div>
              <div className="text-blue-100 text-sm">{label}</div>
            </div>
          ))}
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
            <CardDescription>Sign in to continue your learning journey</CardDescription>
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

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-300"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Connecting to Google...</>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input name="email" type="email" placeholder="you@example.com" required disabled={loading || googleLoading} className="h-11" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input name="password" type="password" placeholder="••••••••" required disabled={loading || googleLoading} className="h-11" />
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
                disabled={loading || googleLoading}
                className="w-full h-11 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Signing in...</> : 'Sign In'}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
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
