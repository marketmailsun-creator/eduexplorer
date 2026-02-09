import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId } = await req.json();

    await prisma.savedContent.deleteMany({
      where: {
        userId: session.user.id,
        contentId,
      },
    });

    return NextResponse.json({ success: true, message: 'Content unsaved' });
  } catch (error) {
    console.error('Unsave error:', error);
    return NextResponse.json(
      { error: 'Failed to unsave content' },
      { status: 500 }
    );
  }
}