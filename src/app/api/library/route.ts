import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const saveSchema = z.object({
  contentId: z.string(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { contentId, notes, tags } = saveSchema.parse(body);

    const savedContent = await prisma.savedContent.create({
      data: {
        userId: session.user.id,
        contentId,
        notes: notes || null,
        tags: tags || [],
      },
    });

    return NextResponse.json({ success: true, savedContent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Save content error:', error);
    return NextResponse.json(
      { error: 'Failed to save content' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const savedContent = await prisma.savedContent.findMany({
      where: { userId: session.user.id },
      include: { content: true },
      orderBy: { savedAt: 'desc' },
    });

    return NextResponse.json({ savedContent });
  } catch (error) {
    console.error('Get library error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch library' },
      { status: 500 }
    );
  }
}