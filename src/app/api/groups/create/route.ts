import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const groupSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isPublic } = groupSchema.parse(body);

    const inviteCode = nanoid(8).toUpperCase();

    const group = await prisma.studyGroup.create({
      data: {
        name,
        description,
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
          select: { name: true, image: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error('Group creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}