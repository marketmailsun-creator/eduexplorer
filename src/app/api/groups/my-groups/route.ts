import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📋 Fetching groups for user:', session.user.id);

    // Fetch groups user is a member of
    const groups = await prisma.studyGroup.findMany({
      where: {
        members: {
          some: {
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
        name: 'asc',
      },
    });

    const formattedGroups = groups.map((group: any) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      memberCount: group._count.members,
    }));

    console.log('✅ Found groups:', formattedGroups.length);

    return NextResponse.json(
      { success: true, groups: formattedGroups },
      { headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('❌ Fetch user groups error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}