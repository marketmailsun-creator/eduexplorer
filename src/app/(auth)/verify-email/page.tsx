'use client';
// ============================================================
// FILE: src/app/(auth)/verify-email/page.tsx  — NEW FILE
// Shown immediately after signup.
// User can also request a fresh link here.
// ============================================================

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResent(true);
        setTimeout(() => setResent(false), 5000);
      } else {
        setError('Failed to resend. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-8 py-10 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Check your email</h1>
            <p className="text-indigo-200 text-sm mt-2">We've sent you a verification link</p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            <p className="text-gray-600 text-sm leading-relaxed mb-2">
              We sent a verification email to:
            </p>
            {email && (
              <p className="text-indigo-700 font-semibold text-base mb-4 bg-indigo-50 px-4 py-2 rounded-lg break-all">
                {email}
              </p>
            )}
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Click the link in the email to verify your account and start learning. The link expires in <strong>24 hours</strong>.
            </p>

            {/* Tips */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-xs font-semibold mb-2">📬 Didn't receive it?</p>
              <ul className="text-amber-700 text-xs space-y-1 list-none">
                <li>• Check your spam or junk folder</li>
                <li>• Make sure the email address is correct</li>
                <li>• Allow a minute for delivery</li>
              </ul>
            </div>

            {/* Resend button */}
            {resent ? (
              <div className="flex items-center gap-2 justify-center text-green-600 text-sm font-medium py-3">
                <CheckCircle2 className="h-5 w-5" />
                New verification link sent!
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending || !email}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                           border-2 border-indigo-200 text-indigo-700 font-semibold text-sm
                           hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Resend verification email
                  </>
                )}
              </button>
            )}

            {error && (
              <p className="text-red-500 text-sm text-center mt-3">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
