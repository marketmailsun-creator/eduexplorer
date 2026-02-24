import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizePhone, verifyOtp } from '@/lib/services/otp.service';
import { prisma } from '@/lib/db/prisma';

const verifyOtpSchema = z.object({
  phone: z.string().min(1),
  code: z.string().length(6),
});

// This endpoint is used by the UI to pre-validate an OTP before calling
// signIn('phone-otp', ...). The actual user creation / session creation
// happens inside the NextAuth CredentialsProvider authorize function.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code } = verifyOtpSchema.parse(body);

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const result = await verifyOtp(normalizedPhone, code);

    if (!result.success) {
      const messages: Record<string, string> = {
        wrong: 'Incorrect OTP. Please check the code and try again.',
        expired: 'OTP has expired. Please request a new one.',
        max_attempts: 'Too many incorrect attempts. Please request a new OTP.',
      };
      return NextResponse.json(
        { error: messages[result.reason ?? 'wrong'] ?? 'Invalid OTP', reason: result.reason },
        { status: 400 }
      );
    }

    // Check if a user with this phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      isNewUser: !existingUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    console.error('[verify-otp] Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
