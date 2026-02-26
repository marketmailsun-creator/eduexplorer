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
    const challengerId = session.user.id;

    const { challengeeId, queryId, groupId } = await req.json();

    if (!challengeeId || !queryId || !groupId) {
      return NextResponse.json(
        { error: 'Missing required fields: challengeeId, queryId, groupId' },
        { status: 400 }
      );
    }

    if (challengeeId === challengerId) {
      return NextResponse.json({ error: 'You cannot challenge yourself' }, { status: 400 });
    }

    // Validate both users are members of the group
    const [challengerMember, challengeeMember] = await Promise.all([
      prisma.studyGroupMember.findUnique({
        where: { groupId_userId: { groupId, userId: challengerId } },
      }),
      prisma.studyGroupMember.findUnique({
        where: { groupId_userId: { groupId, userId: challengeeId } },
      }),
    ]);

    if (!challengerMember || !challengeeMember) {
      return NextResponse.json(
        { error: 'Both users must be members of the same group' },
        { status: 403 }
      );
    }

    // Check no existing pending/accepted challenge for same pair + topic
    const existing = await prisma.challenge.findFirst({
      where: {
        queryId,
        status: { in: ['PENDING', 'ACCEPTED'] },
        OR: [
          { challengerId, challengeeId },
          { challengerId: challengeeId, challengeeId: challengerId },
        ],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'A pending challenge for this topic already exists' },
        { status: 409 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const challenge = await prisma.challenge.create({
      data: { challengerId, challengeeId, queryId, groupId, expiresAt },
    });

    // Notify challengee via push notification
    const topic = await prisma.query.findUnique({
      where: { id: queryId },
      select: { queryText: true },
    });
    const challengerName = session.user.name ?? 'Someone';
    const topicText = topic?.queryText ?? 'a topic';

    sendPushNotification(challengeeId, {
      title: '⚔️ Quiz Challenge!',
      body: `${challengerName} challenged you to a quiz on "${topicText.substring(0, 60)}"`,
      url: `/challenges/${challenge.id}`,
    }).catch(() => {});

    return NextResponse.json({ success: true, challengeId: challenge.id });
  } catch (error) {
    console.error('Create challenge error:', error);
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}
