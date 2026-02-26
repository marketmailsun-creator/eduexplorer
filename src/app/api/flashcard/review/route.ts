import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { calculateSM2 } from '@/lib/services/sm2';
import type { SM2Quality } from '@/lib/services/sm2';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId, cardIndex, quality } = await req.json();

    if (
      typeof contentId !== 'string' ||
      typeof cardIndex !== 'number' ||
      ![1, 2, 4, 5].includes(quality)
    ) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Get existing progress or use defaults
    const existing = await prisma.flashcardProgress.findUnique({
      where: {
        userId_contentId_cardIndex: {
          userId: session.user.id,
          contentId,
          cardIndex,
        },
      },
    });

    const currentCard = {
      easeFactor: existing?.easeFactor ?? 2.5,
      interval: existing?.interval ?? 0,
      repetitions: existing?.repetitions ?? 0,
    };

    const result = calculateSM2(currentCard, quality as SM2Quality);

    const progress = await prisma.flashcardProgress.upsert({
      where: {
        userId_contentId_cardIndex: {
          userId: session.user.id,
          contentId,
          cardIndex,
        },
      },
      create: {
        userId: session.user.id,
        contentId,
        cardIndex,
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        dueDate: result.dueDate,
        lastReviewed: new Date(),
      },
      update: {
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        dueDate: result.dueDate,
        lastReviewed: new Date(),
      },
    });

    return NextResponse.json({ progress, nextDueDate: result.dueDate });
  } catch (error) {
    console.error('Flashcard review error:', error);
    return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
  }
}
