import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await context.params;
    
    const query = await prisma.query.findUnique({
      where: { id },
      include: {
        researchData: true,
        content: true,
      },
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    if (query.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(query);
  } catch (error) {
    console.error('Get query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch query' },
      { status: 500 }
    );
  }
}

// DELETE: Remove query from history
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    console.log('🗑️ Delete request for query:', id);

    // Verify ownership before deleting
    const query = await prisma.query.findUnique({
      where: { id },
      select: { userId: true, queryText: true },
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    if (query.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete query (cascade will delete all related content, research data, etc.)
    await prisma.query.delete({
      where: { id },
    });

    console.log('✅ Query deleted successfully:', query.queryText);

    return NextResponse.json({ 
      success: true,
      message: 'Query deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete query error:', error);
    return NextResponse.json(
      { error: 'Failed to delete query' },
      { status: 500 }
    );
  }
}
