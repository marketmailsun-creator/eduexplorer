import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Handle different events
    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        console.log('✅ Payment captured:', payment.id);
        break;
      }

      case 'payment.failed': {
        const payment = event.payload.payment.entity;
        console.log('❌ Payment failed:', payment.id);
        break;
      }

      case 'subscription.cancelled': {
        const subscription = event.payload.subscription.entity;
        
        // FIXED: Find user first, then update
        const user = await prisma.user.findFirst({
          where: { razorpaySubscriptionId: subscription.id },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              plan: 'free',
              razorpaySubscriptionId: null,
            },
          });
          console.log('📉 User downgraded to free:', user.email);
        }
        break;
      }

      case 'subscription.activated': {
        const subscription = event.payload.subscription.entity;
        console.log('✅ Subscription activated:', subscription.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}