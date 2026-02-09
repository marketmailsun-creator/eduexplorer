import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId, shareType } = await req.json();

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
    }

    // Check if content exists (query or content)
    const query = await prisma.query.findUnique({
      where: { id: contentId },
    });

    if (!query) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Generate random 10-character token
    const shareToken = Math.random().toString(36).substring(2, 12).toUpperCase();

    // Create shared content
    const sharedContent = await prisma.sharedContent.create({
      data: {
        queryId: contentId,  // ← Changed from contentId
        userId: session.user.id,
        shareType: shareType || 'public',
        shareToken,
      },
    });

    const shareUrl = `${process.env.NEXTAUTH_URL}/shared/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareToken,
      shareUrl,
      sharedContent,
    });
  } catch (error) {
    console.error('Share creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}