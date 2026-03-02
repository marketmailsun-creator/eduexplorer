import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Swords, Clock, XCircle, Trophy, Users } from 'lucide-react';
import { ChallengeRespondButtons } from './ChallengeRespondButtons';

export const dynamic = 'force-dynamic';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'text-yellow-700 bg-yellow-50 border border-yellow-200', icon: Clock },
  ACCEPTED: { label: 'In Progress', color: 'text-blue-700 bg-blue-50 border border-blue-200', icon: Swords },
  COMPLETED: { label: 'Completed', color: 'text-green-700 bg-green-50 border border-green-200', icon: Trophy },
  DECLINED: { label: 'Declined', color: 'text-red-600 bg-red-50 border border-red-200', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'text-gray-500 bg-gray-50 border border-gray-200', icon: XCircle },
} as const;

export default async function ChallengesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const challenges = await prisma.challenge.findMany({
    where: {
      OR: [{ challengerId: userId }, { challengeeId: userId }],
    },
    include: {
      challenger: { select: { id: true, name: true, image: true } },
      challengee: { select: { id: true, name: true, image: true } },
      query: { select: { id: true, queryText: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const active = challenges.filter((c) => ['PENDING', 'ACCEPTED'].includes(c.status));
  const past = challenges.filter((c) => !['PENDING', 'ACCEPTED'].includes(c.status));

  const renderChallenge = (c: (typeof challenges)[0]) => {
    const isChallenger = c.challengerId === userId;
    const opponent = isChallenger ? c.challengee : c.challenger;
    const cfg = STATUS_CONFIG[c.status as keyof typeof STATUS_CONFIG];
    const StatusIcon = cfg.icon;
    const isPending = c.status === 'PENDING' && !isChallenger;
    const isAccepted = c.status === 'ACCEPTED';
    const myScore = isChallenger ? c.challengerScore : c.challengeeScore;
    const oppScore = isChallenger ? c.challengeeScore : c.challengerScore;

    // Status strip gradient
    const stripClass =
      c.status === 'PENDING'
        ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
        : c.status === 'ACCEPTED'
        ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
        : c.status === 'COMPLETED' && myScore !== null && oppScore !== null && myScore > (oppScore ?? -1)
        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
        : c.status === 'COMPLETED'
        ? 'bg-gradient-to-r from-gray-300 to-gray-400'
        : 'bg-gradient-to-r from-red-300 to-red-400';

    return (
      <div
        key={c.id}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
      >
        {/* Status strip */}
        <div className={`h-1.5 ${stripClass}`} />

        <div className="p-4 space-y-3">
          {/* Header row: opponent avatar + status badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={opponent.image || '/default-avatar.svg'}
                alt={opponent.name || 'User'}
                className="w-10 h-10 rounded-full border-2 border-gray-100 flex-shrink-0 object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-400">
                  {isChallenger ? 'You challenged' : 'Challenged by'}
                </p>
                <p className="font-semibold text-gray-900 truncate">{opponent.name ?? 'Anonymous'}</p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${cfg.color}`}>
              <StatusIcon className="h-3 w-3" />
              {cfg.label}
            </span>
          </div>

          {/* Topic */}
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">
            📚 {c.query.queryText.substring(0, 100)}
          </p>

          {/* Score display for completed */}
          {c.status === 'COMPLETED' && (
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3">
              <div className="text-center">
                <p className="font-bold text-xl text-gray-900">{myScore ?? '—'}</p>
                <p className="text-xs text-gray-500">Your score</p>
              </div>
              <div className="text-gray-300 text-lg font-light flex-shrink-0">vs</div>
              <div className="text-center">
                <p className="font-bold text-xl text-gray-900">{oppScore ?? '—'}</p>
                <p className="text-xs text-gray-500">{opponent.name}&apos;s score</p>
              </div>
              {myScore !== null && oppScore !== null && (
                <div className="ml-auto">
                  {myScore > oppScore ? (
                    <span className="text-green-600 font-bold text-sm">🏆 You won!</span>
                  ) : myScore < oppScore ? (
                    <span className="text-gray-500 font-semibold text-sm">Better luck next time</span>
                  ) : (
                    <span className="text-yellow-600 font-bold text-sm">🤝 Tie!</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-400">
              {new Date(c.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: '2-digit',
              })}
            </span>
            <div className="flex gap-2 flex-wrap">
              {isPending && <ChallengeRespondButtons challengeId={c.id} />}
              {(isAccepted || (c.status === 'PENDING' && isChallenger)) && (
                <Link
                  href={`/results/${c.query.id}?challenge=${c.id}`}
                  className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold"
                >
                  ⚔️ Take Quiz
                </Link>
              )}
              <Link
                href={`/challenges/${c.id}`}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
              >
                Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient hero header */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 px-4 py-6 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Swords className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Challenges</h1>
              <p className="text-sm text-orange-100 mt-0.5">
                {active.length > 0
                  ? `${active.length} active challenge${active.length !== 1 ? 's' : ''}`
                  : 'Compete with friends on quiz topics'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {active.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Active Challenges
            </h2>
            <div className="space-y-3">{active.map(renderChallenge)}</div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Past Challenges
            </h2>
            <div className="space-y-3">{past.map(renderChallenge)}</div>
          </div>
        )}

        {challenges.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Swords className="h-10 w-10 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No challenges yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Go to a Study Group and challenge a member to a quiz!
            </p>
            <Link
              href="/groups"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-sm"
            >
              <Users className="h-4 w-4" />
              Browse Study Groups
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
