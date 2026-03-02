import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { normalizePhone, verifyOtp } from '@/lib/services/otp.service';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { phone, code } = body as { phone?: string; code?: string };

    if (!phone || !code) {
      return NextResponse.json({ error: 'phone and code are required' }, { status: 400 });
    }

    // Normalize to E.164
    const normalized = normalizePhone(phone);
    if (!normalized) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Verify OTP against Redis
    const result = await verifyOtp(normalized, code.trim());
    if (!result.success) {
      const messages: Record<string, string> = {
        expired: 'OTP has expired. Please request a new one.',
        wrong: 'Incorrect OTP. Please try again.',
        max_attempts: 'Too many incorrect attempts. Please request a new OTP.',
      };
      return NextResponse.json(
        { error: messages[result.reason ?? ''] ?? 'OTP verification failed' },
        { status: 400 }
      );
    }

    // Check if phone is already in use by a different user
    const existing = await prisma.user.findUnique({ where: { phone: normalized } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { error: 'This phone number is already associated with another account' },
        { status: 409 }
      );
    }

    // Update user's phone and mark as verified
    await prisma.user.update({
      where: { id: session.user.id },
      data: { phone: normalized, phoneVerified: new Date() },
    });

    return NextResponse.json({ success: true, phone: normalized });
  } catch (error) {
    console.error('Phone update error:', error);
    return NextResponse.json({ error: 'Failed to update phone number' }, { status: 500 });
  }
}
