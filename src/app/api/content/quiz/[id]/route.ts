// ============================================================
// FILE: src/app/api/content/quiz/[id]/route.ts
// Returns quiz data for a specific content ID (used after regeneration)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const content = await prisma.content.findUnique({
      where: { id },
      include: { query: { select: { userId: true } } },
    });

    if (!content || content.query.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = content.data as any;
    return NextResponse.json({
      quiz: data?.quiz ?? null,
      setNumber: data?.setNumber ?? 1,
      status: data?.status ?? 'completed',
    });
  } catch (error) {
    console.error('Fetch quiz error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
