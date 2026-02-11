import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    // Verify group exists and user is the creator
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        creatorId: true,
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Only creator can delete the group
    if (group.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the group creator can delete this group' },
        { status: 403 }
      );
    }

    // Delete the group (cascade will delete members and shared content)
    await prisma.studyGroup.delete({
      where: { id: groupId },
    });

    console.log('✅ Group deleted:', {
      groupId,
      groupName: group.name,
      deletedBy: session.user.id,
    });

    revalidatePath('/groups');
    revalidatePath(`/groups/${groupId}`);
    revalidatePath('/groups', 'layout'); 

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ Delete group error:', error);
    return NextResponse.json(
      { error: 'Failed to delete group', details: error.message },
      { status: 500 }
    );
  }
}