import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { generatePresentation, generateFallbackPresentation } from '@/lib/services/presentation-generator';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const presentationSchema = z.object({
  queryId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { queryId } = presentationSchema.parse(body);

    console.log('📊 Presentation API called for query:', queryId);

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

    // Generate presentation
    let presentation;
    try {
      presentation = await generatePresentation(
        query.queryText,
        articleText,
        query.complexityLevel || 'college'
      );
    } catch (error) {
      console.warn('⚠️ Gemini generation failed, using fallback');
      presentation = generateFallbackPresentation(
        query.queryText,
        articleText,
        query.complexityLevel || 'college'
      );
    }

    // Save to database
    const presentationContent = await prisma.content.create({
      data: {
        queryId,
        contentType: 'presentation',
        title: `${query.queryText} - Presentation`,
        data: {
          status: 'completed',
          presentation: (presentation as unknown) as Prisma.InputJsonValue,
        } as Prisma.InputJsonValue,
      },
    });

    console.log('✅ Presentation saved to database');

    return NextResponse.json({
      success: true,
      presentationId: presentationContent.id,
      slideCount: presentation.totalSlides,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('❌ Presentation generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate presentation' },
      { status: 500 }
    );
  }
}
