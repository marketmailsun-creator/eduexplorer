import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  normalizePhone,
  generateOtp,
  storeOtp,
  sendOtp,
  checkRateLimit,
} from '@/lib/services/otp.service';

const sendOtpSchema = z.object({
  phone: z.string().min(1),
  channel: z.enum(['sms', 'whatsapp']).default('whatsapp'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, channel } = sendOtpSchema.parse(body);

    // Normalise to E.164 (+91XXXXXXXXXX)
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    // Enforce rate limit (3 sends per phone per 10 minutes)
    const allowed = await checkRateLimit(normalizedPhone);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait 10 minutes before trying again.' },
        { status: 429 }
      );
    }

    // Generate and store OTP
    const code = generateOtp();
    await storeOtp(normalizedPhone, code);

    // Send via configured provider
    await sendOtp(normalizedPhone, code, channel);

    return NextResponse.json({
      success: true,
      message: `OTP sent to your ${channel === 'whatsapp' ? 'WhatsApp' : 'mobile number'}.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    console.error('[send-otp] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
