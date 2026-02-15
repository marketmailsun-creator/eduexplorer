'use client';
// ============================================================
// FILE: src/app/(auth)/forgot-password/page.tsx  — NEW FILE
// ============================================================
import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setSent(true);
      else setError('Something went wrong. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-8 py-10 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {sent ? <CheckCircle2 className="h-8 w-8 text-white" /> : <Mail className="h-8 w-8 text-white" />}
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              {sent ? 'Check your email' : 'Forgot password?'}
            </h1>
            <p className="text-indigo-200 text-sm mt-2">
              {sent ? 'We sent a reset link to your email' : "No worries, we'll send you a reset link"}
            </p>
          </div>

          <div className="px-8 py-8">
            {sent ? (
              <>
                <p className="text-gray-600 text-sm leading-relaxed mb-2">We sent a password reset link to:</p>
                <p className="text-indigo-700 font-semibold bg-indigo-50 px-4 py-2 rounded-lg mb-4 break-all">{email}</p>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Click the link in the email to reset your password. The link expires in <strong>1 hour</strong>. Don't forget to check your spam folder.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="w-full py-3 border-2 border-indigo-200 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition-colors"
                >
                  Try a different email
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-gray-500 text-sm">Enter your email and we'll send you a link to reset your password.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 disabled:opacity-50"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>

          <div className="px-8 pb-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
