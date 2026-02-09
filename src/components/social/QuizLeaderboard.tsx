'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuizScore {
  id: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface QuizLeaderboardProps {
  queryId: string;
}

export function QuizLeaderboard({ queryId }: QuizLeaderboardProps) {
  const [scores, setScores] = useState<QuizScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [queryId, timeFilter]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quiz/leaderboard/${queryId}?filter=${timeFilter}`);
      const data = await response.json();
      
      if (response.ok) {
        setScores(data.scores || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (index === 1) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (index === 2) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Leaderboard
          </CardTitle>
          
          {/* Time Filter */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                timeFilter === 'all'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                timeFilter === 'week'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                timeFilter === 'month'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No scores yet. Be the first to complete the quiz!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scores.map((scoreEntry, index) => (
              <div
                key={scoreEntry.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all hover:shadow-md ${
                  index < 3 ? getRankBadge(index) : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-12">
                  {getRankIcon(index) || (
                    <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                  )}
                </div>

                {/* User Avatar */}
                <img
                  src={scoreEntry.user.image || '/default-avatar.png'}
                  alt={scoreEntry.user.name || 'User'}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${
                    index < 3 ? 'text-white' : 'text-gray-900'
                  }`}>
                    {scoreEntry.user.name || 'Anonymous'}
                  </p>
                  <div className={`flex items-center gap-2 text-xs ${
                    index < 3 ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    <Clock className="h-3 w-3" />
                    {formatTime(scoreEntry.timeSpent)}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    index < 3 ? 'text-white' : 'text-purple-600'
                  }`}>
                    {getPercentage(scoreEntry.score, scoreEntry.totalQuestions)}%
                  </div>
                  <div className={`text-xs ${
                    index < 3 ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {scoreEntry.score}/{scoreEntry.totalQuestions}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {scores.length > 0 && (
          <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {scores.length}
              </div>
              <div className="text-xs text-gray-600">Participants</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(
                  scores.reduce(
                    (acc, s) => acc + getPercentage(s.score, s.totalQuestions),
                    0
                  ) / scores.length
                )}%
              </div>
              <div className="text-xs text-gray-600">Avg Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {formatTime(
                  Math.round(
                    scores.reduce((acc, s) => acc + s.timeSpent, 0) / scores.length
                  )
                )}
              </div>
              <div className="text-xs text-gray-600">Avg Time</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
