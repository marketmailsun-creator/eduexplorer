import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await req.json();

    // Amount in smallest currency unit (paise for INR)
    // Monthly: ₹600, Yearly: ₹6000 (2 months free vs monthly)
    const amount = plan === 'yearly' ? 600000 : 60000;
    const currency = 'INR'; // Change to 'USD' for international

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `order_${Date.now()}`,
      notes: {
        userId: session.user.id,
        plan,
        email: session.user.email || '',
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}