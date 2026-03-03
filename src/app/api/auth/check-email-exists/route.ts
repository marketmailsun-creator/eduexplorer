import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Public endpoint — returns only a boolean, no sensitive data
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ exists: false });
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });
    return NextResponse.json({ exists: !!user });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
