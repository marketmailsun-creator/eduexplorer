'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LeaderboardEntry {
  rank: number;
  user: {
    name: string;
    image?: string;
  };
  score: number;
  totalQuestions: number;
  timeSpent: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  queryId: string;
}

export function Leaderboard({ queryId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [queryId]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/quiz/leaderboard/${queryId}`);
      const data = await response.json();
      setEntries(data.leaderboard || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-600" />;
    return null;
  };

  const getScorePercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-4 p-4 rounded-lg transition ${
                entry.isCurrentUser
                  ? 'bg-purple-50 border-2 border-purple-600'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {/* Rank */}
              <div className="w-12 flex justify-center">
                {getRankIcon(entry.rank) || (
                  <span className="text-lg font-bold text-gray-600">
                    #{entry.rank}
                  </span>
                )}
              </div>

              {/* User Info */}
              <img
                src={entry.user.image || '/default-avatar.png'}
                alt={entry.user.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {entry.user.name}
                  {entry.isCurrentUser && (
                    <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-1 rounded">
                      You
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {getScorePercentage(entry.score, entry.totalQuestions)}% •{' '}
                  {Math.floor(entry.timeSpent / 60)}m {entry.timeSpent % 60}s
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  {entry.score}
                </div>
                <div className="text-xs text-gray-500">
                  / {entry.totalQuestions}
                </div>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No scores yet. Be the first!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}