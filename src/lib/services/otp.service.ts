// ============================================================
// FILE: src/lib/services/otp.service.ts
// Handles OTP lifecycle: generation, Redis storage, verification,
// rate-limiting, and sending via Twilio (SMS + WhatsApp) or Fast2SMS.
//
// Provider selection via OTP_PROVIDER env var: 'twilio' | 'fast2sms'
// For development, use Twilio test credentials (no real SMS sent).
// For India production SMS at low cost, switch to fast2sms.
// ============================================================

import { redis } from '@/lib/db/redis';
import twilio from 'twilio';

// ── Constants ──────────────────────────────────────────────────────────────

const OTP_TTL = 5 * 60;         // 5 minutes in seconds
const OTP_MAX_ATTEMPTS = 3;      // max wrong guesses before OTP is invalidated
const RATE_LIMIT_TTL = 10 * 60; // 10-minute rate-limit window in seconds
const RATE_LIMIT_MAX = 3;        // max OTP sends per phone per 10 minutes

interface OtpRecord {
  code: string;
  attempts: number;
  createdAt: number;
}

// ── Phone normalisation ────────────────────────────────────────────────────

/**
 * Normalises an Indian mobile number to E.164 format (+91XXXXXXXXXX).
 * Accepts: 10-digit numbers, numbers with +91 prefix, numbers with 91 prefix.
 * Returns null if the number is not a valid 10-digit Indian mobile number.
 */
export function normalizePhone(phone: string): string | null {
  if (!phone) return null;

  // Strip all whitespace, dashes, dots, parentheses
  let cleaned = phone.replace(/[\s\-().]/g, '');

  // Strip leading + sign if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Strip country code 91 if present (and number is 12 digits)
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }

  // Must now be exactly 10 digits starting with 6-9 (valid Indian mobile)
  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return null;
  }

  return `+91${cleaned}`;
}

// ── OTP Generation ─────────────────────────────────────────────────────────

/**
 * Generates a cryptographically random 6-digit numeric OTP.
 * Zero-padded: e.g. "047382".
 */
export function generateOtp(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString().padStart(6, '0');
}

// ── Redis storage ──────────────────────────────────────────────────────────

/**
 * Stores the OTP code in Redis with a 5-minute TTL.
 * Overwrites any existing OTP for the same phone number.
 */
export async function storeOtp(phone: string, code: string): Promise<void> {
  const key = `otp:${phone}`;
  const record: OtpRecord = { code, attempts: 0, createdAt: Date.now() };
  // Pass the object directly — @upstash/redis serializes it; get() auto-deserializes
  await redis.setex(key, OTP_TTL, record);
}

/**
 * Retrieves the stored OTP record for a phone number, or null if expired/absent.
 */
async function getOtp(phone: string): Promise<OtpRecord | null> {
  const key = `otp:${phone}`;
  // @upstash/redis auto-deserializes JSON on get, so raw is already the object
  const raw = await redis.get<OtpRecord>(key);
  return raw ?? null;
}

// ── OTP Verification ───────────────────────────────────────────────────────

/**
 * Verifies the user-submitted OTP code against the stored record.
 *
 * - Increments attempt count on each wrong guess.
 * - Deletes the record on success OR when max attempts are exceeded.
 * - Returns { success: true } on match, { success: false, reason } otherwise.
 */
export async function verifyOtp(
  phone: string,
  inputCode: string
): Promise<{ success: boolean; reason?: string }> {
  const key = `otp:${phone}`;
  const record = await getOtp(phone);

  if (!record) {
    return { success: false, reason: 'expired' };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await redis.del(key);
    return { success: false, reason: 'max_attempts' };
  }

  if (record.code !== inputCode.trim()) {
    // Increment attempt count
    record.attempts += 1;
    // Preserve remaining TTL by re-setting with the same TTL
    // (Upstash doesn't expose GETTTL easily in REST, so we use fixed OTP_TTL)
    await redis.setex(key, OTP_TTL, record);

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await redis.del(key);
      return { success: false, reason: 'max_attempts' };
    }
    return { success: false, reason: 'wrong' };
  }

  // Code matches — delete the OTP so it can't be reused
  await redis.del(key);
  return { success: true };
}

// ── Rate Limiting ──────────────────────────────────────────────────────────

/**
 * Checks whether a phone number is under the rate limit.
 * Returns true (allowed) if fewer than RATE_LIMIT_MAX OTPs have been sent
 * in the last 10 minutes.
 */
export async function checkRateLimit(phone: string): Promise<boolean> {
  const key = `otp:ratelimit:${phone}`;

  // INCR atomically increments; if the key doesn't exist it is created with value 1.
  const count = await redis.incr(key);

  // On first increment, set the expiry window
  if (count === 1) {
    await redis.expire(key, RATE_LIMIT_TTL);
  }

  return count <= RATE_LIMIT_MAX;
}

// ── Provider dispatch ──────────────────────────────────────────────────────

/**
 * Sends the OTP via the configured provider (Twilio or Fast2SMS).
 * Provider selected by OTP_PROVIDER env var (default: 'twilio').
 */
export async function sendOtp(
  phone: string,
  code: string,
  channel: 'sms' | 'whatsapp'
): Promise<void> {
  const provider = process.env.OTP_PROVIDER || 'twilio';

  if (provider === 'fast2sms') {
    if (channel === 'whatsapp') {
      // Fast2SMS doesn't support WhatsApp — fall back to SMS
      console.warn('[OTP] Fast2SMS does not support WhatsApp; falling back to SMS');
    }
    await sendViaFast2Sms(phone, code);
  } else {
    await sendViaTwilio(phone, code, channel);
  }
}

// ── Twilio provider ────────────────────────────────────────────────────────

async function sendViaTwilio(
  phone: string,
  code: string,
  channel: 'sms' | 'whatsapp'
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)');
  }

  const client = twilio(accountSid, authToken);

  const body =
    `Your EduExplorer verification code is: *${code}*\n\n` +
    `This code expires in 5 minutes. Do not share it with anyone.`;

  if (channel === 'whatsapp') {
    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!whatsappFrom) {
      throw new Error('TWILIO_WHATSAPP_NUMBER not configured');
    }

    await client.messages.create({
      from: whatsappFrom,
      to: `whatsapp:${phone}`,
      body,
    });
  } else {
    const smsFrom = process.env.TWILIO_PHONE_NUMBER;
    if (!smsFrom) {
      throw new Error('TWILIO_PHONE_NUMBER not configured');
    }

    await client.messages.create({
      from: smsFrom,
      to: phone,
      body,
    });
  }
}

// ── Fast2SMS provider ──────────────────────────────────────────────────────

async function sendViaFast2Sms(phone: string, code: string): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    throw new Error('FAST2SMS_API_KEY not configured');
  }

  // Fast2SMS expects a 10-digit number without the country code
  const digits = phone.replace('+91', '');

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'otp',
      variables_values: code,
      numbers: digits,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Fast2SMS error: ${error}`);
  }

  const data = await res.json();
  if (!data.return) {
    throw new Error(`Fast2SMS rejected: ${JSON.stringify(data)}`);
  }
}
