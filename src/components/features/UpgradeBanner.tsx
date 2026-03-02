'use client';

import { Crown, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface UpgradeBannerProps {
  message?: string;
  dismissible?: boolean;
}

export function UpgradeBanner({
  message = 'Upgrade to Pro for unlimited access.',
  dismissible = true,
}: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Crown className="h-4 w-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 mb-0.5">Free plan limit reached</p>
        <p className="text-xs text-amber-700 leading-relaxed">{message}</p>
        <Link
          href="/upgrade"
          className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Crown className="h-3 w-3" />
          Upgrade to Pro
        </Link>
      </div>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
