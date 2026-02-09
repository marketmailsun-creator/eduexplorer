import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { queryId } = await req.json();

    if (!queryId) {
      return NextResponse.json({ error: 'Query ID required' }, { status: 400 });
    }

    // Check if query exists
    const query = await prisma.query.findUnique({
      where: { id: queryId },
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    // Check if already saved
    const existing = await prisma.savedQuery.findUnique({
      where: {
        userId_queryId: {
          userId: session.user.id,
          queryId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Already saved', isSaved: true });
    }

    // Save query
    await prisma.savedQuery.create({
      data: {
        userId: session.user.id,
        queryId,
      },
    });

    console.log('✅ Query saved:', queryId);

    return NextResponse.json({ 
      success: true, 
      message: 'Query saved to library',
      isSaved: true 
    });
  } catch (error) {
    console.error('❌ Save error:', error);
    return NextResponse.json(
      { error: 'Failed to save query' },
      { status: 500 }
    );
  }
}