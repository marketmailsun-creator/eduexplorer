// ============================================================
// FILE: src/lib/services/email.service.ts
// Email service using Resend (free tier: 3,000 emails/month)
// Install: npm install resend
// Add to .env: RESEND_API_KEY=re_xxxx
//              EMAIL_FROM=noreply@eduexplorer.ai
// ============================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const EMAIL_FROM = process.env.EMAIL_FROM || 'EduExplorer <noreply@eduexplorer.ai>';
const APP_URL = process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'https://www.eduexplorer.ai';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set');
    throw new Error('Email service not configured');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('❌ Resend API error:', error);
    throw new Error(`Failed to send email: ${error}`);
  }

  const data = await res.json();
  console.log('✅ Email sent:', data.id);
  return data;
}

// ── Verification email ────────────────────────────────────────
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899);padding:36px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">🎓</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">EduExplorer</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">AI-Powered Learning Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:700;">
                Verify your email address
              </h2>
              <p style="margin:0 0 8px;color:#4b5563;font-size:15px;line-height:1.6;">
                Hi ${name || 'there'} 👋
              </p>
              <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.6;">
                Thanks for signing up! Click the button below to verify your email and start your learning journey.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${verifyUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:16px;letter-spacing:0.01em;">
                  ✅ Verify Email
                </a>
              </div>

              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-align:center;">
                This link expires in <strong>24 hours</strong>.
              </p>
              <p style="margin:0;color:#6b7280;font-size:13px;text-align:center;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding:0 40px 28px;">
              <div style="background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #e5e7eb;">
                <p style="margin:0 0 6px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                  Or copy this link
                </p>
                <p style="margin:0;color:#6366f1;font-size:12px;word-break:break-all;">
                  ${verifyUrl}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © 2025 EduExplorer · AI-Powered Learning
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: '✅ Verify your EduExplorer email',
    html,
  });
}

// ── Welcome email (sent after verification) ───────────────────
export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Welcome to EduExplorer!</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899);padding:36px 40px;text-align:center;">
              <div style="font-size:48px;margin-bottom:8px;">🎉</div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Welcome aboard!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;color:#111827;font-size:16px;font-weight:600;">
                Hi ${name || 'there'}, your email is verified!
              </p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                You're all set to explore any topic with AI-powered articles, quizzes, flashcards, audio, and more.
              </p>

              <div style="background:#f0fdf4;border-radius:10px;padding:20px;margin-bottom:24px;border:1px solid #bbf7d0;">
                <p style="margin:0 0 10px;color:#166534;font-weight:700;font-size:14px;">🚀 Get started:</p>
                <ul style="margin:0;padding-left:18px;color:#15803d;font-size:14px;line-height:1.8;">
                  <li>Type any topic in the search bar</li>
                  <li>Get a full AI-generated lesson in seconds</li>
                  <li>Quiz yourself to test your knowledge</li>
                  <li>Build a learning streak 🔥</li>
                </ul>
              </div>

              <div style="text-align:center;">
                <a href="${APP_URL}/explore"
                   style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:16px;">
                  Start Learning →
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© 2025 EduExplorer</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to EduExplorer — you\'re all set!',
    html,
  });
}

// ── Account deletion confirmation email ──────────────────────
export async function sendAccountDeletionEmail(email: string, name: string) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Account Deleted</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#1f2937;padding:36px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">👋</div>
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Account Deleted</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                Hi ${name || 'there'},
              </p>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                Your EduExplorer account and all associated data have been permanently deleted as requested.
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                We're sorry to see you go. If you ever want to come back, you're always welcome to create a new account.
              </p>
              <div style="background:#fef2f2;border-radius:8px;padding:16px;border:1px solid #fecaca;">
                <p style="margin:0;color:#b91c1c;font-size:13px;">
                  If you did NOT request this deletion, please contact us immediately at <strong>support@eduexplorer.ai</strong>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© 2025 EduExplorer</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: 'Your EduExplorer account has been deleted',
    html,
  });
}
