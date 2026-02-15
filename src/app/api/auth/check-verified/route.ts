// ============================================================
// FILE: src/app/api/auth/check-verified/route.ts  — NEW FILE
// Called before credentials login to check if email is verified.
// Returns needsVerification: true if unverified, false otherwise.
// Does NOT reveal if the user exists (security).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        emailVerified: true,
        password: true, // only check credentials users
      },
    });

    // Google/OAuth users always have emailVerified set automatically
    // Only block credentials (password) users who haven't verified
    if (user && user.password && !user.emailVerified) {
      return NextResponse.json({ needsVerification: true });
    }

    return NextResponse.json({ needsVerification: false });
  } catch {
    // On error, don't block login
    return NextResponse.json({ needsVerification: false });
  }
}
