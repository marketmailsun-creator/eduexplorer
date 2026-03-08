'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  BookOpen,
  Smartphone,
  ArrowLeft,
  RefreshCw,
  Check,
  Zap,
  Crown,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { firebaseAuth } from '@/lib/firebase/firebase-client';
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';

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

// ── Normalize phone to E.164 ───────────────────────────────────────────────

function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith('91')) return `+${digits}`;
  return null;
}

// ── Plan features ──────────────────────────────────────────────────────────

const planFeatures = {
  free: ['5 topics per day', '1 audio per topic', 'Basic quizzes', 'Flashcards'],
  pro: ['Unlimited topics', '5 audios per topic', 'Advanced quizzes', 'Priority AI', 'Study groups', 'Ad-free'],
};

// ── Main page ──────────────────────────────────────────────────────────────

function PhoneSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/explore';

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [plan, setPlan] = useState<PlanType>('free');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [phoneAlreadyRegistered, setPhoneAlreadyRegistered] = useState(false);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      recaptchaRef.current?.clear();
    };
  }, []);

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
    setPhoneAlreadyRegistered(false);
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }

    const e164 = toE164(phone);
    if (!e164) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      // Pre-check if email is already registered before sending OTP
      const emailCheckRes = await fetch('/api/auth/check-email-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const emailCheckData = await emailCheckRes.json();
      if (emailCheckData.exists) {
        setError('email_taken');
        setLoading(false);
        return;
      }

      // Pre-check if phone is already registered before sending OTP
      const phoneCheckRes = await fetch('/api/auth/check-phone-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const phoneCheckData = await phoneCheckRes.json();
      if (phoneCheckData.exists) {
        setPhoneAlreadyRegistered(true);
        setLoading(false);
        return;
      }

      // Clear previous reCAPTCHA if exists
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }

      // Initialize invisible reCAPTCHA
      recaptchaRef.current = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
        size: 'invisible',
      });

      const result = await signInWithPhoneNumber(firebaseAuth, e164, recaptchaRef.current);
      confirmationRef.current = result;
      setStep(2);
      setOtp('');
      setCountdown(60);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      const msg = err instanceof Error ? err.message : String(err);

      if (code === 'auth/too-many-requests' || msg.includes('too-many-requests')) {
        setError('Too many OTP requests. Please wait a few minutes and try again.');
      } else if (code === 'auth/invalid-phone-number' || msg.includes('invalid-phone-number')) {
        setError('Invalid phone number. Please enter a valid Indian mobile number.');
      } else if (code === 'auth/quota-exceeded' || msg.includes('quota-exceeded')) {
        setError('SMS quota exceeded. Please try again later.');
      } else if (
        code === 'auth/captcha-check-failed' ||
        code === 'auth/app-not-authorized' ||
        code === 'auth/missing-client-identifier'
      ) {
        setError(
          isLocalhost
            ? 'Localhost blocked by reCAPTCHA. Add "localhost" to Firebase Console → Authentication → Authorized Domains, then use a test phone number (+91 9999999999, OTP: 123456).'
            : 'reCAPTCHA verification failed. Please refresh the page and try again.'
        );
      } else {
        setError(`Failed to send OTP. Please try again. (${code || 'unknown error'})`);
      }
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, email, phone, dob, isLocalhost]);

  const handleVerifyOtp = useCallback(async () => {
    setError('');
    if (otp.replace(/\s/g, '').length < 6) {
      setError('Please enter all 6 digits of your OTP.');
      return;
    }
    if (!confirmationRef.current) {
      setError('Session expired. Please request a new OTP.');
      return;
    }

    setLoading(true);
    try {
      const credential = await confirmationRef.current.confirm(otp.replace(/\s/g, ''));
      const idToken = await credential.user.getIdToken();

      const result = await signIn('firebase-phone', {
        idToken,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        dob,
        plan,
        redirect: false,
      });

      if (result?.error === 'email_taken') {
        setError('email_taken');
      } else if (result?.error === 'age_restriction') {
        setError('You must be at least 13 years old to register.');
      } else if (result?.error) {
        setError('Signup failed. Please try again.');
      } else {
        // Use callbackUrl if it starts with / (internal only, prevents open redirect)
        router.push(callbackUrl.startsWith('/') ? callbackUrl : '/explore');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('invalid-verification-code')) {
        setError('Incorrect OTP. Please check the code and try again.');
      } else if (msg.includes('code-expired')) {
        setError('OTP has expired. Please request a new code.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [otp, name, email, dob, plan, router]);

  const normalizedDisplay = phone.replace(/(\d{5})(\d{5})/, '$1 $2');

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side — Brand */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12 text-white">
        <div className="mb-8">
          <div className="p-3 bg-white/20 rounded-xl w-fit mb-6">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-2">Join EduExplorer</h1>
          <p className="text-blue-100 text-base leading-relaxed">
            Free forever. No credit card. No DLT spam.
          </p>
        </div>

        {/* Simulated search preview */}
        <div className="bg-white/10 rounded-2xl p-4 mb-6 border border-white/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-xs text-green-200 font-medium">Live example</span>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-2 text-sm font-medium mb-3">
            🔍 &ldquo;How does gravity work?&rdquo;
          </div>
          <div className="space-y-1.5">
            {['📄 AI Article generated', '🎯 5 quiz questions ready', '🃏 10 flashcards created', '🎙️ 3-min audio summary'].map(item => (
              <div key={item} className="flex items-center gap-2 text-xs text-blue-100">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"></div>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* What's included */}
        <div className="space-y-2">
          <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider mb-2">Free plan includes</p>
          {['5 AI lessons daily', 'Quizzes & Flashcards', 'Learning streak tracking', 'Study groups', 'Global leaderboard'].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="h-2.5 w-2.5" />
              </div>
              <span className="text-blue-100">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side — Form */}
      <div className="flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        {/* Invisible reCAPTCHA container */}
        <div id="recaptcha-container" />

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
                  via SMS
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {error === 'email_taken' && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">Email already registered</p>
                  <p className="text-amber-700 mt-0.5">
                    This email is already linked to an account.{' '}
                    <Link href="/phone-login" className="font-bold underline hover:text-amber-900">
                      Sign in with mobile
                    </Link>
                  </p>
                </div>
              </div>
            )}
            {phoneAlreadyRegistered && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">Number already registered</p>
                  <p className="text-amber-700 mt-0.5">
                    This mobile number already has an account.{' '}
                    <Link href="/phone-login" className="font-bold underline hover:text-amber-900">
                      Sign in with OTP
                    </Link>
                  </p>
                </div>
              </div>
            )}
            {error && error !== 'email_taken' && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* ── Step 1: Signup form ── */}
            {step === 1 && (
              <div className="space-y-4">
                {isLocalhost && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                    <strong>Dev mode:</strong> Use test number <code>9999999999</code> with OTP <code>123456</code>{' '}
                    (Firebase Console → Authentication → Phone → Test numbers)
                  </div>
                )}
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
                          <span className="text-xs text-purple-600 font-semibold">499/mo</span>
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

export default function PhoneSignupPage() {
  return (
    <Suspense>
      <PhoneSignupContent />
    </Suspense>
  );
}
