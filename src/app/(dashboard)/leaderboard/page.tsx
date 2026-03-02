import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient hero header */}
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-500 px-4 py-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
              <p className="text-sm text-yellow-100">Top learners across EduExplorer</p>
            </div>
          </div>

          {/* Tab switcher inside hero */}
          <div className="flex gap-2">
            <Link
              href="/leaderboard?tab=quiz"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                !isXPTab
                  ? 'bg-white text-orange-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              🧩 Quiz
            </Link>
            <Link
              href="/leaderboard?tab=xp"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 ${
                isXPTab
                  ? 'bg-white text-yellow-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              XP
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isXPTab ? (
          <XPLeaderboardTab currentUserId={session.user.id} />
        ) : (
          <QuizLeaderboardTab currentUserId={session.user.id} />
        )}
      </div>
    </div>
  );
}

// ── Podium component for top 3 ────────────────────────────────
function Podium({
  entries,
  scoreLabel,
  scoreColor,
}: {
  entries: Array<{ name?: string | null; image?: string | null; score: number }>;
  scoreLabel: string;
  scoreColor: string;
}) {
  if (entries.length < 3) return null;
  const [first, second, third] = entries;
  return (
    <div className="flex items-end justify-center gap-4 sm:gap-8 py-6 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
      {/* 2nd place */}
      <div className="flex flex-col items-center gap-2">
        <img
          src={second.image || '/default-avatar.svg'}
          alt={second.name || 'User'}
          className="w-14 h-14 rounded-full border-4 border-gray-300 shadow-md object-cover"
        />
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700 truncate max-w-[80px]">{second.name || 'Anonymous'}</p>
          <p className={`text-sm font-bold ${scoreColor}`}>{second.score}</p>
          <p className="text-xs text-gray-400">{scoreLabel}</p>
        </div>
        <div className="w-20 h-14 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-xl flex items-end justify-center pb-2">
          <span className="text-2xl">🥈</span>
        </div>
      </div>

      {/* 1st place — taller */}
      <div className="flex flex-col items-center gap-2 -mb-2">
        <span className="text-2xl mb-1">👑</span>
        <img
          src={first.image || '/default-avatar.svg'}
          alt={first.name || 'User'}
          className="w-16 h-16 rounded-full border-4 border-yellow-400 shadow-lg object-cover"
        />
        <div className="text-center">
          <p className="text-xs font-bold text-gray-900 truncate max-w-[80px]">{first.name || 'Anonymous'}</p>
          <p className={`text-sm font-bold ${scoreColor}`}>{first.score}</p>
          <p className="text-xs text-gray-400">{scoreLabel}</p>
        </div>
        <div className="w-20 h-20 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-xl flex items-end justify-center pb-2">
          <span className="text-3xl">🏆</span>
        </div>
      </div>

      {/* 3rd place */}
      <div className="flex flex-col items-center gap-2">
        <img
          src={third.image || '/default-avatar.svg'}
          alt={third.name || 'User'}
          className="w-14 h-14 rounded-full border-4 border-orange-400 shadow-md object-cover"
        />
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700 truncate max-w-[80px]">{third.name || 'Anonymous'}</p>
          <p className={`text-sm font-bold ${scoreColor}`}>{third.score}</p>
          <p className="text-xs text-gray-400">{scoreLabel}</p>
        </div>
        <div className="w-20 h-10 bg-gradient-to-t from-orange-400 to-orange-300 rounded-t-xl flex items-end justify-center pb-2">
          <span className="text-xl">🥉</span>
        </div>
      </div>
    </div>
  );
}

// ── Quiz leaderboard ──────────────────────────────────────────
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
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-orange-500" />;
      default: return <span className="text-sm font-bold text-gray-400">#{rank}</span>;
    }
  };

  const podiumEntries = leaderboard.slice(0, 3).map(e => ({
    name: e.user?.name,
    image: e.user?.image,
    score: e.totalScore,
  }));

  return (
    <>
      {/* Your rank card */}
      {currentUserRank >= 0 && (
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 flex items-center gap-3">
          <div className="text-2xl font-extrabold text-purple-600">#{currentUserRank + 1}</div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Your Rank</p>
            <p className="text-xs text-gray-500">{leaderboard[currentUserRank].totalScore} total points from {leaderboard[currentUserRank].quizzesTaken} quizzes</p>
          </div>
        </div>
      )}

      {/* Podium for top 3 */}
      <Podium entries={podiumEntries} scoreLabel="pts" scoreColor="text-purple-600" />

      {/* Full list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Top 100 Quiz Learners</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {leaderboard.map((entry) => (
            <div
              key={entry.user?.id}
              className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                entry.user?.id === currentUserId
                  ? 'bg-purple-50 border-l-4 border-purple-400'
                  : entry.rank <= 3
                  ? 'bg-yellow-50/40'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-10 flex justify-center flex-shrink-0">{getRankIcon(entry.rank)}</div>
              <img
                src={entry.user?.image || '/default-avatar.svg'}
                alt={entry.user?.name || 'User'}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {entry.user?.name || 'Anonymous'}
                  {entry.user?.id === currentUserId && (
                    <span className="ml-2 text-xs text-purple-500 font-normal">You</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">{entry.quizzesTaken} quizzes</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-purple-600">{entry.totalScore}</div>
                <div className="text-xs text-gray-400">pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── XP leaderboard ────────────────────────────────────────────
async function XPLeaderboardTab({ currentUserId }: { currentUserId: string }) {
  const leaderboard = await getXPLeaderboard(50);
  const currentUserRank = leaderboard.findIndex((e) => e.id === currentUserId);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-orange-500" />;
      default: return <span className="text-sm font-bold text-gray-400">#{rank}</span>;
    }
  };

  const podiumEntries = leaderboard.slice(0, 3).map(e => ({
    name: e.name,
    image: e.image,
    score: e.totalXP,
  }));

  return (
    <>
      {/* Your rank card */}
      {currentUserRank >= 0 && (
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 flex items-center gap-3">
          <div className="text-2xl font-extrabold text-yellow-600">#{currentUserRank + 1}</div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Your XP Rank</p>
            <p className="text-xs text-gray-500">{leaderboard[currentUserRank].totalXP} XP earned</p>
          </div>
        </div>
      )}

      {/* Podium for top 3 */}
      <Podium entries={podiumEntries} scoreLabel="XP" scoreColor="text-yellow-600" />

      {/* Full list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <h2 className="text-sm font-semibold text-gray-700">Top 50 by XP</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                entry.id === currentUserId
                  ? 'bg-yellow-50 border-l-4 border-yellow-400'
                  : index < 3
                  ? 'bg-yellow-50/30'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-10 flex justify-center flex-shrink-0">{getRankIcon(index + 1)}</div>
              <img
                src={entry.image || '/default-avatar.svg'}
                alt={entry.name || 'User'}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {entry.name || 'Anonymous'}
                  {entry.id === currentUserId && (
                    <span className="ml-2 text-xs text-yellow-600 font-normal">You</span>
                  )}
                </p>
                {entry.currentStreak > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-orange-500">
                    <Flame className="h-3 w-3" />
                    {entry.currentStreak} day streak
                  </span>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-yellow-600">{entry.totalXP}</div>
                <div className="text-xs text-gray-400">XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
