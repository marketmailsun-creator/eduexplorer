'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LeaderboardEntry {
  id: string;
  name: string | null;
  image: string | null;
  totalXP: number;
  currentStreak: number;
}

export function LeaderboardWidget() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/xp/leaderboard')
      .then((r) => r.json())
      .then((data) => {
        setEntries((data.leaderboard ?? []).slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-purple-600" />
          Top Learners
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No data yet</p>
        ) : (
          entries.map((entry, i) => (
            <div key={entry.id} className="flex items-center gap-2 text-sm">
              <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
              <img
                src={entry.image ?? '/default-avatar.svg'}
                alt={entry.name ?? 'User'}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="flex-1 truncate font-medium">{entry.name ?? 'Anonymous'}</span>
              <span className="flex items-center gap-0.5 text-yellow-600 font-semibold text-xs">
                <Zap className="h-3 w-3" />
                {entry.totalXP}
              </span>
            </div>
          ))
        )}
        <div className="pt-2 border-t">
          <Link
            href="/leaderboard"
            className="text-xs text-purple-600 hover:underline font-medium"
          >
            View full leaderboard →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
