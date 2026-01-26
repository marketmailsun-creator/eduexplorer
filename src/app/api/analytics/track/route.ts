import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const analyticsSchema = z.object({
  contentId: z.string().optional(),
  queryId: z.string().optional(),
  timeSpent: z.number(),
  completionPercentage: z.number().min(0).max(100).optional(),
  feedbackRating: z.number().min(1).max(5).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = analyticsSchema.parse(body);

    const analytics = await prisma.learningAnalytics.create({
      data: {
        userId: session.user.id,
        ...data,
      },
    });

    return NextResponse.json({ success: true, analytics });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Track analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}