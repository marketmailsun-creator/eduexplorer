// src/app/api/auth/phone/verify-otp/route.ts — CREATE NEW
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyOtp } from '@/lib/services/msg91.service';
import { sendWelcomeWhatsApp } from '@/lib/services/msg91.service';
import { encode } from 'next-auth/jwt';
import { z } from 'zod';

const schema = z.object({
  phone: z.string(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['login', 'signup']),
  name: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp, purpose, name } = schema.parse(body);

    const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    // ── Find the pending OTP record ───────────────────────────
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phone: normalizedPhone,
        purpose,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'OTP expired or not found. Please request a new one.' },
        { status: 400 }
      );
    }

    // ── Check attempt limit ───────────────────────────────────
    if (otpRecord.attempts >= 5) {
      await prisma.otpVerification.delete({ where: { id: otpRecord.id } });
      return NextResponse.json(
        { error: 'Too many wrong attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // ── Verify OTP with MSG91 ─────────────────────────────────
    const result = await verifyOtp(normalizedPhone, otp);

    if (!result.success) {
      // Increment attempt counter
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { error: result.error || 'Invalid OTP' },
        { status: 400 }
      );
    }

    // ── OTP verified — create or fetch user ───────────────────
    let user = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
    });

    if (purpose === 'signup') {
      if (user) {
        return NextResponse.json(
          { error: 'Account already exists. Please log in.' },
          { status: 409 }
        );
      }
      // Create new user
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          email: `${normalizedPhone.replace(/\+/g, '')}@phone.eduexplorer.ai`, // placeholder
          name: name?.trim() || 'User',
          phoneVerified: new Date(),
          plan: 'free',
          whatsappOptIn: true,
        },
      });
      // Create default preferences
      await prisma.userPreferences.create({
        data: {
          userId: user.id,
          learningLevel: 'college',
          preferredVoice: 'professional',
          autoAudio: false,
          theme: 'light',
        },
      });
      // Welcome WhatsApp message (non-blocking)
      sendWelcomeWhatsApp({
        phone: normalizedPhone,
        name: user.name || 'there',
      }).catch(console.error);
    } else {
      // Login
      if (!user) {
        return NextResponse.json(
          { error: 'Account not found. Please sign up.' },
          { status: 404 }
        );
      }
      // Update phoneVerified timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: new Date() },
      });
    }

    // ── Clean up used OTP records ─────────────────────────────
    await prisma.otpVerification.deleteMany({
      where: { phone: normalizedPhone },
    });

    // ── Create JWT session token ──────────────────────────────
    const secret = process.env.NEXTAUTH_SECRET!;
    const token = await encode({
      token: {
        sub:   user.id,
        id:    user.id,
        name:  user.name,
        phone: user.phone,
        plan:  user.plan,
        iat:   Math.floor(Date.now() / 1000),
        exp:   Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      },
      secret,
      salt: 'authjs.session-token',
      maxAge: 30 * 24 * 60 * 60,
    });

    // ── Set session cookie (same name NextAuth uses) ──────────
    const isProd = process.env.NODE_ENV === 'production';
    const cookieName = isProd
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    const response = NextResponse.json({
      success: true,
      user: {
        id:    user.id,
        name:  user.name,
        phone: user.phone,
        plan:  user.plan,
      },
    });

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure:   isProd,
      sameSite: 'lax',
      path:     '/',
      maxAge:   30 * 24 * 60 * 60,
    });

    return response;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}