import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { learningLevel } = body;

    // Mark onboarding as done — will never show again for this user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingDone: true },
    });

    // Optionally save the learning level they picked
    if (learningLevel) {
      await prisma.userPreferences.upsert({
        where: { userId: session.user.id },
        update: { learningLevel },
        create: {
          userId: session.user.id,
          learningLevel,
          preferredVoice: 'professional',
          autoAudio: false,
          theme: 'light',
        },
      });
    }

    console.log('✅ Onboarding complete for user:', session.user.id);
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('❌ Onboarding complete error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}