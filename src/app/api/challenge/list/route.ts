import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import type { ChallengeStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status'); // 'active' | 'completed' | 'all'

    const statusCondition: { in: ChallengeStatus[] } | undefined =
      statusFilter === 'active'
        ? { in: ['PENDING', 'ACCEPTED'] as ChallengeStatus[] }
        : statusFilter === 'completed'
        ? { in: ['COMPLETED', 'DECLINED', 'EXPIRED'] as ChallengeStatus[] }
        : undefined;

    const challenges = await prisma.challenge.findMany({
      where: {
        OR: [{ challengerId: userId }, { challengeeId: userId }],
        ...(statusCondition ? { status: statusCondition } : {}),
      },
      include: {
        challenger: { select: { id: true, name: true, image: true } },
        challengee: { select: { id: true, name: true, image: true } },
        query: { select: { id: true, queryText: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('List challenges error:', error);
    return NextResponse.json({ error: 'Failed to list challenges' }, { status: 500 });
  }
}
