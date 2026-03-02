import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📜 Fetching history for user:', session.user.id);

    // Fetch user's queries ordered by most recent
    const queries = await prisma.query.findMany({
      where: {
        userId: session.user.id,
        status: 'completed',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent
      select: {
        id: true,
        queryText: true,
        topicDetected: true,
        createdAt: true,
        status: true,
      },
    });

    console.log('✅ Found', queries.length, 'queries');

    return NextResponse.json({
      success: true,
      queries,
    });
  } catch (error) {
    console.error('❌ History fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
