// src/lib/services/msg91.service.ts — CREATE NEW
//
// Handles:
//   1. OTP send via WhatsApp (primary) with SMS fallback
//   2. OTP verify
//   3. WhatsApp template messages (quiz reminders, progress, groups)
//
// ENV VARS NEEDED (.env.local):
//   MSG91_AUTH_KEY=your_auth_key         ← from MSG91 dashboard
//   MSG91_TEMPLATE_ID=your_template_id   ← OTP template ID
//   MSG91_SENDER_ID=EDUEXP               ← 6-char SMS sender
//   MSG91_WA_INTEGRATED_NUMBER=          ← WhatsApp business number ID
//   MSG91_WA_NAMESPACE=                  ← from MSG91 WA dashboard
//   NEXT_PUBLIC_APP_URL=https://eduexplorer.ai

const MSG91_BASE = 'https://control.msg91.com/api/v5';
const AUTH_KEY   = process.env.MSG91_AUTH_KEY!;

// ─── Types ────────────────────────────────────────────────────

export interface SendOtpResult {
  success: boolean;
  reqId?: string;   // MSG91 request ID — store this to verify later
  error?: string;
  channel: 'whatsapp' | 'sms';
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
}

// ─── OTP via WhatsApp (primary) ───────────────────────────────

export async function sendOtpWhatsApp(phone: string): Promise<SendOtpResult> {
  // phone must be E.164 without '+': 919876543210
  const cleanPhone = phone.replace(/^\+/, '');

  console.log('[MSG91] Attempting to send OTP to:', cleanPhone);
  console.log('[MSG91] Auth Key present:', !!AUTH_KEY);
  console.log('[MSG91] Flow ID:', process.env.MSG91_OTP_FLOW_ID);

  try {
    const res = await fetch(`${MSG91_BASE}/flow/`, {
      method: 'POST',
      headers: {
        'authkey': AUTH_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flow_id: process.env.MSG91_OTP_FLOW_ID,  // OTP flow from MSG91 dashboard
        sender: process.env.MSG91_SENDER_ID || 'EDUEXP',
        mobiles: cleanPhone,
        // MSG91 auto-generates and injects the OTP into the template
      }),
    });

    const data = await res.json();
    console.log('[MSG91] WhatsApp OTP response:', data);

    if (data.type === 'success' || data.request_id) {
      console.log('[MSG91] ✅ OTP sent via WhatsApp');
      return { success: true, reqId: data.request_id, channel: 'whatsapp' };
    }

    // WhatsApp failed — fall back to SMS OTP
    console.warn('[MSG91] WhatsApp OTP failed, falling back to SMS:', data);
    return sendOtpSms(cleanPhone);

  } catch (err) {
    console.error('[MSG91] sendOtpWhatsApp error:', err);
    return sendOtpSms(cleanPhone);
  }
}

// ─── OTP via SMS (fallback) ───────────────────────────────────

async function sendOtpSms(cleanPhone: string): Promise<SendOtpResult> {
  console.log('[MSG91] Sending SMS OTP to:', cleanPhone);
  console.log('[MSG91] Template ID:', process.env.MSG91_TEMPLATE_ID);
  console.log('[MSG91] Sender ID:', process.env.MSG91_SENDER_ID || 'TXTLCL');

  try {
    const url = `${MSG91_BASE}/otp?template_id=${process.env.MSG91_TEMPLATE_ID}&mobile=${cleanPhone}&authkey=${AUTH_KEY}`;
    console.log('[MSG91] SMS API URL:', url.replace(AUTH_KEY, 'HIDDEN'));
    
    const res = await fetch(url, { method: 'GET' });
    const data = await res.json();
    
    console.log('[MSG91] SMS OTP response:', data);

    if (data.type === 'success') {
      console.log('[MSG91] ✅ OTP sent via SMS');
      return { success: true, reqId: data.request_id, channel: 'sms' };
    }
    
    console.error('[MSG91] ❌ SMS OTP failed:', data);
    return { success: false, error: data.message || 'Failed to send OTP', channel: 'sms' };
  } catch (err) {
    console.error('[MSG91] sendOtpSms error:', err);
    return { success: false, error: 'Network error sending OTP', channel: 'sms' };
  }
}

// ─── Verify OTP ───────────────────────────────────────────────

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResult> {
  const cleanPhone = phone.replace(/^\+/, '');

  try {
    const res = await fetch(
      `${MSG91_BASE}/otp/verify?mobile=${cleanPhone}&otp=${otp}&authkey=${AUTH_KEY}`,
      { method: 'GET' }
    );
    const data = await res.json();

    if (data.type === 'success') {
      return { success: true };
    }
    return {
      success: false,
      error: data.message === 'OTP not matched'
        ? 'Incorrect OTP. Please try again.'
        : data.message === 'OTP has been expired'
        ? 'OTP expired. Please request a new one.'
        : 'Verification failed. Please try again.',
    };
  } catch (err) {
    console.error('[MSG91] verifyOtp error:', err);
    return { success: false, error: 'Network error verifying OTP' };
  }
}

