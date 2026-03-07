import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { fcmToken } = body as { fcmToken?: unknown };
  if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length < 10) {
    return Response.json({ error: 'Invalid FCM token' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { fcmToken },
  });

  return Response.json({ success: true });
}
