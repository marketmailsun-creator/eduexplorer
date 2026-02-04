import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  dateOfBirth: z.string().refine((date) => {
    const dob = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    return age >= 13 && age <= 120;
  }, {
    message: 'You must be at least 13 years old to use this service',
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, dateOfBirth } = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Calculate age
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())
      ? age - 1
      : age;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with age and DOB
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        dateOfBirth: new Date(dateOfBirth),
        age: adjustedAge,
      },
    });

    console.log('✅ User created:', user.email, 'Age:', adjustedAge);

    return NextResponse.json({
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        age: user.age 
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
