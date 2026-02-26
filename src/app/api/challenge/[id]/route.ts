import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Only participants can view
    if (challenge.challengerId !== userId && challenge.challengeeId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Get challenge error:', error);
    return NextResponse.json({ error: 'Failed to get challenge' }, { status: 500 });
  }
}
