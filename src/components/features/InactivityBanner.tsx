'use client';

import { useState } from 'react';
import { X, Flame, Zap } from 'lucide-react';
import Link from 'next/link';

interface InactivityBannerProps {
  daysInactive: number;
}

export function InactivityBanner({ daysInactive }: InactivityBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || daysInactive < 3) return null;

  const config =
    daysInactive >= 14
      ? {
          bg: 'from-red-500 to-orange-500',
          icon: <Flame className="h-5 w-5 text-white animate-pulse flex-shrink-0" />,
          message: `It's been ${daysInactive} days! Your streak is gone but your learning journey doesn't have to be.`,
          cta: 'Start Fresh Today',
        }
      : daysInactive >= 7
      ? {
          bg: 'from-orange-400 to-amber-500',
          icon: <Flame className="h-5 w-5 text-white flex-shrink-0" />,
          message: `${daysInactive} days without learning. Come back and rebuild your streak!`,
          cta: 'Pick Up Where You Left Off',
        }
      : {
          bg: 'from-purple-500 to-indigo-600',
          icon: <Zap className="h-5 w-5 text-white flex-shrink-0" />,
          message: `3 days since your last lesson. Don't let your streak slip away!`,
          cta: 'Continue Learning',
        };

  return (
    <div className={`w-full bg-gradient-to-r ${config.bg} px-4 py-2.5`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {config.icon}
          <p className="text-white text-sm font-medium truncate">{config.message}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/explore"
            className="text-xs font-bold bg-white/20 hover:bg-white/30 text-white
                       px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
          >
            {config.cta}
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
