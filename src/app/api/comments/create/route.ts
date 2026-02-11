import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const commentSchema = z.object({
  sharedContentId: z.string().optional(), // Make optional
  contentId: z.string().optional(), // Accept contentId as alternative
  queryId: z.string().optional(), // Accept queryId as alternative
  text: z.string().min(1, 'Comment cannot be empty'),
  parentId: z.string().optional().nullable(),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('📝 Comment creation request:', body);

    const { sharedContentId, contentId, queryId, text, parentId } = commentSchema.parse(body);

    let finalSharedContentId = sharedContentId;

    // ✨ If no sharedContentId but have contentId or queryId, create or find shared content
    if (!finalSharedContentId && (contentId || queryId)) {
      console.log('🔍 Looking for or creating shared content...');

      // Determine the queryId
      let targetQueryId = queryId;
      
      if (!targetQueryId && contentId) {
        // Get queryId from contentId
        const content = await prisma.content.findUnique({
          where: { id: contentId },
          select: { queryId: true },
        });
        
        if (!content) {
          return NextResponse.json(
            { error: 'Content not found' },
            { status: 404 }
          );
        }
        
        targetQueryId = content.queryId;
      }

      if (!targetQueryId) {
        return NextResponse.json(
          { error: 'Missing required identifiers' },
          { status: 400 }
        );
      }

      // Find or create shared content
      let sharedContent = await prisma.sharedContent.findFirst({
        where: {
          queryId: targetQueryId,
          userId: session.user.id,
        },
      });

      if (!sharedContent) {
        console.log('✨ Creating new shared content record...');
        sharedContent = await prisma.sharedContent.create({
          data: {
            queryId: targetQueryId,
            userId: session.user.id,
            shareType: 'public',
            shareToken: nanoid(10),
          },
        });
      }

      finalSharedContentId = sharedContent.id;
      console.log('✅ Using shared content:', finalSharedContentId);
    }

    // Verify shared content exists
    if (!finalSharedContentId) {
      return NextResponse.json(
        { error: 'Missing sharedContentId' },
        { status: 400 }
      );
    }

    const sharedContent = await prisma.sharedContent.findUnique({
      where: { id: finalSharedContentId },
    });

    if (!sharedContent) {
      console.error('❌ Shared content not found:', finalSharedContentId);
      return NextResponse.json(
        { error: 'Shared content not found' },
        { status: 404 }
      );
    }

    // Verify parent comment if provided
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }

      if (parentComment.sharedContentId !== finalSharedContentId) {
        return NextResponse.json(
          { error: 'Invalid parent comment' },
          { status: 400 }
        );
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        sharedContentId: finalSharedContentId,
        userId: session.user.id,
        text,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    console.log('✅ Comment created:', {
      id: comment.id,
      userId: session.user.id,
      isReply: !!parentId,
    });

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error: any) {
    console.error('❌ Comment creation error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}