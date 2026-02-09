import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    const { queryId } = await params;
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';

    // Calculate date filter
    let dateFilter: Date | undefined;
    const now = new Date();

    if (filter === 'today') {
      dateFilter = new Date(now.setHours(0, 0, 0, 0));
    } else if (filter === 'week') {
      dateFilter = new Date(now.setDate(now.getDate() - 7));
    }

    // Fetch quiz scores
    const scores = await prisma.quizScore.findMany({
      where: {
        queryId,
        ...(dateFilter && {
          completedAt: {
            gte: dateFilter,
          },
        }),
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        {
          score: 'desc',
        },
        {
          timeSpent: 'asc',
        },
      ],
      take: 10, // Top 10 scores
    });

    return NextResponse.json({ scores });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
