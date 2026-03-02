'use client';

import { useState, useEffect } from 'react';
import { Zap, X } from 'lucide-react';
import Link from 'next/link';

const DISMISS_KEY = 'xp_banner_dismissed';

export function XPRedemptionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(DISMISS_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 text-white">
      <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium">
        <Zap className="h-4 w-4 flex-shrink-0 fill-white" />
        <span>
          Earn <strong>100 XP</strong> → Get a{' '}
          <strong>₹100 Amazon Voucher!</strong>
        </span>
        <Link
          href="/xp"
          className="underline underline-offset-2 hover:no-underline font-bold flex-shrink-0"
        >
          Redeem now →
        </Link>
        <button
          onClick={dismiss}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
