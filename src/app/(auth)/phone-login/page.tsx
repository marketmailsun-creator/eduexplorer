'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Smartphone, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { firebaseAuth } from '@/lib/firebase/firebase-client';
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';

const emailAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_EMAIL_AUTH === 'true';

type Step = 1 | 2;

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
          className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:opacity-50 bg-white"
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

// ── Main page ──────────────────────────────────────────────────────────────

export default function PhoneLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

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

  const normalizedDisplay = phone.replace(/(\d{5})(\d{5})/, '$1 $2');

  const handleSendOtp = useCallback(async () => {
    setError('');
    const e164 = toE164(phone);
    if (!e164) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      // Clear previous reCAPTCHA if exists
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }

      // Initialize invisible reCAPTCHA attached to the container div
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
  }, [phone, isLocalhost]);

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
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('No account found for this number. Please sign up first.');
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        router.push('/explore');
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
  }, [otp, router]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side — Brand */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 p-12 text-white">
        <div className="mb-8">
          <div className="p-3 bg-white/20 rounded-xl w-fit mb-6">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">EduExplorer</h1>
          <p className="text-green-100 text-lg leading-relaxed">
            Sign in instantly with your mobile number. No email, no passwords — just a quick OTP.
          </p>
        </div>
        <div className="bg-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-bold">1</span>
            </div>
            <div>
              <p className="font-semibold">Enter your mobile number</p>
              <p className="text-green-100 text-sm">Your 10-digit Indian mobile number</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-bold">2</span>
            </div>
            <div>
              <p className="font-semibold">Receive OTP via SMS</p>
              <p className="text-green-100 text-sm">6-digit code, valid for a few minutes</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-bold">3</span>
            </div>
            <div>
              <p className="font-semibold">Enter code &amp; start learning</p>
              <p className="text-green-100 text-sm">Instant access — no email verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="flex items-center justify-center p-6 bg-gray-50">
        {/* Invisible reCAPTCHA container */}
        <div id="recaptcha-container" />

        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>

            {step === 1 ? (
              <>
                <CardTitle className="text-2xl font-bold">Sign in with Mobile</CardTitle>
                <CardDescription>Enter your Indian mobile number to receive an OTP</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl font-bold">Enter OTP</CardTitle>
                <CardDescription>
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-gray-800">+91 {normalizedDisplay}</span>{' '}
                  via SMS
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* ── Step 1: Phone input ── */}
            {step === 1 && (
              <div className="space-y-4">
                {isLocalhost && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                    <strong>Dev mode:</strong> Use test number <code>9999999999</code> with OTP <code>123456</code>{' '}
                    (Firebase Console → Authentication → Phone → Test numbers)
                  </div>
                )}
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
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                      disabled={loading}
                      className="rounded-l-none h-11 text-base tracking-wider"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">10-digit Indian mobile number</p>
                </div>

                <Button
                  onClick={handleSendOtp}
                  disabled={loading || phone.length < 10}
                  className="w-full h-11 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Sending OTP...</>
                  ) : (
                    'Send OTP'
                  )}
                </Button>

                <div className="space-y-2 text-center text-sm text-gray-600">
                  {emailAuthEnabled && (
                    <div>
                      <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                        Use email instead
                      </Link>
                    </div>
                  )}
                  <div>
                    New user?{' '}
                    <Link href="/phone-signup" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                      Sign up with mobile
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
                  className="w-full h-11 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Verifying...</>
                  ) : (
                    'Verify & Sign In'
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(''); setError(''); }}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Change number
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
