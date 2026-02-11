import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const likeSchema = z.object({
  commentId: z.string(),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { commentId } = likeSchema.parse(body);

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user already liked this comment
    const existingLike = await prisma.commentLike.findFirst({
      where: {
        userId: session.user.id,
        commentId,
      },
    });


    if (existingLike) {
      // Unlike - remove the like
      await prisma.commentLike.delete({
        where: { id: existingLike.id }, // ✅ Delete by id
      });

      // Decrement like count
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          likes: {
            decrement: 1,
          },
        },
      });

      console.log('👎 Comment unliked:', commentId);

      return NextResponse.json({
        success: true,
        liked: false,
        likes: updatedComment.likes,
      });
    } else {
      // Like - add the like
      await prisma.commentLike.create({
        data: {
          userId: session.user.id,
          commentId,
        },
      });

      // Increment like count
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          likes: {
            increment: 1,
          },
        },
      });

      console.log('👍 Comment liked:', commentId);

      return NextResponse.json({
        success: true,
        liked: true,
        likes: updatedComment.likes,
      });
    }
  } catch (error: any) {
    console.error('❌ Like comment error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to like comment' },
      { status: 500 }
    );
  }
}