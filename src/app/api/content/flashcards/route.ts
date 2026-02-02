import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { generateFlashcards } from '@/lib/services/flashcard-generator';
import { z } from 'zod';

const flashcardsSchema = z.object({
  queryId: z.string(),
  cardCount: z.number().optional().default(15),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { queryId, cardCount } = flashcardsSchema.parse(body);

    console.log('🎴 Flashcards API called for query:', queryId);

    // Get the query and article content
    const query = await prisma.query.findUnique({
      where: { id: queryId },
      include: {
        content: {
          where: { contentType: 'article' },
        },
      },
    });

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    if (query.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const articleContent = query.content[0];
    if (!articleContent) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const articleText = (articleContent.data as any)?.text || '';
    if (!articleText) {
      return NextResponse.json({ error: 'No article text available' }, { status: 400 });
    }

    console.log('✅ Found article:', articleText.length, 'characters');

    // Generate flashcards
    const result = await generateFlashcards(queryId, articleText, {
      cardCount,
      level: query.complexityLevel || 'college',
    });

    return NextResponse.json({
      success: true,
      deckId: result.deckId,
      cardCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('❌ Flashcard generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate flashcards' },
      { status: 500 }
    );
  }
}
