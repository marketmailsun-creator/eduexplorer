import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Fetch completed queries from last 365 days
    const queries = await prisma.query.findMany({
      where: {
        userId: session.user.id,
        status: 'completed',
        createdAt: { gte: oneYearAgo },
      },
      select: { createdAt: true },
    });

    // Group by date string (YYYY-MM-DD)
    const countsByDate: Record<string, number> = {};
    for (const q of queries) {
      const dateStr = q.createdAt.toISOString().slice(0, 10);
      countsByDate[dateStr] = (countsByDate[dateStr] ?? 0) + 1;
    }

    const data = Object.entries(countsByDate).map(([date, count]) => ({ date, count }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Activity heatmap error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