// ─── Resend OTP ───────────────────────────────────────────────

export async function resendOtp(phone: string): Promise<SendOtpResult> {
  const cleanPhone = phone.replace(/^\+/, '');
  try {
    const res = await fetch(
      `${MSG91_BASE}/otp/retry?mobile=${cleanPhone}&authkey=${AUTH_KEY}&retrytype=text`,
      { method: 'GET' }
    );
    const data = await res.json();
    if (data.type === 'success') {
      return { success: true, channel: 'sms' };
    }
    return { success: false, error: data.message, channel: 'sms' };
  } catch {
    return { success: false, error: 'Failed to resend OTP', channel: 'sms' };
  }
}

// ═══════════════════════════════════════════════════════════════
// WHATSAPP NOTIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════
// These use MSG91's WhatsApp template message API.
// Create templates in MSG91 dashboard → WhatsApp → Templates.
// Each function maps to a pre-approved WhatsApp template.
// ═══════════════════════════════════════════════════════════════

async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  variables: Record<string, string>
): Promise<boolean> {
  const cleanPhone = phone.replace(/^\+/, '');

  try {
    const res = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
      method: 'POST',
      headers: {
        'authkey': AUTH_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        integrated_number: process.env.MSG91_WA_INTEGRATED_NUMBER,
        content_type: 'template',
        payload: {
          to: cleanPhone,
          type: 'template',
          template: {
            name: templateName,
            namespace: process.env.MSG91_WA_NAMESPACE,
            language: { policy: 'deterministic', code: 'en' },
            components: [
              {
                type: 'body',
                parameters: Object.values(variables).map(v => ({
                  type: 'text',
                  text: v,
                })),
              },
            ],
          },
        },
      }),
    });

    const data = await res.json();
    return data.type === 'success' || res.ok;
  } catch (err) {
    console.error('[MSG91] WhatsApp template error:', err);
    return false;
  }
}

// ─── 1. Quiz Reminder ────────────────────────────────────────
// Template: "eduexplorer_quiz_reminder"
// Body: "Hi {{1}}! 📝 Time to test your knowledge on *{{2}}*. 
//        You last scored {{3}}%. Can you beat it?
//        👉 {{4}}"

export async function sendQuizReminder(params: {
  phone: string;
  name: string;
  topic: string;
  lastScore: number;
  quizUrl: string;
}): Promise<boolean> {
  return sendWhatsAppTemplate(params.phone, 'eduexplorer_quiz_reminder', {
    '1': params.name,
    '2': params.topic,
    '3': String(params.lastScore),
    '4': params.quizUrl,
  });
}

// ─── 2. Weekly Progress Summary ──────────────────────────────
// Template: "eduexplorer_weekly_progress"
// Body: "Hi {{1}}! 🎓 Your weekly EduExplorer summary:
//        📚 Topics explored: {{2}}
//        🔥 Current streak: {{3}} days
//        🧠 Quiz average: {{4}}%
//        Keep it up! 👉 {{5}}"

export async function sendWeeklyProgress(params: {
  phone: string;
  name: string;
  topicsCount: number;
  streak: number;
  quizAverage: number;
  profileUrl: string;
}): Promise<boolean> {
  return sendWhatsAppTemplate(params.phone, 'eduexplorer_weekly_progress', {
    '1': params.name,
    '2': String(params.topicsCount),
    '3': String(params.streak),
    '4': String(params.quizAverage),
    '5': params.profileUrl,
  });
}

// ─── 3. Study Group Notification ─────────────────────────────
// Template: "eduexplorer_group_notification"
// Body: "Hi {{1}}! 👥 New activity in *{{2}}*:
//        {{3}} shared *{{4}}* with your group.
//        👉 {{5}}"

export async function sendGroupNotification(params: {
  phone: string;
  recipientName: string;
  groupName: string;
  senderName: string;
  contentTitle: string;
  contentUrl: string;
}): Promise<boolean> {
  return sendWhatsAppTemplate(params.phone, 'eduexplorer_group_notification', {
    '1': params.recipientName,
    '2': params.groupName,
    '3': params.senderName,
    '4': params.contentTitle,
    '5': params.contentUrl,
  });
}

// ─── 4. Welcome Message (on signup) ──────────────────────────
// Template: "eduexplorer_welcome"
// Body: "Welcome to EduExplorer, {{1}}! 🎓
//        You're all set to explore any topic with AI.
//        Start your first lesson 👉 {{2}}"

export async function sendWelcomeWhatsApp(params: {
  phone: string;
  name: string;
}): Promise<boolean> {
  return sendWhatsAppTemplate(params.phone, 'eduexplorer_welcome', {
    '1': params.name,
    '2': `${process.env.NEXT_PUBLIC_APP_URL}/explore`,
  });
}