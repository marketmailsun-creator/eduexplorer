// ============================================================
// FILE: src/app/api/auth/resend-verification/route.ts  — NEW FILE
// Lets users request a fresh verification email if theirs expired.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { randomBytes } from 'crypto';
import { sendVerificationEmail } from '@/lib/services/email.service';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success — don't reveal whether email exists (security)
    if (!user || user.emailVerified) {
      return NextResponse.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
    }

    // Generate a fresh token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Send email (non-blocking)
    sendVerificationEmail(email, user.name || '', verificationToken).catch((err) => {
      console.error('❌ Failed to resend verification email:', err);
    });

    return NextResponse.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Failed to resend' }, { status: 500 });
  }
}
