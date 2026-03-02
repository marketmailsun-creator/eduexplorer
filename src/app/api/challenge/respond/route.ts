import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { sendPushNotification } from '@/lib/services/push-notifications.service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { challengeId, action } = await req.json();

    if (!challengeId || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing or invalid fields: challengeId, action (accept|decline)' },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.challengeeId !== userId) {
      return NextResponse.json({ error: 'Only the challengee can respond' }, { status: 403 });
    }

    if (challenge.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Challenge is no longer pending' },
        { status: 409 }
      );
    }

    const newStatus = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
    await prisma.challenge.update({
      where: { id: challengeId },
      data: { status: newStatus },
    });

    // Notify challenger of response
    const challengeeName = session.user.name ?? 'Your opponent';
    if (action === 'accept') {
      sendPushNotification(challenge.challengerId, {
        title: '✅ Challenge Accepted!',
        body: `${challengeeName} accepted your quiz challenge. May the best learner win!`,
        url: `/challenges/${challengeId}`,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Respond challenge error:', error);
    return NextResponse.json({ error: 'Failed to respond to challenge' }, { status: 500 });
  }
}
