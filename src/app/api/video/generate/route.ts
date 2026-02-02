import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { generateCustomVideo } from '@/lib/services/remotion-video-service_gemini';

const videoRequestSchema = z.object({
  queryId: z.string(),
});

/**
 * POST /api/video/generate
 * Manually trigger video generation when user requests it
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { queryId } = videoRequestSchema.parse(body);

    console.log('🎬 POST /api/video/generate - queryId:', queryId);

    // Get the query and verify ownership
    const query = await prisma.query.findUnique({
      where: { id: queryId },
      include: {
        content: true,
      },
    });

    if (!query) {
      console.error('❌ Query not found:', queryId);
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    if (query.userId !== session.user.id) {
      console.error('❌ Forbidden - user does not own query');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if video already exists
    const existingVideo = query.content.find(c => c.contentType === 'video');
    
    if (existingVideo) {
      const videoData = existingVideo.data as any;
      console.log('📹 Video exists with status:', videoData?.status);
      
      if (videoData.status === 'completed') {
        console.log('✅ Video already completed');
        return NextResponse.json({
          success: true,
          status: 'already_exists',
          videoUrl: existingVideo.storageUrl,
          message: 'Video already generated',
        });
      }

      if (videoData.status === 'processing') {
        console.log('⏳ Video already processing');
        return NextResponse.json({
          success: true,
          status: 'processing',
          message: 'Video is currently being generated',
        });
      }

      // If failed, allow retry
      if (videoData.status === 'failed') {
        console.log('🔄 Video failed previously, allowing retry');
        // Delete failed video entry
        await prisma.content.delete({
          where: { id: existingVideo.id },
        });
      }
    }

    // Get article content
    const articleContent = query.content.find(c => c.contentType === 'article');
    if (!articleContent) {
      console.error('❌ Article content not found');
      return NextResponse.json(
        { error: 'Article content not found. Please wait for research to complete.' },
        { status: 400 }
      );
    }

    const articleText = (articleContent.data as any)?.text || '';
    if (!articleText) {
      console.error('❌ No article text available');
      return NextResponse.json(
        { error: 'No article text available' },
        { status: 400 }
      );
    }

    // Start video generation (async)
    console.log('🎬 Starting video generation for query:', queryId);
    
    // Generate video asynchronously
    generateCustomVideo(queryId, articleText)
      .then((result) => {
        console.log(`✅ Video generation completed: ${result.videoUrl}`);
      })
      .catch((error) => {
        console.error(`❌ Video generation failed:`, error);
      });

    return NextResponse.json({
      success: true,
      status: 'started',
      message: 'Video generation started. This may take 10-15 minutes.',
      estimatedTime: '10-15 minutes',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('❌ Video generation request error:', error);
    return NextResponse.json(
      { error: 'Failed to start video generation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/video/generate?queryId=xxx
 * Check video generation status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get('queryId');

    if (!queryId) {
      return NextResponse.json(
        { error: 'queryId parameter required' },
        { status: 400 }
      );
    }

    console.log('📹 GET /api/video/generate - checking status for:', queryId);

    // Get video content
    const videoContent = await prisma.content.findFirst({
      where: {
        queryId,
        contentType: 'video',
      },
      include: {
        query: true,
      },
    });

    if (!videoContent) {
      console.log('📹 No video found for query:', queryId);
      return NextResponse.json({
        status: 'not_started',
        message: 'Video has not been generated yet',
      });
    }

    // Verify ownership
    if (videoContent.query.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const videoData = videoContent.data as any;
    const status = videoData?.status || 'unknown';

    console.log('📹 Video status:', status);

    if (status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        videoUrl: videoContent.storageUrl,
        provider: videoData.provider || 'custom',
        message: 'Video is ready',
      });
    }

    if (status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        error: videoData.error || 'Video generation failed',
        message: 'Video generation failed',
      });
    }

    if (status === 'processing') {
      return NextResponse.json({
        status: 'processing',
        message: 'Video is being generated...',
        estimatedTimeRemaining: '5-15 minutes',
      });
    }

    // Unknown status
    console.warn('⚠️ Unknown video status:', status);
    return NextResponse.json({
      status: status || 'unknown',
      message: 'Video status unknown',
    });
  } catch (error) {
    console.error('❌ Check video status error:', error);
    return NextResponse.json(
      { error: 'Failed to check video status' },
      { status: 500 }
    );
  }
}
