import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

const shareSchema = z.object({
  queryId: z.string(),
  contentId: z.string().optional(),
  groupIds: z.array(z.string()).min(1, 'At least one group required'),
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('📤 Share to groups request:', body);

    const { queryId, contentId, groupIds } = shareSchema.parse(body);

    // Verify user has access to the query
    const query = await prisma.query.findFirst({
      where: {
        id: queryId,
        userId: session.user.id,
      },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            contentType: true,
          },
        },
      },
    });

    if (!query) {
      console.error('❌ Query not found:', queryId);
      return NextResponse.json(
        { error: 'Query not found or access denied' },
        { status: 404 }
      );
    }

    console.log('✅ Query found with', query.content.length, 'content items');

    // ✨ Check if query has any content
    if (!query.content || query.content.length === 0) {
      console.error('❌ No content available for query:', queryId);
      return NextResponse.json(
        { 
          error: 'No content available to share',
          message: 'Please generate content for this query first before sharing.'
        },
        { status: 400 }
      );
    }

    // Verify user is member of all selected groups
    const userGroups = await prisma.studyGroupMember.findMany({
      where: {
        userId: session.user.id,
        groupId: {
          in: groupIds,
        },
      },
      select: {
        groupId: true,
      },
    });

    const userGroupIds = userGroups.map((g) => g.groupId);
    const unauthorizedGroups = groupIds.filter((id) => !userGroupIds.includes(id));

    if (unauthorizedGroups.length > 0) {
      console.error('❌ Not member of groups:', unauthorizedGroups);
      return NextResponse.json(
        { error: 'You are not a member of some selected groups' },
        { status: 403 }
      );
    }

    // Create or get shared content
    let sharedContent = await prisma.sharedContent.findFirst({
      where: {
        queryId,
        userId: session.user.id,
        shareType: 'public',
      },
    });

    if (!sharedContent) {
      sharedContent = await prisma.sharedContent.create({
        data: {
          queryId,
          userId: session.user.id,
          shareType: 'public',
          shareToken: nanoid(10),
        },
      });
      console.log('✅ Created new shared content:', sharedContent.shareToken);
    } else {
      console.log('✅ Using existing shared content:', sharedContent.shareToken);
    }

    // Get the content to share
    const contentToShare = contentId
      ? query.content.find((c) => c.id === contentId)
      : query.content[0];

    if (!contentToShare) {
      console.error('❌ Specified content not found');
      return NextResponse.json(
        { error: 'Specified content not found' },
        { status: 404 }
      );
    }

    console.log('📦 Sharing content:', {
      id: contentToShare.id,
      title: contentToShare.title,
      type: contentToShare.contentType,
    });

    // Share to each group (skip if already shared)
    let sharedCount = 0;
    for (const groupId of groupIds) {
      try {
        const existing = await prisma.groupSharedContent.findFirst({
          where: {
            groupId,
            contentId: contentToShare.id,
          },
        });

        if (!existing) {
          await prisma.groupSharedContent.create({
            data: {
              groupId,
              contentId: contentToShare.id,
              userId: session.user.id,
            },
          });
          sharedCount++;
          console.log(`✅ Shared to group: ${groupId}`);
        } else {
          console.log(`⏭️  Already shared to group: ${groupId}`);
        }
      } catch (error) {
        console.error('❌ Error sharing to group:', groupId, error);
      }
    }

    console.log('✅ Share complete:', {
      sharedCount,
      totalGroups: groupIds.length,
      shareToken: sharedContent.shareToken,
    });

    for (const groupId of groupIds) {
    revalidatePath(`/groups/${groupId}`);
    }
    revalidatePath('/groups');

    return NextResponse.json({
      success: true,
      message: `Shared to ${sharedCount} group${sharedCount !== 1 ? 's' : ''}`,
      shareToken: sharedContent.shareToken,
      sharedCount,
      totalGroups: groupIds.length,
    });
  } catch (error: any) {
    console.error('❌ Share to groups error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to share to groups', details: error.message },
      { status: 500 }
    );
  }
}