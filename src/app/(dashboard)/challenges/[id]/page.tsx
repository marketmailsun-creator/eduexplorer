import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Swords, ArrowLeft, Trophy } from 'lucide-react';
import { ChallengeRespondButtons } from '../ChallengeRespondButtons';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChallengeDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { id } = await params;
  const userId = session.user.id;

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      challenger: { select: { id: true, name: true, image: true } },
      challengee: { select: { id: true, name: true, image: true } },
      query: { select: { id: true, queryText: true } },
    },
  });

  if (!challenge) notFound();
  if (challenge.challengerId !== userId && challenge.challengeeId !== userId) {
    redirect('/challenges');
  }

  const isChallenger = challenge.challengerId === userId;
  const me = isChallenger ? challenge.challenger : challenge.challengee;
  const opponent = isChallenger ? challenge.challengee : challenge.challenger;
  const myScore = isChallenger ? challenge.challengerScore : challenge.challengeeScore;
  const oppScore = isChallenger ? challenge.challengeeScore : challenge.challengerScore;
  const myTime = isChallenger ? challenge.challengerTime : challenge.challengeeTime;
  const oppTime = isChallenger ? challenge.challengeeTime : challenge.challengerTime;

  const isPending = challenge.status === 'PENDING';
  const isAccepted = challenge.status === 'ACCEPTED';
  const isCompleted = challenge.status === 'COMPLETED';

  return (
    <div className="container max-w-2xl py-8 px-4 space-y-6">
      <Link
        href="/challenges"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Challenges
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-purple-600" />
            Quiz Challenge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Topic */}
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-xs text-purple-600 font-medium mb-1">Topic</p>
            <p className="font-semibold">{challenge.query.queryText}</p>
          </div>

          {/* Participants */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { user: challenge.challenger, score: challenge.challengerScore, time: challenge.challengerTime, label: 'Challenger' },
              { user: challenge.challengee, score: challenge.challengeeScore, time: challenge.challengeeTime, label: 'Challenged' },
            ].map(({ user, score, time, label }) => (
              <div
                key={user.id}
                className={`border rounded-lg p-4 text-center space-y-2 ${
                  user.id === userId ? 'border-purple-300 bg-purple-50' : ''
                }`}
              >
                <img
                  src={user.image ?? '/default-avatar.svg'}
                  alt={user.name ?? 'User'}
                  className="w-12 h-12 rounded-full mx-auto object-cover"
                />
                <p className="font-semibold text-sm">{user.name ?? 'Anonymous'}</p>
                <p className="text-xs text-gray-500">{label}</p>
                {isCompleted && score !== null ? (
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{score}</p>
                    <p className="text-xs text-gray-500">{time}s</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    {score !== null ? `${score} pts` : 'Not taken yet'}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Result banner */}
          {isCompleted && myScore !== null && oppScore !== null && (
            <div
              className={`p-4 rounded-lg text-center font-semibold ${
                myScore > oppScore
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : myScore < oppScore
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}
            >
              {myScore > oppScore ? (
                <span className="flex items-center justify-center gap-2">
                  <Trophy className="h-5 w-5" /> You won!
                </span>
              ) : myScore < oppScore ? (
                'Better luck next time!'
              ) : (
                "It's a tie!"
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col items-center gap-3">
            {isPending && !isChallenger && (
              <ChallengeRespondButtons challengeId={challenge.id} />
            )}
            {(isAccepted || (isPending && isChallenger)) && myScore === null && (
              <Link
                href={`/results/${challenge.query.id}?challenge=${challenge.id}`}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Take Quiz Now
              </Link>
            )}
            {isAccepted && myScore !== null && !isCompleted && (
              <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 text-center">
                ✅ You scored <strong>{myScore} pts</strong> — waiting for{' '}
                {opponent?.name ?? 'your opponent'} to play!
              </div>
            )}
            {isCompleted && (
              <Link
                href="/challenges"
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Back to Challenges
              </Link>
            )}
          </div>

          <p className="text-xs text-center text-gray-400">
            Expires: {new Date(challenge.expiresAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
