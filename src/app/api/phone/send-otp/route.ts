// src/app/api/phone/send-otp/route.ts — CREATE NEW
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendOtpWhatsApp } from '@/lib/services/msg91.service';
import { z } from 'zod';

const schema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  purpose: z.enum(['login', 'signup']),
  name: z.string().optional(),  // required for signup
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, purpose, name } = schema.parse(body);

    // Normalize to E.164
    const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    // ── Signup: check phone not already registered ────────────
    if (purpose === 'signup') {
      const existing = await prisma.user.findFirst({
        where: { phone: normalizedPhone },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'This phone number is already registered. Please log in.' },
          { status: 409 }
        );
      }
      if (!name?.trim()) {
        return NextResponse.json(
          { error: 'Name is required for signup' },
          { status: 400 }
        );
      }
    }

    // ── Login: check phone exists ─────────────────────────────
    if (purpose === 'login') {
      const existing = await prisma.user.findFirst({
        where: { phone: normalizedPhone },
      });
      if (!existing) {
        return NextResponse.json(
          { error: 'No account found with this number. Please sign up.' },
          { status: 404 }
        );
      }
    }

    // ── Rate limit: max 3 OTPs per phone per 10 minutes ───────
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentOtps = await prisma.otpVerification.count({
      where: {
        phone: normalizedPhone,
        createdAt: { gte: tenMinutesAgo },
      },
    });
    if (recentOtps >= 3) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait 10 minutes.' },
        { status: 429 }
      );
    }

    // ── Send OTP via MSG91 (WhatsApp first, SMS fallback) ─────
    const result = await sendOtpWhatsApp(normalizedPhone);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send OTP' },
        { status: 500 }
      );
    }

    // ── Store OTP record (MSG91 holds the actual OTP) ─────────
    await prisma.otpVerification.create({
      data: {
        phone: normalizedPhone,
        otp: 'msg91',         // MSG91 manages the OTP value
        reqId: result.reqId,  // needed for verify call
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });

    return NextResponse.json({
      success: true,
      channel: result.channel,
      message: result.channel === 'whatsapp'
        ? 'OTP sent via WhatsApp'
        : 'OTP sent via SMS',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}