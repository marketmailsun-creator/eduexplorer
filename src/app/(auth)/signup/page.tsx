'use client';
// ============================================================
// FILE: src/app/(auth)/signup/page.tsx  — REPLACE EXISTING
// Change: After successful signup, redirect to /verify-email?email=xxx
// instead of auto-signing in (since email must be verified first).
// Google signup still works instantly (no email verification needed).
// ============================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, X, Zap, Crown, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

type PlanType = 'free' | 'pro';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('free');

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');
    try {
      localStorage.setItem('selectedPlan', selectedPlan);
      await signIn('google', { callbackUrl: '/explore', redirect: true });
    } catch {
      setError('Failed to sign in with Google');
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const dob = formData.get('dob') as string;

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, dob, plan: selectedPlan }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to sign up');

      // ✅ Redirect to verify-email page instead of auto-signing in
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  const planFeatures = {
    free: ['5 topics per day', '1 audio per topic', 'Basic quizzes', 'Flashcards'],
    pro: ['Unlimited topics', '5 audios per topic', 'Advanced quizzes', 'Priority AI', 'Study groups', 'Ad-free'],
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12 text-white">
        <div className="mb-8">
          <div className="p-3 bg-white/20 rounded-xl w-fit mb-6">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Join EduExplorer</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Turn any topic into a full AI-powered lesson in seconds.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/20">
          {[['1M+', 'Topics'], ['50K+', 'Learners'], ['4.9★', 'Rating']].map(([val, label]) => (
            <div key={label}>
              <div className="text-3xl font-bold">{val}</div>
              <div className="text-blue-100 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <Card className="w-full max-w-md shadow-xl my-4">
          <CardHeader className="text-center space-y-1">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>Start your learning journey today</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* Plan selector */}
            <div className="grid grid-cols-2 gap-3">
              {(['free', 'pro'] as PlanType[]).map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedPlan === plan
                      ? plan === 'pro'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {plan === 'pro' ? <Crown className="h-4 w-4 text-purple-600" /> : <Zap className="h-4 w-4 text-blue-600" />}
                    <span className="font-bold text-sm capitalize">{plan}</span>
                    {plan === 'pro' && <span className="text-xs text-purple-600 font-semibold">₹999/mo</span>}
                    {plan === 'free' && <span className="text-xs text-blue-600 font-semibold">Free</span>}
                  </div>
                  <ul className="space-y-0.5">
                    {planFeatures[plan].slice(0, 3).map((f) => (
                      <li key={f} className="flex items-center gap-1 text-xs text-gray-600">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            {/* Google button */}
            <Button type="button" variant="outline" className="w-full h-11 border-gray-300" onClick={handleGoogleSignIn} disabled={googleLoading || loading}>
              {googleLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Connecting...</>
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
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input name="name" type="text" placeholder="John Doe" required disabled={loading || googleLoading} className="h-11" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input name="email" type="email" placeholder="you@example.com" required disabled={loading || googleLoading} className="h-11" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input name="password" type="password" placeholder="••••••••" minLength={6} required disabled={loading || googleLoading} className="h-11" />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth</label>
                <Input
                  name="dob"
                  type="date"
                  required
                  disabled={loading || googleLoading}
                  className="h-11"
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">You must be 13 or older</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || googleLoading}
                className={`w-full h-11 text-base ${selectedPlan === 'pro'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Creating account...</> : `Create ${selectedPlan === 'pro' ? 'Pro' : 'Free'} Account`}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
