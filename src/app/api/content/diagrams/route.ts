import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { generateDiagrams } from '@/lib/services/diagram-generator';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const diagramSchema = z.object({
  queryId: z.string(),
  count: z.number().optional().default(3),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { queryId, count } = diagramSchema.parse(body);

    console.log('📊 Diagrams API called for query:', queryId);

    // Check if diagrams already exist
    const existingDiagrams = await prisma.content.findFirst({
      where: {
        queryId,
        contentType: 'diagrams',
      },
    });

    if (existingDiagrams) {
      console.log('✅ Diagrams already exist, returning cached version');
      return NextResponse.json({
        success: true,
        diagramsId: existingDiagrams.id,
        cached: true,
      });
    }

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

    // Generate diagrams
    const diagrams = await generateDiagrams(query.queryText, articleText, count);

    // Save to database
    const diagramContent = await prisma.content.create({
      data: {
        queryId,
        contentType: 'diagrams',
        title: `${query.queryText} - Diagrams`,
        data: {
          status: 'completed',
          diagrams: (diagrams as unknown) as Prisma.InputJsonValue,
        } as Prisma.InputJsonValue,
      },
    });

    console.log('✅ Diagrams saved to database');

    return NextResponse.json({
      success: true,
      diagramsId: diagramContent.id,
      diagramCount: diagrams.length,
      cached: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('❌ Diagram generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate diagrams' },
      { status: 500 }
    );
  }
}
