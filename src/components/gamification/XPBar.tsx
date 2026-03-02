'use client';

import { Zap } from 'lucide-react';

interface XPBarProps {
  totalXP: number;
  compact?: boolean;
}

const MILESTONES = [100, 200, 500, 1000, 2000, 5000];

export function XPBar({ totalXP, compact }: XPBarProps) {
  const nextMilestone = MILESTONES.find((m) => m > totalXP) ?? MILESTONES[MILESTONES.length - 1];
  const prevMilestoneIdx = MILESTONES.indexOf(nextMilestone) - 1;
  const prevMilestone = prevMilestoneIdx >= 0 ? MILESTONES[prevMilestoneIdx] : 0;
  const range = nextMilestone - prevMilestone;
  const progress = Math.min(100, ((totalXP - prevMilestone) / range) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-semibold text-yellow-600">
        <Zap className="h-4 w-4 fill-yellow-400 stroke-yellow-600" />
        <span>{totalXP} XP</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1 font-medium text-yellow-600">
          <Zap className="h-3 w-3 fill-yellow-400 stroke-yellow-600" />
          {totalXP} XP
        </span>
        <span>Next milestone: {nextMilestone} XP</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
