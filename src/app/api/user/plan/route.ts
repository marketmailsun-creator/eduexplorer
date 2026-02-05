import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserPlan } from '@/lib/services/plan-limits.service';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = await getUserPlan(session.user.id);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Get plan error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}