'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Loader2, Zap } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function UpgradePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null);

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

      const { orderId, amount, currency } = await response.json();

      // Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
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
            window.location.href = '/upgrade/success';
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

  const features = [
    'Unlimited queries',
    'Priority AI processing',
    'Advanced analytics',
    'Export to PDF/PPTX',
    'Study groups',
    'Ad-free experience',
    'Priority support',
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

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Monthly Plan */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Zap className="h-6 w-6 text-blue-600" />
              Monthly
            </CardTitle>
            <div className="mt-4">
              <span className="text-4xl font-bold">₹999</span>
              <span className="text-gray-600">/month</span>
              <div className="text-sm text-gray-500 mt-1">≈ $12 USD</div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleUpgrade('monthly')}
              disabled={loading !== null}
              className="w-full"
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

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Supports UPI, Cards, Netbanking, Wallets
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Plan */}
        <Card className="relative border-2 border-purple-500">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            BEST VALUE - Save 17%
          </div>

          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-yellow-500" />
              Yearly
            </CardTitle>
            <div className="mt-4">
              <span className="text-4xl font-bold">₹9,999</span>
              <span className="text-gray-600">/year</span>
              <div className="text-sm text-gray-500 mt-1">≈ $120 USD</div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleUpgrade('yearly')}
              disabled={loading !== null}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Supports UPI, Cards, Netbanking, Wallets
              </p>
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
    </div>
  );
}