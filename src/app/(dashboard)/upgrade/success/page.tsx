'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Crown, Check, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

function UpgradeSuccessContent() {
  const { update } = useSession();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/explore';
  const [refreshed, setRefreshed] = useState(false);

  useEffect(() => {
    // Refresh JWT immediately so plan=pro is reflected in session without re-login
    update().then(() => setRefreshed(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const benefits = [
    'Unlimited AI lessons daily',
    'Unlimited quizzes & flashcards',
    'AI-enhanced audio narration',
    'Visual diagrams & presentations',
    'Priority AI processing',
    'Ad-free experience',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">

        {/* Crown with animated glow */}
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 blur-lg opacity-60 animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-xl">
            <Crown className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full text-xs font-semibold text-purple-700">
          <Sparkles className="h-3.5 w-3.5" />
          Payment Successful
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-3 mb-2">
          You&apos;re Pro! 🎉
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Welcome to EduExplorer Pro. Unlimited learning starts now.
        </p>

        {/* Benefits */}
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-100 rounded-2xl p-5 mb-8 text-left space-y-2.5">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-3">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-green-600" />
              </div>
              <span className="text-sm text-gray-700 font-medium">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link
            href={returnTo}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-md shadow-purple-200"
          >
            <Zap className="h-4 w-4" />
            Start Learning Now
          </Link>
          <Link
            href="/profile"
            className="block w-full py-3 px-6 bg-gray-50 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-all text-sm"
          >
            View My Profile & Subscription
          </Link>
        </div>

        {refreshed && (
          <p className="text-xs text-green-600 mt-4 font-medium">
            ✓ Pro features activated
          </p>
        )}
      </div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense>
      <UpgradeSuccessContent />
    </Suspense>
  );
}
