// ============================================================
// FILE: src/app/api/user/delete-account/route.ts  — NEW FILE
// Permanently deletes the authenticated user and all their data.
// Cascades are defined in Prisma schema so all relations are removed.
// Sends a deletion confirmation email.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { sendAccountDeletionEmail } from '@/lib/services/email.service';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  // For credentials users: must confirm password
  // For OAuth users: just pass confirmText = "DELETE"
  password: z.string().optional(),
  confirmText: z.string(),
});

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { password, confirmText } = schema.parse(body);

    // Must type DELETE to confirm
    if (confirmText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Please type DELETE to confirm account deletion' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For credentials users, verify password before deletion
    if (user.password) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required to delete your account' },
          { status: 400 }
        );
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Incorrect password' },
          { status: 400 }
        );
      }
    }

    // Save email/name before deletion for the confirmation email
    const userEmail = user.email!;
    const userName = user.name || '';

    // Delete the user — Prisma cascade will delete all related data:
    // queries, content, savedContent, savedQueries, accounts, sessions,
    // pushSubscriptions, preferences, quizScores, studyGroups, comments, etc.
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    console.log('✅ Account deleted:', userEmail);

    // Send deletion confirmation email (non-blocking)
    sendAccountDeletionEmail(userEmail, userName).catch((err) => {
      console.error('❌ Failed to send deletion email:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Account permanently deleted',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('❌ Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
