// ============================================================
// FILE: src/app/api/auth/forgot-password/route.ts  — NEW FILE
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const APP_URL = process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'https://www.eduexplorer.ai';
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const EMAIL_FROM = process.env.EMAIL_FROM || 'EduExplorer <noreply@eduexplorer.ai>';

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, password: true },
    });

    // Always return success — don't reveal if email exists
    if (!user || !user.password) {
      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.upsert({
      where: { email },
      create: { email, token, expires },
      update: { token, expires },
    });

    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Reset Password</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899);padding:36px 40px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🔐</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">Reset your password</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;color:#4b5563;font-size:15px;line-height:1.6;">Hi ${user.name || 'there'},</p>
            <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.6;">
              We received a request to reset your password. Click the button below to create a new one. This link expires in <strong>1 hour</strong>.
            </p>
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:16px;">
                Reset Password
              </a>
            </div>
            <div style="background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #e5e7eb;">
              <p style="margin:0 0 6px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Or copy this link</p>
              <p style="margin:0;color:#6366f1;font-size:12px;word-break:break-all;">${resetUrl}</p>
            </div>
            <p style="margin:20px 0 0;color:#9ca3af;font-size:13px;text-align:center;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© 2025 EduExplorer</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: email, subject: '🔐 Reset your EduExplorer password', html }),
    });

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
