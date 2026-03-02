'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface UnlockedAchievement {
  code: string;
  name: string;
  iconName: string;
  xpReward: number;
}

interface AchievementToastProps {
  achievements: UnlockedAchievement[];
}

export function AchievementToast({ achievements }: AchievementToastProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (!achievements || achievements.length === 0) return;

    achievements.forEach((a, i) => {
      setTimeout(() => {
        toast({
          title: `${a.iconName} Achievement Unlocked!`,
          description: `${a.name}${a.xpReward > 0 ? ` (+${a.xpReward} XP)` : ''}`,
        });
      }, i * 500);
    });
  }, [achievements, toast]);

  return null;
}
