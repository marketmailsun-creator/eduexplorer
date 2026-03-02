import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ similar: [] });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  if (q.length < 3) return NextResponse.json({ similar: [] });

  // 1. User's own completed queries with case-insensitive substring match
  const ownQueries = await prisma.query.findMany({
    where: {
      userId: session.user.id,
      status: 'completed',
      queryText: { contains: q, mode: 'insensitive' },
    },
    select: { id: true, queryText: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  // 2. Publicly shared content on similar topics (from other users)
  const publicShares = await prisma.sharedContent.findMany({
    where: {
      shareType: 'public',
      query: {
        queryText: { contains: q, mode: 'insensitive' },
        status: 'completed',
        userId: { not: session.user.id },
      },
    },
    select: {
      queryId: true,
      query: { select: { id: true, queryText: true } },
      views: true,
    },
    orderBy: { views: 'desc' },
    take: 3,
    distinct: ['queryId'],
  });

  const similar = [
    ...ownQueries.map((item) => ({
      type: 'own' as const,
      id: item.id,
      queryText: item.queryText,
    })),
    ...publicShares.map((s) => ({
      type: 'public' as const,
      id: s.query.id,
      queryText: s.query.queryText,
    })),
  ];

  return NextResponse.json({ similar });
}
