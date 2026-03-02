import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { awardXP } from '@/lib/services/xp.service';
import { updateStreak } from '@/lib/services/streak.service';
import { checkAndUnlockAchievements } from '@/lib/services/achievement.service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { queryId, score, totalQuestions, timeSpent } = await req.json();

    // Validate inputs
    if (!queryId || score === undefined || !totalQuestions || !timeSpent) {
      return NextResponse.json(
        { error: 'Missing required fields: queryId, score, totalQuestions, timeSpent' },
        { status: 400 }
      );
    }

    if (score < 0 || score > totalQuestions) {
      return NextResponse.json(
        { error: 'Invalid score value' },
        { status: 400 }
      );
    }

    // Check if query exists
    const query = await prisma.query.findUnique({
      where: { id: queryId },
    });

    if (!query) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      );
    }

    // Save quiz score
    const quizScore = await prisma.quizScore.create({
      data: {
        userId: session.user.id,
        queryId,
        score,
        totalQuestions,
        timeSpent,
      },
    });

    console.log('✅ Quiz score saved:', {
      user: session.user.email,
      score: `${score}/${totalQuestions}`,
      time: `${timeSpent}s`,
    });

    const percentage = Math.round((score / totalQuestions) * 100);

    // Award XP for passing (>= 50%)
    const xpAwarded = percentage >= 50 ? 10 : 0;
    if (xpAwarded > 0) {
      await awardXP(session.user.id, xpAwarded, 'quiz_completion', {
        queryId,
        score,
        totalQuestions,
        percentage,
      });
    }

    // Update streak and check achievements
    await updateStreak(session.user.id);
    const newAchievements = await checkAndUnlockAchievements(session.user.id);

    return NextResponse.json({
      success: true,
      quizScore: {
        id: quizScore.id,
        score: quizScore.score,
        totalQuestions: quizScore.totalQuestions,
        timeSpent: quizScore.timeSpent,
        percentage,
      },
      xpAwarded,
      newAchievements,
    });
  } catch (error) {
    console.error('❌ Submit quiz score error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz score' },
      { status: 500 }
    );
  }
}
