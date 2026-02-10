import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateContentForQuery } from '@/lib/services/content.service';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

const generateSchema = z.object({
  queryId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { queryId } = generateSchema.parse(body);

    // Verify the query belongs to the user
    const query = await prisma.query.findUnique({
      where: { id: queryId },
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    if (query.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate content
    const content = await generateContentForQuery(queryId);

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}