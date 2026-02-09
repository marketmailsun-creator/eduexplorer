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

    await prisma.savedQuery.deleteMany({
      where: {
        userId: session.user.id,
        queryId,
      },
    });

    console.log('🗑️ Query unsaved:', queryId);

    return NextResponse.json({ 
      success: true, 
      message: 'Removed from library',
      isSaved: false 
    });
  } catch (error) {
    console.error('❌ Unsave error:', error);
    return NextResponse.json(
      { error: 'Failed to unsave query' },
      { status: 500 }
    );
  }
}