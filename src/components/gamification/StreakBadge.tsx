'use client';

import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) return null;

  const isHot = streak >= 7;

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold ${
        isHot
          ? 'bg-orange-100 text-orange-600 ring-1 ring-orange-300'
          : 'bg-amber-50 text-amber-600'
      }`}
      title={`${streak}-day learning streak`}
    >
      <Flame
        className={`h-4 w-4 ${isHot ? 'fill-orange-500 stroke-orange-600' : 'fill-amber-400 stroke-amber-500'}`}
      />
      <span>{streak}</span>
    </div>
  );
}
