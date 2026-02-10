import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db/prisma';

const groupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean().default(false),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('📝 Creating group:', body);

    const { name, description, isPublic } = groupSchema.parse(body);

    // Generate unique invite code
    const inviteCode = nanoid(10).toUpperCase();

    // Create group with creator as admin member
    const group = await prisma.studyGroup.create({
      data: {
        name,
        description: description || null,
        isPublic,
        inviteCode,
        creatorId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: 'admin',
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    console.log('✅ Group created successfully:', {
      id: group.id,
      name: group.name,
      inviteCode: group.inviteCode,
    });

    return NextResponse.json({
      success: true,
      group,
      message: 'Group created successfully',
    });
  } catch (error: any) {
    console.error('❌ Group creation error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    if (error.code === 'P2002') {
      // Unique constraint (unlikely with nanoid)
      return NextResponse.json(
        { error: 'Invite code conflict, please try again' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create group', details: error.message },
      { status: 500 }
    );
  }
}