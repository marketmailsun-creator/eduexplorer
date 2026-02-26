import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Swords, Clock, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { ChallengeRespondButtons } from './ChallengeRespondButtons';

export const dynamic = 'force-dynamic';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  ACCEPTED: { label: 'In Progress', color: 'text-blue-600 bg-blue-50', icon: Swords },
  COMPLETED: { label: 'Completed', color: 'text-green-600 bg-green-50', icon: Trophy },
  DECLINED: { label: 'Declined', color: 'text-red-600 bg-red-50', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'text-gray-500 bg-gray-50', icon: XCircle },
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

    return (
      <div key={c.id} className="border rounded-lg p-4 space-y-3 bg-white hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500">
              {isChallenger ? 'You challenged' : 'Challenged by'}
            </p>
            <p className="font-semibold truncate">{opponent.name ?? 'Anonymous'}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              Topic: {c.query.queryText.substring(0, 80)}
            </p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1 ${cfg.color}`}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </span>
        </div>

        {c.status === 'COMPLETED' && (
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-lg">{myScore ?? '—'}</p>
              <p className="text-xs text-gray-500">Your score</p>
            </div>
            <div className="text-gray-300 self-center text-xl">vs</div>
            <div className="text-center">
              <p className="font-bold text-lg">{oppScore ?? '—'}</p>
              <p className="text-xs text-gray-500">{opponent.name}&apos;s score</p>
            </div>
            {myScore !== null && oppScore !== null && (
              <div className="ml-auto self-center">
                {myScore > oppScore ? (
                  <span className="text-green-600 font-semibold text-sm">🏆 You won!</span>
                ) : myScore < oppScore ? (
                  <span className="text-red-500 font-semibold text-sm">Better luck next time</span>
                ) : (
                  <span className="text-yellow-600 font-semibold text-sm">Tie!</span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400">
            {new Date(c.createdAt).toLocaleDateString()}
          </span>
          <div className="flex gap-2">
            {isPending && <ChallengeRespondButtons challengeId={c.id} />}
            {(isAccepted || (c.status === 'PENDING' && isChallenger)) && (
              <Link
                href={`/query/${c.query.id}`}
                className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Take Quiz
              </Link>
            )}
            <Link
              href={`/challenges/${c.id}`}
              className="text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-3xl py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Swords className="h-7 w-7 text-purple-600" />
        <h1 className="text-2xl font-bold">Challenges</h1>
      </div>

      {active.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Challenges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {active.map(renderChallenge)}
          </CardContent>
        </Card>
      )}

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Past Challenges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {past.map(renderChallenge)}
          </CardContent>
        </Card>
      )}

      {challenges.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Swords className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No challenges yet</p>
          <p className="text-sm mt-1">
            Go to a{' '}
            <Link href="/groups" className="text-purple-600 hover:underline">
              Study Group
            </Link>{' '}
            and challenge a member to a quiz!
          </p>
        </div>
      )}
    </div>
  );
}
