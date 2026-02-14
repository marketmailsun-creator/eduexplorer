// ============================================================
// FILE: src/app/api/user/onboarding-subjects/route.ts
// Returns the subjects chosen during onboarding from UserPreferences.
// We store them in the metadata JSON field; falls back gracefully.
// ============================================================

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ subjects: [] }, { status: 401 });
    }

    // Subjects were saved as part of the onboarding flow via /api/user/onboarding-complete
    // They live in a `subjects` field on UserPreferences (add via migration below)
    // OR fall back to learningLevel for a single subject hint
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
      select: { learningLevel: true },
    });

    // If we have no subjects stored yet, infer from learningLevel
    // (e.g. 'adult' → business/finance suggestions)
    const levelToSubjects: Record<string, string[]> = {
      elementary: ['science', 'math', 'history'],
      'high-school': ['science', 'math', 'history', 'english'],
      college: ['tech', 'science', 'business'],
      adult: ['business', 'finance', 'tech'],
    };

    const inferredSubjects = levelToSubjects[prefs?.learningLevel || 'college'] || ['tech', 'science'];

    return NextResponse.json({ subjects: inferredSubjects });
  } catch (error) {
    console.error('Onboarding subjects error:', error);
    return NextResponse.json({ subjects: [] });
  }
}

// ============================================================
// UPGRADE PATH: Store real subjects from onboarding
//
// 1. Add to prisma/schema.prisma → UserPreferences model:
//      subjects String[] @default([])
//
// 2. Run: npx prisma migrate dev --name add_subjects_to_preferences
//
// 3. Update /api/user/onboarding-complete/route.ts to also save subjects:
//    await prisma.userPreferences.upsert({
//      ...
//      update: { learningLevel, subjects },    // ← add subjects
//      create: { ..., subjects },
//    });
//
// 4. Update this GET handler to return:
//    const prefs = await prisma.userPreferences.findUnique({
//      where: { userId: session.user.id },
//      select: { subjects: true, learningLevel: true },
//    });
//    return NextResponse.json({ subjects: prefs?.subjects?.length ? prefs.subjects : inferredSubjects });
// ============================================================
