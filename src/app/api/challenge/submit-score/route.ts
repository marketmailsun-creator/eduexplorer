import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { awardXP } from '@/lib/services/xp.service';
import { sendPushNotification } from '@/lib/services/push-notifications.service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { challengeId, score, totalQuestions, timeSpent } = await req.json();

    if (!challengeId || score === undefined || !totalQuestions || !timeSpent) {
      return NextResponse.json(
        { error: 'Missing required fields: challengeId, score, totalQuestions, timeSpent' },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        challenger: { select: { id: true, name: true } },
        challengee: { select: { id: true, name: true } },
        query: { select: { queryText: true } },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const isChallenger = challenge.challengerId === userId;
    const isChallengee = challenge.challengeeId === userId;

    if (!isChallenger && !isChallengee) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!['ACCEPTED', 'PENDING'].includes(challenge.status)) {
      return NextResponse.json(
        { error: 'Challenge is not in a scoreable state' },
        { status: 409 }
      );
    }

    // Update the correct score
    const updateData = isChallenger
      ? { challengerScore: score, challengerTime: timeSpent }
      : { challengeeScore: score, challengeeTime: timeSpent };

    const updated = await prisma.challenge.update({
      where: { id: challengeId },
      data: updateData,
    });

    // Check if both scores are in — resolve the challenge
    const bothScored =
      updated.challengerScore !== null && updated.challengeeScore !== null;

    if (bothScored) {
      const challScore = updated.challengerScore!;
      const challeeScore = updated.challengeeScore!;
      const challTime = updated.challengerTime!;
      const challeeTime = updated.challengeeTime!;

      // Determine winner: higher score wins; tie-break on time (lower = faster)
      let winnerId: string | null = null;
      if (challScore > challeeScore) winnerId = challenge.challengerId;
      else if (challeeScore > challScore) winnerId = challenge.challengeeId;
      else if (challTime < challeeTime) winnerId = challenge.challengerId;
      else if (challeeTime < challTime) winnerId = challenge.challengeeId;
      // else: exact tie on score and time — no winner

      await prisma.challenge.update({
        where: { id: challengeId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      // Award 10 XP to winner (both if tied)
      if (winnerId) {
        await awardXP(winnerId, 10, 'quiz_completion', { challengeId, type: 'challenge_win' });
      } else {
        // Tie — award 5 XP each
        await Promise.all([
          awardXP(challenge.challengerId, 5, 'quiz_completion', {
            challengeId,
            type: 'challenge_tie',
          }),
          awardXP(challenge.challengeeId, 5, 'quiz_completion', {
            challengeId,
            type: 'challenge_tie',
          }),
        ]);
      }

      // Notify both participants
      const topicText = (challenge.query?.queryText ?? 'the quiz').substring(0, 50);
      const winnerName =
        winnerId === challenge.challengerId
          ? challenge.challenger.name
          : challenge.challengee.name;

      const resultMsg = winnerId
        ? `${winnerName} won the challenge on "${topicText}"!`
        : `The challenge on "${topicText}" ended in a tie!`;

      sendPushNotification(challenge.challengerId, {
        title: '🏁 Challenge Complete!',
        body: resultMsg,
        url: `/challenges/${challengeId}`,
      }).catch(() => {});

      sendPushNotification(challenge.challengeeId, {
        title: '🏁 Challenge Complete!',
        body: resultMsg,
        url: `/challenges/${challengeId}`,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, bothScored, status: bothScored ? 'COMPLETED' : challenge.status });
  } catch (error) {
    console.error('Submit challenge score error:', error);
    return NextResponse.json({ error: 'Failed to submit challenge score' }, { status: 500 });
  }
}
