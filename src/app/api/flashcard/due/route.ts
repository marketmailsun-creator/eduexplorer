import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json({ error: 'contentId required' }, { status: 400 });
    }

    const now = new Date();
    const dueCards = await prisma.flashcardProgress.findMany({
      where: {
        userId: session.user.id,
        contentId,
        dueDate: { lte: now },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json({ dueCards, count: dueCards.length });
  } catch (error) {
    console.error('Flashcard due error:', error);
    return NextResponse.json({ error: 'Failed to fetch due cards' }, { status: 500 });
  }
}
