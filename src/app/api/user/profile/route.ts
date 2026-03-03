// ============================================================
// FILE: src/app/api/user/profile/route.ts  — REPLACE EXISTING
// Added: hasPassword field so the frontend knows whether to show
// the password field in the delete account confirmation dialog.
// ============================================================

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true,
        createdAt: true,
        emailVerified: true,
        phone: true,
        phoneVerified: true,
        password: true, // used only to derive hasPassword — never sent raw
        _count: {
          select: {
            queries: true,
            savedContent: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't send the hashed password to the client — just a boolean
    const { password, ...userWithoutPassword } = user;

    // Fetch active subscription for plan details display
    const subscription = await prisma.subscription.findFirst({
      where: { userId: session.user.id, status: 'active' },
      orderBy: { startDate: 'desc' },
      select: { plan: true, startDate: true, endDate: true, status: true },
    });

    return NextResponse.json({
      ...userWithoutPassword,
      hasPassword: !!password,
      phoneVerified: user.phoneVerified ? user.phoneVerified.toISOString() : null,
      subscription: subscription
        ? {
            plan: subscription.plan,
            startDate: subscription.startDate.toISOString(),
            endDate: subscription.endDate.toISOString(),
            status: subscription.status,
          }
        : null,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
