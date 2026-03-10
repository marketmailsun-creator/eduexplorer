import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateContentForQuery } from '@/lib/services/content.service';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { queryId } = body;

    if (!queryId || typeof queryId !== 'string') {
      return NextResponse.json({ error: 'queryId is required' }, { status: 400 });
    }

    // Verify ownership
    const query = await prisma.query.findUnique({
      where: { id: queryId },
      select: { userId: true },
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    if (query.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Idempotency: if article already exists, return early
    const existing = await prisma.content.findFirst({
      where: { queryId, contentType: 'article' },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ success: true, message: 'Article already exists' });
    }

    await generateContentForQuery(queryId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Article generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate article';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
