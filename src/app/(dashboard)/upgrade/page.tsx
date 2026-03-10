'use client';

import { useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Loader2, Zap, Info } from 'lucide-react';
import Link from 'next/link';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function UpgradePageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/explore';
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null);

  // Redirect pro users to profile — they're already subscribed
  useEffect(() => {
    if (session?.user?.plan === 'pro') {
      router.replace('/profile');
    }
  }, [session, router]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    setLoading(plan);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay');
      }

      // Create order
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const { orderId, amount, currency, key } = await response.json();

      if (!key) {
        throw new Error('Payment configuration error. Please contact support.');
      }

      // Razorpay options
      const options = {
        key,
        amount: amount,
        currency: currency,
        name: 'EduExplorer',
        description: `${plan === 'monthly' ? 'Monthly' : 'Yearly'} Pro Plan`,
        order_id: orderId,
        prefill: {
          name: session?.user?.name || '',
          email: session?.user?.email || '',
        },
        theme: {
          color: '#8B5CF6',
        },
        handler: async function (response: any) {
          // Verify payment
          const verifyResponse = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              plan,
            }),
          });

          if (verifyResponse.ok) {
            window.location.href = `/upgrade/success?returnTo=${encodeURIComponent(returnTo)}`;
          } else {
            alert('Payment verification failed');
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to start payment. Please try again.');
      setLoading(null);
    }
  };

  const freeFeatures = [
    '5 AI lessons per day',
    'Basic quizzes (1 per topic)',
    'Limited flashcards (1 per topic)',
    'XP & streak tracking',
    'Study groups',
    'Global leaderboard',
  ];

  const features = [
    '15 AI lessons/day (3× Free)',
    'Unlimited quizzes & flashcards',
    'Audio narration (on-demand)',
    'Presentation generation',
    'Ad-free experience',
    'Download content (PDF/PPTX)',
    'Priority AI processing',
    'Priority support',
    'All XP & gamification features',
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Upgrade to Pro
        </h1>
        <p className="text-xl text-gray-600">
          Unlock unlimited learning potential
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-gray-700">
              Free
            </CardTitle>
            <div className="mt-3">
              <span className="text-3xl font-bold">₹0</span>
              <span className="text-gray-600">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Monthly Plan */}
        <Card className="relative border-2 border-purple-500">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
            MOST POPULAR
          </div>

          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap className="h-5 w-5 text-blue-600" />
              Pro Monthly
            </CardTitle>
            <div className="mt-3">
              <span className="text-3xl font-bold">₹499</span>
              <span className="text-gray-600">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleUpgrade('monthly')}
              disabled={loading !== null}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              {loading === 'monthly' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Subscribe Monthly'
              )}
            </Button>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">Supports UPI, Cards, Netbanking, Wallets</p>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Plan */}
        <Card className="relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
            SAVE ₹989
          </div>

          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Crown className="h-5 w-5 text-yellow-500" />
              Pro Yearly
            </CardTitle>
            <div className="mt-3">
              <span className="text-3xl font-bold">₹4,999</span>
              <span className="text-gray-600">/year</span>
              <div className="text-sm text-green-600 font-medium mt-1">= ₹416/month</div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleUpgrade('yearly')}
              disabled={loading !== null}
              className="w-full"
              size="lg"
            >
              {loading === 'yearly' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Subscribe Yearly'
              )}
            </Button>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">Supports UPI, Cards, Netbanking, Wallets</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-600 mb-4">Accepted Payment Methods</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm">💳 Visa</div>
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm">💳 Mastercard</div>
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm">💳 Amex</div>
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm">📱 UPI</div>
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm">🏦 Netbanking</div>
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm">👛 Wallets</div>
        </div>
      </div>

      {/* Auto-renewal info */}
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">About Auto-Renewal</p>
            <p className="text-sm text-blue-700">
              Your subscription will be active for the selected period (monthly or yearly).
              To enable automatic renewal via UPI AutoPay, select &quot;Save card/UPI for future payments&quot;
              in the Razorpay checkout. You can manage or cancel your subscription anytime from your{' '}
              <Link href="/profile" className="underline font-semibold hover:text-blue-900">profile page</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradePageContent />
    </Suspense>
  );
}