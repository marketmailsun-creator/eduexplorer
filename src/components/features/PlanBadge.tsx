'use client';

import { Crown, Zap } from 'lucide-react';

interface PlanBadgeProps {
  plan: 'free' | 'pro';
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  if (plan === 'pro') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold">
        <Crown className="h-3 w-3" />
        <span>PRO</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
      <Zap className="h-3 w-3" />
      <span>FREE</span>
    </div>
  );
}