// ============================================================
// FILE: src/app/api/auth/verify-email/route.ts  — NEW FILE
// Called when user clicks the verification link in their email.
// Marks emailVerified = now, clears the token, sends welcome email.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendWelcomeEmail } from '@/lib/services/email.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/login?error=missing_token', req.url)
      );
    }

    // Find the user with this token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() }, // not expired
        emailVerified: null, // not already verified
      },
    });

    if (!user) {
      // Token invalid or expired — redirect with error
      return NextResponse.redirect(
        new URL('/login?error=invalid_token', req.url)
      );
    }

    // Mark as verified and clear the token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email!, user.name || '').catch((err) => {
      console.error('❌ Failed to send welcome email:', err);
    });

    console.log('✅ Email verified for user:', user.email);

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL('/login?verified=true', req.url)
    );
  } catch (error) {
    console.error('❌ Email verification error:', error);
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', req.url)
    );
  }
}
