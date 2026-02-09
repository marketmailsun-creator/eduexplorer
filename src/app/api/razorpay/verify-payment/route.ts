import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, paymentId, signature, plan } = await req.json();

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Payment verified - Update user to pro
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        plan: 'pro',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
      },
    });

    // Store subscription record
    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        plan,
        status: 'active',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        startDate: new Date(),
        endDate: new Date(
          Date.now() + (plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
        ),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}