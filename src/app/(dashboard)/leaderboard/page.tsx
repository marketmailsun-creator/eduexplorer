import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, TrendingUp, Zap, Flame } from 'lucide-react';
import Link from 'next/link';
import { getXPLeaderboard } from '@/lib/services/xp.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface SearchParams {
  tab?: string;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { tab = 'quiz' } = await searchParams;
  const isXPTab = tab === 'xp';

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-purple-600" />
          Global Leaderboard
        </h1>
        <p className="text-gray-600">Top learners across EduExplorer</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <Link
          href="/leaderboard?tab=quiz"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !isXPTab
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Quiz Leaderboard
        </Link>
        <Link
          href="/leaderboard?tab=xp"
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
            isXPTab
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          XP Leaderboard
        </Link>
      </div>

      {isXPTab ? (
        <XPLeaderboardTab currentUserId={session.user.id} />
      ) : (
        <QuizLeaderboardTab currentUserId={session.user.id} />
      )}
    </div>
  );
}

async function QuizLeaderboardTab({ currentUserId }: { currentUserId: string }) {
  const topUsers = await prisma.quizScore.groupBy({
    by: ['userId'],
    _sum: { score: true },
    _count: { id: true },
    orderBy: { _sum: { score: 'desc' } },
    take: 100,
  });

  const userIds = topUsers.map((u) => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const leaderboard = topUsers.map((entry, index) => ({
    rank: index + 1,
    user: userMap.get(entry.userId),
    totalScore: entry._sum.score || 0,
    quizzesTaken: entry._count.id,
  }));

  const currentUserRank = leaderboard.findIndex((e) => e.user?.id === currentUserId);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Medal className="h-6 w-6 text-orange-600" />;
      default: return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  return (
    <>
      {currentUserRank >= 0 && (
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-purple-600">#{currentUserRank + 1}</div>
              <div>
                <p className="font-semibold">Your Rank</p>
                <p className="text-sm text-gray-600">
                  {leaderboard[currentUserRank].totalScore} total points
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>Top 100 Quiz Learners</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.user?.id}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  entry.user?.id === currentUserId
                    ? 'bg-purple-50 border-2 border-purple-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="w-12 flex justify-center">{getRankIcon(entry.rank)}</div>
                <img
                  src={entry.user?.image || '/default-avatar.svg'}
                  alt={entry.user?.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{entry.user?.name || 'Anonymous'}</p>
                  <p className="text-sm text-gray-600">{entry.quizzesTaken} quizzes taken</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">{entry.totalScore}</div>
                  <div className="text-xs text-gray-600">points</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

async function XPLeaderboardTab({ currentUserId }: { currentUserId: string }) {
  const leaderboard = await getXPLeaderboard(50);
  const currentUserRank = leaderboard.findIndex((e) => e.id === currentUserId);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Medal className="h-6 w-6 text-orange-600" />;
      default: return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  return (
    <>
      {currentUserRank >= 0 && (
        <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-yellow-600">#{currentUserRank + 1}</div>
              <div>
                <p className="font-semibold">Your XP Rank</p>
                <p className="text-sm text-gray-600">
                  {leaderboard[currentUserRank].totalXP} XP earned
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Top 50 by XP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  entry.id === currentUserId
                    ? 'bg-yellow-50 border-2 border-yellow-300'
                    : 'bg-gray-50'
                }`}
              >
                <div className="w-12 flex justify-center">{getRankIcon(index + 1)}</div>
                <img
                  src={entry.image || '/default-avatar.svg'}
                  alt={entry.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{entry.name || 'Anonymous'}</p>
                  {entry.currentStreak > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-orange-500">
                      <Flame className="h-3 w-3" />
                      {entry.currentStreak} day streak
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-600">{entry.totalXP}</div>
                  <div className="text-xs text-gray-600">XP</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}