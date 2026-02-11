import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get('queryId');

    if (!queryId) {
      return NextResponse.json(
        { error: 'queryId is required' },
        { status: 400 }
      );
    }

    // Find SharedContent for this query
    const sharedContents = await prisma.sharedContent.findMany({
      where: { queryId },
      select: { id: true },
    });

    const sharedContentIds = sharedContents.map((sc) => sc.id);

    if (sharedContentIds.length === 0) {
      return NextResponse.json({ success: true, comments: [] });
    }

    // Fetch comments
    const comments = await prisma.comment.findMany({
      where: {
        sharedContentId: { in: sharedContentIds },
        parentId: null,
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
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            likedBy: session?.user?.id
              ? {
                  where: { userId: session.user.id },
                }
              : false,
          },
          orderBy: { createdAt: 'asc' },
        },
        likedBy: session?.user?.id
          ? {
              where: { userId: session.user.id },
            }
          : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add isLiked flag to each comment
    const commentsWithLikes = comments.map((comment) => ({
      ...comment,
      isLiked: comment.likedBy.length > 0,
      likedBy: undefined, // Remove the array, just use the boolean
      replies: comment.replies.map((reply) => ({
        ...reply,
        isLiked: reply.likedBy.length > 0,
        likedBy: undefined,
      })),
    }));

    return NextResponse.json({
      success: true,
      comments: commentsWithLikes,
    });
  } catch (error) {
    console.error('❌ Fetch comments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}