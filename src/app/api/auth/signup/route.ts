// ============================================================
// FILE: src/app/api/auth/signup/route.ts  — REPLACE EXISTING
// Changes:
//   - Generates emailVerificationToken on signup
//   - Sends verification email via Resend
//   - User is created but emailVerified stays null until they click link
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { sendVerificationEmail } from '@/lib/services/email.service';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  dob: z.string(),
  plan: z.enum(['free', 'pro']).optional().default('free'),
  phone: z.string().optional(), // E.164 format (+91XXXXXXXXXX), pre-verified by OTP on client
});

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, dob, plan, phone } = signupSchema.parse(body);

    // Validate age (must be 13+)
    const birthDate = new Date(dob);
    const age = calculateAge(birthDate);
    if (age < 13) {
      return NextResponse.json(
        { error: 'You must be at least 13 years old to create an account' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Validate optional phone (must be E.164 Indian format if provided)
    let validatedPhone: string | undefined;
    if (phone) {
      if (!/^\+91[6-9]\d{9}$/.test(phone)) {
        return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
      }
      const phoneExists = await prisma.user.findUnique({ where: { phone } });
      if (phoneExists) {
        return NextResponse.json({ error: 'Phone number already in use' }, { status: 409 });
      }
      validatedPhone = phone;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a secure verification token (expires in 24 hours)
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        dateOfBirth: birthDate,
        age,
        plan: plan || 'free',
        // emailVerified stays null — set only after they click the link
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        // Phone is optional — pre-verified via OTP on the client before signup
        ...(validatedPhone ? { phone: validatedPhone, phoneVerified: new Date() } : {}),
      },
    });

    // Create user preferences
    await prisma.userPreferences.create({
      data: {
        userId: user.id,
        learningLevel: 'college',
        preferredVoice: 'professional',
        autoAudio: false,
        theme: 'light',
      },
    });

    // Send verification email (non-blocking — don't fail signup if email fails)
    sendVerificationEmail(email, name, verificationToken).catch((err) => {
      console.error('❌ Failed to send verification email:', err);
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        plan: user.plan,
      },
      message: 'Account created! Please check your email to verify your account.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
