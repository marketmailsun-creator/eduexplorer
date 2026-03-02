'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  BookOpen,
  MessageCircle,
  Smartphone,
  ArrowLeft,
  RefreshCw,
  Check,
  Zap,
  Crown,
} from 'lucide-react';
import Link from 'next/link';

type Channel = 'whatsapp' | 'sms';
type Step = 1 | 2;
type PlanType = 'free' | 'pro';

// ── OTP input component ────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const arr = value.padEnd(6, ' ').split('');
    arr[index] = digit || ' ';
    const next = arr.join('').trimEnd();
    onChange(next);
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const arr = value.padEnd(6, ' ').split('');
      if (arr[index]?.trim()) {
        arr[index] = ' ';
        onChange(arr.join('').trimEnd());
      } else if (index > 0) {
        inputs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const nextFocus = Math.min(pasted.length, 5);
    inputs.current[nextFocus]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={(value[i] ?? '').trim()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:opacity-50 bg-white"
        />
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

const planFeatures = {
  free: ['5 topics per day', '1 audio per topic', 'Basic quizzes', 'Flashcards'],
  pro: ['Unlimited topics', '5 audios per topic', 'Advanced quizzes', 'Priority AI', 'Study groups', 'Ad-free'],
};

export default function PhoneSignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [plan, setPlan] = useState<PlanType>('free');
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  // Max DOB: must be 13+ years old
  const maxDob = new Date(new Date().setFullYear(new Date().getFullYear() - 13))
    .toISOString()
    .split('T')[0];

  const validateStep1 = (): string | null => {
    if (!name.trim()) return 'Full name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return 'Please enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(phone)) return 'Enter a valid 10-digit Indian mobile number.';
    if (!dob) return 'Date of birth is required.';
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    if (age < 13) return 'You must be at least 13 years old to sign up.';
    return null;
  };

  const handleSendOtp = useCallback(async () => {
    setError('');
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}`, channel }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP. Please try again.');
        return;
      }

      setStep(2);
      setOtp('');
      setCountdown(60);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, email, phone, dob, channel]);

  const handleVerifyOtp = useCallback(async () => {
    setError('');
    if (otp.replace(/\s/g, '').length < 6) {
      setError('Please enter all 6 digits of your OTP.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('phone-otp', {
        phone: `+91${phone}`,
        code: otp.replace(/\s/g, ''),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        dob,
        plan,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === 'EmailAlreadyExists'
            ? 'This email is already registered. Please use a different email or sign in.'
            : 'Invalid or expired OTP. Please try again or request a new code.'
        );
      } else {
        router.push('/explore');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [otp, phone, name, email, dob, plan, router]);

  const normalizedDisplay = phone.replace(/(\d{5})(\d{5})/, '$1 $2');

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side — Brand */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12 text-white">
        <div className="mb-8">
          <div className="p-3 bg-white/20 rounded-xl w-fit mb-6">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Join EduExplorer</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Sign up with your mobile number. Verify instantly via WhatsApp or SMS.
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

      {/* Right side — Form */}
      <div className="flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <Card className="w-full max-w-md shadow-xl my-4">
          <CardHeader className="text-center space-y-1">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>

            {step === 1 ? (
              <>
                <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                <CardDescription>Sign up with your mobile number</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl font-bold">Enter OTP</CardTitle>
                <CardDescription>
                  Code sent to{' '}
                  <span className="font-semibold text-gray-800">+91 {normalizedDisplay}</span>{' '}
                  via {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* ── Step 1: Signup form ── */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Plan selector */}
                <div className="grid grid-cols-2 gap-3">
                  {(['free', 'pro'] as PlanType[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlan(p)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        plan === p
                          ? p === 'pro'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {p === 'pro' ? (
                          <Crown className="h-4 w-4 text-purple-600" />
                        ) : (
                          <Zap className="h-4 w-4 text-blue-600" />
                        )}
                        <span className="font-bold text-sm capitalize">{p}</span>
                        {p === 'pro' && (
                          <span className="text-xs text-purple-600 font-semibold">₹999/mo</span>
                        )}
                        {p === 'free' && (
                          <span className="text-xs text-blue-600 font-semibold">Free</span>
                        )}
                      </div>
                      <ul className="space-y-0.5">
                        {planFeatures[p].slice(0, 3).map((f) => (
                          <li key={f} className="flex items-center gap-1 text-xs text-gray-600">
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>

                {/* Full name */}
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                {/* Phone number */}
                <div>
                  <label className="block text-sm font-medium mb-2">Mobile Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-600 text-sm font-medium select-none">
                      🇮🇳 +91
                    </span>
                    <Input
                      type="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      disabled={loading}
                      className="rounded-l-none h-11 text-base tracking-wider"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">10-digit Indian mobile number</p>
                </div>

                {/* Date of birth */}
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    disabled={loading}
                    max={maxDob}
                    className="h-11"
                  />
                  <p className="text-xs text-gray-500 mt-1">You must be 13 or older</p>
                </div>

                {/* Channel toggle */}
                <div>
                  <label className="block text-sm font-medium mb-2">Send OTP via</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setChannel('whatsapp')}
                      className={`flex items-center justify-center gap-2 h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                        channel === 'whatsapp'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel('sms')}
                      className={`flex items-center justify-center gap-2 h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                        channel === 'sms'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                      SMS
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className={`w-full h-11 text-base ${
                    plan === 'pro'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  }`}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Sending OTP...</>
                  ) : (
                    `Send OTP & Create ${plan === 'pro' ? 'Pro' : 'Free'} Account`
                  )}
                </Button>

                <div className="space-y-2 text-center text-sm text-gray-600">
                  <div>
                    <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                      Sign up with email instead
                    </Link>
                  </div>
                  <div>
                    Already have an account?{' '}
                    <Link href="/phone-login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: OTP entry ── */}
            {step === 2 && (
              <div className="space-y-5">
                <OtpInput value={otp} onChange={setOtp} disabled={loading} />

                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.replace(/\s/g, '').length < 6}
                  className={`w-full h-11 text-base ${
                    plan === 'pro'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  }`}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Creating account...</>
                  ) : (
                    'Verify & Create Account'
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(''); setError(''); }}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Go back
                  </button>

                  {countdown > 0 ? (
                    <span className="text-gray-400">Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
