// ============================================================
// FILE: src/app/api/content/quiz/generate/route.ts  — REPLACE EXISTING
// Changes:
//   • Accepts `regenerate: true` to force a new quiz set
//   • Passes `previousQuestions` to AI so it doesn't repeat them
//   • Creates multiple quiz records (quizSet 1, 2, 3…) instead of
//     blocking if one already exists
//   • Returns all quiz sets so the client can pick the latest
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { generateTopicQuiz } from '@/lib/services/practice-questions-generator';
import { canGenerateContent } from '@/lib/services/plan-limits.service';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const quizSchema = z.object({
  queryId: z.string(),
  numQuestions: z.number().optional().default(10),
  regenerate: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { queryId, numQuestions, regenerate } = quizSchema.parse(body);

    // Get the query
    const query = await prisma.query.findUnique({
      where: { id: queryId },
      select: { id: true, userId: true, queryText: true, topicDetected: true, complexityLevel: true },
    });

    if (!query || query.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Fetch all existing quiz sets for this query
    const existingQuizzes = await prisma.content.findMany({
      where: { queryId, contentType: 'quiz' },
      orderBy: { generatedAt: 'asc' },
    });

    // If not regenerating and a quiz already exists, return the latest
    if (!regenerate && existingQuizzes.length > 0) {
      const latest = existingQuizzes[existingQuizzes.length - 1];
      return NextResponse.json({
        success: true,
        quizId: latest.id,
        setNumber: existingQuizzes.length,
        totalSets: existingQuizzes.length,
        cached: true,
      });
    }

    // Check plan limits for regeneration
    const canGenerate = await canGenerateContent(session.user.id, queryId, 'quiz');
    if (!canGenerate.allowed) {
      return NextResponse.json(
        { error: canGenerate.reason, current: canGenerate.current, limit: canGenerate.limit },
        { status: 403 }
      );
    }

    // Collect all previous question texts to avoid repeats
    const previousQuestions: string[] = existingQuizzes.flatMap(q => {
      const data = q.data as any;
      return (data?.quiz?.questions ?? []).map((question: any) => question.question as string);
    });

    const setNumber = existingQuizzes.length + 1;

    // Generate quiz — use article content as reference for image/document queries
    // (topicDetected is only set for image/document queries via hybrid parser)
    const effectiveTopic = query.topicDetected || query.queryText;
    let referenceContent: string | undefined;
    if (query.topicDetected) {
      const articleContent = await prisma.content.findFirst({
        where: { queryId, contentType: 'article' },
        select: { data: true },
      });
      const articleText = (articleContent?.data as any)?.text as string | undefined;
      if (articleText && articleText.length > 100) {
        referenceContent = articleText;
      }
    }

    const quiz = await generateTopicQuiz(
      effectiveTopic,
      numQuestions,
      query.complexityLevel || 'college',
      previousQuestions,
      setNumber,
      referenceContent,
    );

    // Save as a new quiz set
    const quizContent = await prisma.content.create({
      data: {
        queryId,
        contentType: 'quiz',
        title: `${effectiveTopic} - Quiz Set ${setNumber}`,
        data: {
          status: 'completed',
          setNumber,
          quiz: quiz as unknown as Prisma.InputJsonValue,
        } as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      success: true,
      quizId: quizContent.id,
      setNumber,
      totalSets: setNumber,
      questionCount: quiz.questions.length,
      cached: false,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('❌ Quiz generation error:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
