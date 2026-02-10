import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch public groups that user is not already a member of
    const groups = await prisma.studyGroup.findMany({
      where: {
        isPublic: true,
        members: {
          none: {
            userId: session.user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    const formattedGroups = groups.map((group: any) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      memberCount: group._count.members,
    }));

    return NextResponse.json({ success: true, groups: formattedGroups });
  } catch (error) {
    console.error('❌ Fetch public groups error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public groups' },
      { status: 500 }
    );
  }
}