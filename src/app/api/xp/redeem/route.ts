import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { submitRedemption } from '@/lib/services/xp.service';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await submitRedemption(session.user.id);
  if (!result.success) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message:
      'Redemption request submitted! Your Rs.100 Amazon voucher will be emailed within 24 hours.',
  });
}
