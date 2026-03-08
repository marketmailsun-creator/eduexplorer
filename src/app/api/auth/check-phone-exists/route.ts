import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Public endpoint — returns only a boolean, no sensitive data
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ exists: false });
    }

    // Normalize: ensure E.164 format (+91XXXXXXXXXX)
    const digits = phone.replace(/\D/g, '');
    const e164 =
      digits.length === 10 ? `+91${digits}` :
      digits.length === 12 && digits.startsWith('91') ? `+${digits}` :
      phone;

    const user = await prisma.user.findUnique({
      where: { phone: e164 },
      select: { id: true },
    });
    return NextResponse.json({ exists: !!user });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
