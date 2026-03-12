import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { submitRedemption } from '@/lib/services/xp.service';
import { prisma } from '@/lib/db/prisma';
import { sendAdminAlert } from '@/lib/services/email.service';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await submitRedemption(session.user.id);
  if (!result.success) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  // Notify admin of new redemption request (non-blocking)
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true, totalXP: true },
    });
    await sendAdminAlert(
      'New XP Redemption Request — ₹100 Amazon Voucher',
      `User: ${user?.name ?? 'Unknown'}\nEmail: ${user?.email ?? 'N/A'}\nPhone: ${user?.phone ?? 'N/A'}\nXP after deduction: ${user?.totalXP ?? 'N/A'}\nTime: ${new Date().toISOString()}\n\nPlease send a ₹100 Amazon voucher to the user's email within 24 hours.`
    );
  } catch (emailErr) {
    console.error('[XP Redeem] Admin alert failed (non-fatal):', emailErr);
  }

  return NextResponse.json({
    success: true,
    message:
      'Redemption request submitted! Your Rs.100 Amazon voucher will be emailed within 24 hours.',
  });
}
