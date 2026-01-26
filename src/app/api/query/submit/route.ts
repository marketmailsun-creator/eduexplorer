import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { processResearchQuery } from '@/lib/services/research.service';
import { generateContentForQuery } from '@/lib/services/content.service';
import { z } from 'zod';

const querySchema = z.object({
  query: z.string().min(3).max(500),
  learningLevel: z.enum(['elementary', 'high-school', 'college', 'adult']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { query, learningLevel = 'college' } = querySchema.parse(body);

    const result = await processResearchQuery(session.user.id, query, learningLevel);

    generateContentForQuery(result.queryId).catch(console.error);

    return NextResponse.json({
      success: true,
      queryId: result.queryId,
      content: result.content,
      sources: result.sources,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Query submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}