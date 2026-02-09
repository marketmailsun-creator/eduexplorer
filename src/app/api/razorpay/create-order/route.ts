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

    // Amount in smallest currency unit (paise for INR, cents for USD)
    const amount = plan === 'yearly' ? 999900 : 99900; // ₹9999 or ₹999
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
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}