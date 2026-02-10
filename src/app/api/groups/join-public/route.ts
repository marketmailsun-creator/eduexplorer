import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

const joinSchema = z.object({
  groupId: z.string(),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { groupId } = joinSchema.parse(body);

    // Verify group exists and is public
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    if (!group.isPublic) {
      return NextResponse.json(
        { error: 'This group is private. Use an invite code to join.' },
        { status: 403 }
      );
    }

    // Check if already a member
    if (group.members.length > 0) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      );
    }

    // Add user as member
    await prisma.studyGroupMember.create({
      data: {
        groupId: group.id,
        userId: session.user.id,
        role: 'member',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${group.name}!`,
    });
  } catch (error: any) {
    console.error('❌ Join public group error:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
}