import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateVideoForQuery } from '@/lib/services/video.service';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const videoSchema = z.object({
  queryId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { queryId } = videoSchema.parse(body);

    // Get the article content
    const content = await prisma.content.findFirst({
      where: {
        queryId,
        contentType: 'article',
      },
      include: {
        query: true,
      },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (content.query.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const articleText = (content.data as any)?.text || '';
    if (!articleText) {
      return NextResponse.json({ error: 'No article text found' }, { status: 400 });
    }

    // Generate video
    //const videoJob = await generateVideoForQuery(queryId, articleText);

    // return NextResponse.json({
    //   success: true,
    //   jobId: videoJob.jobId,
    //   status: videoJob.status,
    // });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}
