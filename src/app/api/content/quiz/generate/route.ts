import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { generatePracticeQuestions } from '@/lib/services/practice-questions-generator';
import { canGenerateContent } from '@/lib/services/plan-limits.service';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const quizSchema = z.object({
  queryId: z.string(),
  numQuestions: z.number().optional().default(10),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { queryId, numQuestions } = quizSchema.parse(body);

    console.log('🎯 Quiz API called for query:', queryId);

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

    // Check if quiz already exists
    const existingQuiz = await prisma.content.findFirst({
      where: {
        queryId,
        contentType: 'quiz',
      },
    });

    if (existingQuiz) {
      console.log('✅ Quiz already exists');
      return NextResponse.json({
        success: true,
        quizId: existingQuiz.id,
        cached: true,
      });
    }

    // Check plan limits
    const canGenerate = await canGenerateContent(
      session.user.id,
      queryId,
      'quiz'
    );

    if (!canGenerate.allowed) {
      return NextResponse.json(
        {
          error: canGenerate.reason,
          current: canGenerate.current,
          limit: canGenerate.limit,
        },
        { status: 403 }
      );
    }

    // Get article content
    const articleContent = query.content[0];
    if (!articleContent) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const articleText = (articleContent.data as any)?.text || '';
    if (!articleText) {
      return NextResponse.json({ error: 'No article text available' }, { status: 400 });
    }

    console.log('✅ Found article:', articleText.length, 'characters');

    // Generate quiz
    console.log(`🎯 Generating ${numQuestions} questions...`);
    const quiz = await generatePracticeQuestions(
      query.queryText,
      articleText,
      numQuestions,
      query.complexityLevel || 'college'
    );

    console.log(`✅ Quiz generated: ${quiz.questions.length} questions`);

    // Save to database
    const quizContent = await prisma.content.create({
      data: {
        queryId,
        contentType: 'quiz',
        title: `${query.queryText} - Practice Quiz`,
        data: {
          status: 'completed',
          quiz: quiz as unknown as Prisma.InputJsonValue,
        } as Prisma.InputJsonValue,
      },
    });

    console.log('💾 Quiz saved to database');

    return NextResponse.json({
      success: true,
      quizId: quizContent.id,
      questionCount: quiz.questions.length,
      cached: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('❌ Quiz generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}