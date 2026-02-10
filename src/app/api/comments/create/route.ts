import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

const commentSchema = z.object({
  sharedContentId: z.string(),
  text: z.string().min(1).max(1000),
  parentId: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sharedContentId, text, parentId } = commentSchema.parse(body);

    // ✅ Verify shared content exists BEFORE creating comment
    const sharedContent = await prisma.sharedContent.findUnique({
      where: { id: sharedContentId },
    });

    if (!sharedContent) {
      console.error('❌ Shared content not found:', sharedContentId);
      return NextResponse.json(
        { error: 'Shared content not found' },
        { status: 404 }
      );
    }

    // ✅ If parentId provided, verify parent comment exists
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
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        sharedContentId,
        userId: session.user.id,
        text,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    console.error('Comment creation error:', error);
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid shared content or parent comment ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}