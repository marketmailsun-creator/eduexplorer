'use client';
// ============================================================
// FILE: src/app/(auth)/signup/page.tsx  — REPLACE EXISTING
// Change: After successful signup, redirect to /verify-email?email=xxx
// instead of auto-signing in (since email must be verified first).
// Google signup still works instantly (no email verification needed).
// ============================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, Zap, Crown, BookOpen, Smartphone, CheckCircle, Phone, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

type PlanType = 'free' | 'pro';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('free');

  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [phoneStep, setPhoneStep] = useState<'idle' | 'enter_otp'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const handleSendOtp = async () => {
    setOtpError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
      setOtpError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${digits}`, channel: 'sms' }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.error || 'Failed to send OTP'); return; }
      setPhoneStep('enter_otp');
      setResendCountdown(60);
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    if (otpCode.length !== 6) { setOtpError('Enter the 6-digit code'); return; }
    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone.replace(/\D/g, '')}`, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.error || 'Invalid OTP'); return; }
      setPhoneVerified(true);
      setPhoneStep('idle');
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

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
      const phoneDigits = phone.replace(/\D/g, '');
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password, name, dob, plan: selectedPlan,
          // Include phone only if it was OTP-verified
          ...(phoneVerified && phoneDigits.length === 10 ? { phone: `+91${phoneDigits}` } : {}),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const message = data.error || 'Failed to sign up';
        if (message.includes('User already exists') || message.includes('already exists')) {
          setError('email_taken');
        } else if (message.includes('Phone number already in use')) {
          setError('phone_taken');
        } else {
          setError(message);
        }
        setLoading(false);
        return;
      }

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

            {/* Mobile OTP Signup */}
            <Button type="button" variant="outline" className="w-full h-11 border-gray-300" asChild>
              <Link href="/phone-signup">
                <Smartphone className="mr-2 h-5 w-5 text-green-600" />
                Sign up with Mobile (OTP)
              </Link>
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

              {/* Optional phone number with OTP verification */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mobile Number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                {phoneVerified ? (
                  <div className="flex items-center gap-2 h-11 px-3 bg-green-50 border border-green-200 rounded-md">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-green-700 font-medium">+91 {phone} — Verified</span>
                    <button
                      type="button"
                      onClick={() => { setPhoneVerified(false); setPhone(''); setPhoneStep('idle'); setOtpCode(''); }}
                      className="ml-auto text-xs text-gray-400 hover:text-gray-600"
                    >
                      Change
                    </button>
                  </div>
                ) : phoneStep === 'enter_otp' ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">OTP sent to +91 {phone}</p>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center tracking-widest font-mono"
                        maxLength={6}
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={sendingOtp || otpCode.length !== 6}
                        className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
                      >
                        {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <button type="button" onClick={() => { setPhoneStep('idle'); setOtpCode(''); }} className="text-gray-400 hover:text-gray-600">
                        ← Change number
                      </button>
                      {resendCountdown > 0 ? (
                        <span className="text-gray-400">Resend in {resendCountdown}s</span>
                      ) : (
                        <button type="button" onClick={handleSendOtp} className="text-indigo-600 hover:text-indigo-700 font-medium">
                          Resend OTP
                        </button>
                      )}
                    </div>
                    {otpError && <p className="text-xs text-red-500">{otpError}</p>}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 bg-gray-100 border border-gray-200 rounded-md text-sm font-medium text-gray-600 whitespace-nowrap">
                        🇮🇳 +91
                      </span>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        placeholder="10-digit number"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        disabled={loading || googleLoading}
                        className="flex-1 h-11"
                        maxLength={10}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || phone.replace(/\D/g, '').length !== 10 || loading}
                        className="whitespace-nowrap"
                      >
                        {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}
                      </Button>
                    </div>
                    {otpError && <p className="text-xs text-red-500">{otpError}</p>}
                    <p className="text-xs text-gray-400">Add for faster login & account recovery</p>
                  </div>
                )}
              </div>

              {error === 'email_taken' && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Email already registered</p>
                    <p className="text-amber-700 mt-0.5">
                      This email is already linked to an account.{' '}
                      <Link href="/login" className="font-bold underline hover:text-amber-900">
                        Log in instead →
                      </Link>
                    </p>
                  </div>
                </div>
              )}
              {error === 'phone_taken' && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Mobile number already registered</p>
                    <p className="text-amber-700 mt-0.5">
                      This mobile number is already linked to an account.{' '}
                      <Link href="/phone-login" className="font-bold underline hover:text-amber-900">
                        Log in instead →
                      </Link>
                    </p>
                  </div>
                </div>
              )}
              {error && error !== 'email_taken' && error !== 'phone_taken' && (
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
