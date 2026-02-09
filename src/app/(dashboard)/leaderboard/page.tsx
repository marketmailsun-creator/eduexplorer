import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

export default async function LeaderboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get top users by total quiz scores
  const topUsers = await prisma.quizScore.groupBy({
    by: ['userId'],
    _sum: {
      score: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        score: 'desc',
      },
    },
    take: 100,
  });

  // Get user details
  const userIds = topUsers.map(u => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  const userMap = new Map(users.map(u => [u.id, u]));

  const leaderboard = topUsers.map((entry, index) => ({
    rank: index + 1,
    user: userMap.get(entry.userId),
    totalScore: entry._sum.score || 0,
    quizzesTaken: entry._count.id,
  }));

  const currentUserRank = leaderboard.findIndex(
    entry => entry.user?.id === session.user.id
  );

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
        <p className="text-gray-600">Top learners by quiz performance</p>
      </div>

      {/* Current User Rank */}
      {currentUserRank >= 0 && (
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-purple-600">
                  #{currentUserRank + 1}
                </div>
                <div>
                  <p className="font-semibold">Your Rank</p>
                  <p className="text-sm text-gray-600">
                    {leaderboard[currentUserRank].totalScore} total points
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top 100 Learners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.user?.id}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  entry.user?.id === session.user.id
                    ? 'bg-purple-50 border-2 border-purple-200'
                    : 'bg-gray-50'
                }`}
              >
                {/* Rank */}
                <div className="w-12 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* User */}
                <img
                  src={entry.user?.image || '/default-avatar.png'}
                  alt={entry.user?.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {entry.user?.name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {entry.quizzesTaken} quizzes taken
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {entry.totalScore}
                  </div>
                  <div className="text-xs text-gray-600">points</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}