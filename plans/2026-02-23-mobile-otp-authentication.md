# Plan: Mobile OTP Authentication (SMS & WhatsApp)

**Created:** 2026-02-23
**Status:** Implemented
**Request:** Add phone-number-based OTP authentication (SMS + WhatsApp) for login and signup, targeting Indian customers; app is unregistered (no GSTIN, no labour licence).

---

## Overview

### What This Plan Accomplishes

This plan adds a phone number + OTP authentication flow alongside the existing email/password and Google OAuth flows. Users can sign up or log in by entering their Indian mobile number (+91), receiving a 6-digit OTP via SMS or WhatsApp, and entering it to authenticate — all without leaving the app or navigating away to verify email.

### Why This Matters

The current email-based credential flow breaks UX flow: users must leave the app, open their email client, click a verification link, and return — causing significant drop-off. For Indian mobile-first users, a phone OTP is the dominant, expected auth pattern (UPI apps, Swiggy, Zepto, etc.). This change makes onboarding instant and familiar.

---

## Current State

### Relevant Existing Structure

```
src/auth.ts                              # NextAuth v5 config (Google + Credentials providers)
src/app/(auth)/login/page.tsx            # Login page (email + password + Google)
src/app/(auth)/signup/page.tsx           # Signup page (email + password + Google)
src/app/(auth)/verify-email/page.tsx     # Email verification holding page
src/app/api/auth/signup/route.ts         # Signup API (creates user, sends email)
src/app/api/auth/verify-email/route.ts   # Email verification handler
src/app/api/auth/check-verified/route.ts # Checks if email is verified
src/app/api/auth/resend-verification/route.ts
src/lib/db/redis.ts                      # Upstash Redis client (getCached, setCache, deleteCache)
src/lib/services/email.service.ts        # Resend email service pattern to follow
prisma/schema.prisma                     # User model (email, password, emailVerified, etc.)
```

### Gaps or Problems Being Addressed

1. **Email verification context switch**: User must leave the app to check email, breaking flow.
2. **No phone field on User model**: Cannot associate a phone number with a user.
3. **No OTP service**: No mechanism to generate, store, send, or verify OTPs.
4. **No phone auth provider in NextAuth**: Cannot sign in a user by phone number.
5. **No SMS/WhatsApp integration**: No messaging provider configured.

---

## Provider Selection (India, No GSTIN)

### India DLT Regulatory Note

TRAI mandates DLT (Distributed Ledger Technology) registration for all commercial SMS in India. This means **the SMS service provider must handle DLT compliance on your behalf**. As an individual developer without a registered entity, you cannot self-register on DLT. Choose providers that handle this for you.

### Recommended Providers

#### Development & Testing: Twilio Verify
- **Sign-up requirements**: Email + credit card only. No GSTIN, no business docs.
- **Free trial**: $15 credit (≈ 2,000+ SMS OTPs).
- **Test mode**: Use test phone numbers (`+15005550006` etc.) — no real SMS sent in dev.
- **WhatsApp Sandbox**: Join Twilio sandbox by messaging a WhatsApp number. No business verification.
- **DLT compliance**: Twilio manages DLT sender IDs for Indian routes in production.
- **npm package**: `twilio`
- **Pricing**: ~$0.0075 per verification (≈ ₹0.63/OTP)
- **Sign-up**: https://www.twilio.com/try-twilio

#### Production SMS (Low Cost, Indian): Fast2SMS
- **Sign-up requirements**: Indian mobile number + email. No GSTIN required.
- **Pricing**: ₹0.13–0.17/SMS OTP — significantly cheaper than Twilio.
- **DLT**: Fast2SMS handles DLT registration and sender ID on your behalf.
- **API**: Simple HTTP REST (no npm package needed).
- **Limitation**: SMS only (no WhatsApp).
- **Sign-up**: https://fast2sms.com (Individual/Startup plan)

#### Production WhatsApp (Free): Meta WhatsApp Cloud API
- **Sign-up requirements**: Meta Business Manager account — can register as individual with personal name, no GSTIN.
- **Pricing**: Free for first 1,000 conversations/month; ₹0.37–0.58/conversation after.
- **DLT**: Not applicable (WhatsApp bypasses SMS DLT).
- **Integration**: REST API via `GRAPH_API_URL`.
- **Caveat**: Meta Business Verification takes 1–5 business days. Can use Twilio WhatsApp sandbox during this time.

### Recommended Strategy

| Phase | SMS Provider | WhatsApp Provider |
|-------|-------------|-------------------|
| Development | Twilio Verify (test credentials) | Twilio WhatsApp Sandbox |
| Production (MVP) | Fast2SMS | Meta WhatsApp Cloud API |
| Production (Scale) | Twilio Verify | Meta WhatsApp Cloud API |

**For implementation, start with Twilio Verify (handles both SMS + WhatsApp sandbox). Add Fast2SMS as a provider option via environment variable (`OTP_PROVIDER=twilio` or `OTP_PROVIDER=fast2sms`).**

---

## Proposed Changes

### Summary of Changes

- Add `phone` and `phoneVerified` fields to the `User` model in Prisma schema
- Add a database migration for these new fields
- Create an `otp.service.ts` that handles OTP generation, Redis storage, and multi-provider sending
- Create two new API routes: `POST /api/auth/send-otp` and `POST /api/auth/verify-otp`
- Add a new `phone-otp` CredentialsProvider to `src/auth.ts`
- Create a new phone login page `src/app/(auth)/phone-login/page.tsx`
- Create a new phone signup page `src/app/(auth)/phone-signup/page.tsx`
- Update the existing login and signup pages to show a "Continue with Mobile" option
- Add environment variables for OTP provider configuration
- Install the `twilio` npm package

### New Files to Create

| File Path | Purpose |
|-----------|---------|
| `src/lib/services/otp.service.ts` | OTP generation, Redis storage, and multi-provider SMS/WhatsApp sending |
| `src/app/api/auth/send-otp/route.ts` | API endpoint to send OTP to a phone number |
| `src/app/api/auth/verify-otp/route.ts` | API endpoint to verify OTP (used by NextAuth credentials) |
| `src/app/(auth)/phone-login/page.tsx` | Phone number OTP login UI (2-step: enter phone → enter OTP) |
| `src/app/(auth)/phone-signup/page.tsx` | Phone number OTP signup UI (enter name + phone → enter OTP) |
| `plans/2026-02-23-mobile-otp-authentication.md` | This plan document |

### Files to Modify

| File Path | Changes |
|-----------|---------|
| `prisma/schema.prisma` | Add `phone String? @unique` and `phoneVerified DateTime?` to `User` model |
| `src/auth.ts` | Add `phone-otp` CredentialsProvider that validates phone+OTP |
| `src/app/(auth)/login/page.tsx` | Add "Continue with Mobile" button linking to `/phone-login` |
| `src/app/(auth)/signup/page.tsx` | Add "Sign up with Mobile" button linking to `/phone-signup` |
| `.env.example` (or equivalent) | Document new OTP env vars |

### Files to Delete (if any)

None.

---

## Design Decisions

### Key Decisions Made

1. **OTP stored in Upstash Redis (not DB)**: Redis already exists in the project. OTPs are ephemeral (5-min TTL) — perfect for Redis. No new DB table needed. Key format: `otp:{phone}` → `{code, attempts, createdAt}`.

2. **New CredentialsProvider, not replacing existing**: Adding a `phone-otp` provider alongside `credentials` (email+password). Users can choose either method. Phone-authed users have no password set (same as Google OAuth users).

3. **Phone number is the user identifier for phone signup**: If a user signs up via phone, `email` field can be collected optionally later. For initial MVP, phone-registered users get a placeholder email (`phone@phone.eduexplorer.local`) to satisfy the existing unique email constraint, OR we make `email` nullable. **Decision: make `email` optional (nullable) in a follow-up migration**. For MVP, phone signup requires entering an email too (simpler), but skip the verification step.

   > **OPEN QUESTION**: Should phone-signup users be required to provide an email address? require email on phone signup for MVP simplicity** — the UX win is the OTP login, not removing email entirely. Make the email required during sign up. 

4. **Channel selection (SMS vs WhatsApp)**: Users choose at the OTP send step via a toggle. Default is WhatsApp (higher delivery rate in India, no DLT constraint). SMS is fallback.

5. **OTP format**: 6-digit numeric code, 5-minute TTL, max 3 attempts before requiring resend.

6. **Rate limiting**: Limit send-otp to 3 requests per phone per 10 minutes (stored in Redis).

7. **Twilio as dev provider**: Configured via `OTP_PROVIDER=twilio`. Fast2SMS via `OTP_PROVIDER=fast2sms`. Provider is abstracted behind `otp.service.ts`.

8. **Phone number format**: Always normalize to E.164 format (`+91XXXXXXXXXX`) on input. UI shows Indian flag + country code prefix.

### Alternatives Considered
- **Using a single combined login page**: Rejected for clarity — a separate `/phone-login` page is cleaner and allows independent iteration.

### Open Questions

1. **Email on phone signup**: Should phone-signup users be required to provide an email? YES
2. **WhatsApp Business verification**: During dev, Twilio sandbox requires users to opt-in by messaging a number. For production WhatsApp, do you want to pursue Meta Business API verification, or use WhatsApp only in sandbox/testing for now? pursue Meta Business API verification,
3. **Existing users with email+password**: Should they be able to add a phone number later (account linking)? Not included in this plan — can be added as a profile settings feature separately. Not required this is not yet in production and no existing users presentin system, its a new implementation 

---

## Step-by-Step Tasks

### Step 1: Install Dependencies

Install the Twilio npm package.

**Actions:**
- Run `npm install twilio`
- Run `npm install @types/twilio --save-dev` (if needed — Twilio ships its own types)

**Files affected:**
- `package.json`, `package-lock.json`

---

### Step 2: Database Schema — Add Phone Fields

Add `phone` and `phoneVerified` to the `User` model.

**Actions:**
- Open `prisma/schema.prisma`
- In the `User` model, after `emailVerificationExpires DateTime?`, add:
  ```prisma
  phone         String?   @unique
  phoneVerified DateTime?
  ```
- Run `npm run db:migrate` to create a named migration (e.g., `add_phone_to_users`)
- Alternatively run `npm run db:push` if in dev without migration history

**Files affected:**
- `prisma/schema.prisma`
- `prisma/migrations/` (auto-generated)

---

### Step 3: Create OTP Service (`src/lib/services/otp.service.ts`)

Central service for OTP lifecycle management. Abstracts provider-specific code.

**Full implementation spec:**

```typescript
// src/lib/services/otp.service.ts
// Handles: OTP generation, Redis storage, sending via Twilio or Fast2SMS

const OTP_TTL = 5 * 60;          // 5 minutes in seconds
const OTP_MAX_ATTEMPTS = 3;       // max wrong guesses before invalidation
const RATE_LIMIT_TTL = 10 * 60;  // 10-minute window for rate limiting
const RATE_LIMIT_MAX = 3;         // max OTP sends per phone per 10 minutes

interface OtpRecord {
  code: string;
  attempts: number;
  createdAt: number;
}

// generateOtp(): returns a 6-digit zero-padded string, e.g. "047382"
export function generateOtp(): string

// normalizePhone(phone: string): strips spaces/dashes, adds +91 if missing, validates 10-digit Indian number
export function normalizePhone(phone: string): string | null

// storeOtp(phone: string, code: string): stores OTP in Redis with 5-min TTL
// Key: `otp:${phone}`
export async function storeOtp(phone: string, code: string): Promise<void>

// getOtp(phone: string): retrieves OTP record from Redis
export async function getOtp(phone: string): Promise<OtpRecord | null>

// verifyOtp(phone: string, inputCode: string): validates OTP, increments attempts, deletes on success or max attempts
// Returns: { success: true } | { success: false, reason: 'expired'|'wrong'|'max_attempts' }
export async function verifyOtp(phone: string, inputCode: string): Promise<{success: boolean, reason?: string}>

// checkRateLimit(phone: string): returns true if under rate limit, false if exceeded
// Key: `otp:ratelimit:${phone}` with INCR + EXPIRY pattern
export async function checkRateLimit(phone: string): Promise<boolean>

// sendOtpSms(phone: string, code: string, channel: 'sms'|'whatsapp'): routes to correct provider
export async function sendOtp(phone: string, code: string, channel: 'sms' | 'whatsapp'): Promise<void>

// --- Private provider functions ---

// sendViaTwilio(phone, code, channel): uses Twilio Verify API
async function sendViaTwilio(phone: string, code: string, channel: 'sms' | 'whatsapp'): Promise<void>
// Uses twilio Verify V2 Service — creates a verification, doesn't send code manually
// Twilio Verify handles code generation + sending. For custom code, use Messages API instead.
// NOTE: Twilio Verify generates its own codes. If we want custom codes, use Twilio Messages API.
// DECISION: Use Twilio Messages API (not Verify) so we control the code and can store it in Redis.

// sendViaFast2Sms(phone, code): HTTP POST to Fast2SMS OTP route
async function sendViaFast2Sms(phone: string, code: string): Promise<void>
// POST https://www.fast2sms.com/dev/bulkV2
// Headers: { authorization: process.env.FAST2SMS_API_KEY }
// Body: { route: 'otp', variables_values: code, numbers: phone (10 digits without +91) }
```

**Environment variables needed:**
```
OTP_PROVIDER=twilio                  # 'twilio' | 'fast2sms'
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxx
TWILIO_PHONE_NUMBER=+1415xxxxxxx    # SMS sender number
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Sandbox number for dev
FAST2SMS_API_KEY=xxxxxxx            # From Fast2SMS dashboard
```

**Files affected:**
- `src/lib/services/otp.service.ts` (new)

---

### Step 4: API Route — Send OTP (`src/app/api/auth/send-otp/route.ts`)

**Full implementation spec:**

```typescript
// POST /api/auth/send-otp
// Body: { phone: string, channel: 'sms' | 'whatsapp' }
// Response: { success: true, message: 'OTP sent' } | { error: string, status: 429 | 400 | 500 }

export async function POST(req: NextRequest) {
  // 1. Parse and validate body with zod:
  //    phone: string (required), channel: 'sms' | 'whatsapp' (default 'whatsapp')
  // 2. normalizePhone(phone) — return 400 if invalid
  // 3. checkRateLimit(normalizedPhone) — return 429 if exceeded
  // 4. generateOtp() → code
  // 5. storeOtp(normalizedPhone, code) — store in Redis
  // 6. sendOtp(normalizedPhone, code, channel) — send via provider
  // 7. Return { success: true, message: 'OTP sent to your number' }
  // Do NOT reveal the code in the response
}
```

**Files affected:**
- `src/app/api/auth/send-otp/route.ts` (new)

---

### Step 5: API Route — Verify OTP (`src/app/api/auth/verify-otp/route.ts`)

This route is called by the NextAuth CredentialsProvider's `authorize` function internally. It can also be called directly from the phone-login page to give user feedback before triggering NextAuth.

**Full implementation spec:**

```typescript
// POST /api/auth/verify-otp
// Body: { phone: string, code: string }
// Response: { success: true, userId?: string } | { error: string, reason?: string }
// Note: This route is called server-side from NextAuth authorize, not directly from browser in production.
// However, exposing it as an API route allows the UI to pre-validate and show errors before NextAuth takes over.

export async function POST(req: NextRequest) {
  // 1. Parse body: phone, code (both required strings)
  // 2. normalizePhone(phone) — 400 if invalid
  // 3. verifyOtp(normalizedPhone, code):
  //    - On success: look up User by phone in DB; if not found, return { success: true, isNewUser: true }
  //    - On failure: return { success: false, reason: 'wrong_code' | 'expired' | 'max_attempts' }
  // Note: actual user creation/sign-in happens in NextAuth authorize function
}
```

**Files affected:**
- `src/app/api/auth/verify-otp/route.ts` (new)

---

### Step 6: Update NextAuth Config — Add Phone OTP Provider (`src/auth.ts`)

Add a new CredentialsProvider that authenticates users by phone number + OTP.

**Actions:**
- Import `verifyOtp`, `normalizePhone` from `otp.service.ts`
- Add a new CredentialsProvider block after the existing credentials provider:

```typescript
CredentialsProvider({
  id: 'phone-otp',
  name: 'Phone OTP',
  credentials: {
    phone: { label: 'Phone', type: 'tel' },
    code: { label: 'OTP Code', type: 'text' },
    name: { label: 'Name', type: 'text' },      // only needed for signup
    dob: { label: 'Date of Birth', type: 'text' }, // only needed for signup
    plan: { label: 'Plan', type: 'text' },          // only needed for signup
  },
  async authorize(credentials) {
    const phone = normalizePhone(credentials?.phone as string);
    const code = credentials?.code as string;
    if (!phone || !code) return null;

    // Verify OTP against Redis
    const result = await verifyOtp(phone, code);
    if (!result.success) return null;

    // Look up existing user by phone
    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      // New phone signup — create user
      const name = (credentials?.name as string) || 'User';
      const dob = credentials?.dob as string;
      const plan = (credentials?.plan as string) || 'free';

      const birthDate = dob ? new Date(dob) : null;
      const age = birthDate ? calculateAge(birthDate) : null;

      user = await prisma.user.create({
        data: {
          phone,
          phoneVerified: new Date(),
          name,
          dateOfBirth: birthDate,
          age,
          plan,
          // email is null for phone-only users
        },
      });

      // Create user preferences
      await prisma.userPreferences.create({
        data: { userId: user.id, learningLevel: 'college', preferredVoice: 'professional', autoAudio: false, theme: 'light' },
      });
    } else {
      // Existing user — update phoneVerified timestamp
      await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: new Date() } });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      plan: user.plan,
      age: user.age,
    };
  },
}),
```

**Schema note**: `email` must be made nullable in the Prisma schema for phone-only users. See Step 2 addendum below.

**Files affected:**
- `src/auth.ts`

---

### Step 2 Addendum: Make `email` Nullable in User Model

Because phone-signup users won't have an email initially, the `email` field must be optional.

**Actions:**
- In `prisma/schema.prisma`, change `email String @unique` to `email String? @unique`
- Regenerate Prisma client: `npm run db:push` or `npm run db:migrate`
- Update the `authorize` function in the existing `credentials` provider to handle null email gracefully (add early return if `!credentials?.email`)
- Update `jwt` callback: handle `token.email` potentially being null

**Important**: Audit any places in the codebase that assume `user.email` is non-null and add null guards.

**Files affected:**
- `prisma/schema.prisma`
- `src/auth.ts` (audit email usage)

---

### Step 7: Phone Login Page (`src/app/(auth)/phone-login/page.tsx`)

A 2-step page: Step 1 = enter phone + choose SMS/WhatsApp → Step 2 = enter 6-digit OTP.

**Implementation spec:**

```
State:
  step: 1 | 2
  phone: string
  channel: 'sms' | 'whatsapp'
  otp: string (6 chars)
  loading: boolean
  error: string
  countdown: number (60s resend timer)

Step 1 UI:
  - Title: "Sign in with Mobile"
  - Description: "Enter your Indian mobile number (+91)"
  - Input: phone number (type="tel", placeholder="98765 43210")
  - Country flag + "+91" prefix display
  - Toggle: [WhatsApp] [SMS] — default WhatsApp
  - Button: "Send OTP"
  - Link: "Use email instead" → /login
  - Link: "New user? Sign up" → /phone-signup

Step 1 Action (handleSendOtp):
  - Validate phone (10 digits)
  - POST /api/auth/send-otp { phone: '+91' + phone, channel }
  - On success: set step=2, start 60s countdown
  - On error: show error message (rate limit, invalid number, etc.)

Step 2 UI:
  - Title: "Enter OTP"
  - Description: "We sent a 6-digit code to +91 XXXXX XXXXX via [WhatsApp/SMS]"
  - 6-box OTP input (individual digit inputs that auto-advance on input)
  - Button: "Verify & Sign In"
  - Resend link (disabled with countdown): "Resend OTP in 45s" → after countdown: "Resend OTP"
  - "Change number" → back to step 1

Step 2 Action (handleVerifyOtp):
  - Call signIn('phone-otp', { phone: normalizedPhone, code: otp, redirect: false })
  - On success: router.push('/explore')
  - On error: show "Invalid or expired OTP" message

OTP Input Component:
  - 6 individual <input> elements, maxLength=1, type="text" inputMode="numeric"
  - Auto-focus next on input
  - Paste handler splits code across all inputs
  - Backspace moves to previous
```

**Files affected:**
- `src/app/(auth)/phone-login/page.tsx` (new)

---

### Step 8: Phone Signup Page (`src/app/(auth)/phone-signup/page.tsx`)

Similar 2-step flow but collects name, DOB, and plan before sending OTP.

**Implementation spec:**

```
State:
  step: 1 | 2
  formData: { name, phone, dob, plan, channel }
  otp: string
  loading: boolean
  error: string
  countdown: number

Step 1 UI:
  - Title: "Create Account with Mobile"
  - Plan selector (same as existing signup page)
  - Input: Full Name
  - Input: Phone number with +91 prefix
  - Input: Date of Birth (same min-age validation as existing)
  - Toggle: [WhatsApp] [SMS]
  - Button: "Send OTP"
  - Link: "Sign up with email instead" → /signup
  - Link: "Already have an account?" → /phone-login

Step 1 Action (handleSendOtp):
  - Validate inputs (name required, phone 10 digits, DOB 13+ years)
  - POST /api/auth/send-otp { phone: '+91' + phone, channel }
  - On success: set step=2, start countdown

Step 2 UI:
  - Same OTP input as phone-login step 2
  - Button: "Verify & Create Account"

Step 2 Action (handleVerifyOtp):
  - Call signIn('phone-otp', { phone, code: otp, name, dob, plan, redirect: false })
  - On success: router.push('/explore')
  - On error: show error
```

**Files affected:**
- `src/app/(auth)/phone-signup/page.tsx` (new)

---

### Step 9: Update Login & Signup Pages — Add Mobile Option

Add a "Continue with Mobile" button to the existing login and signup pages.

**Login page changes** (`src/app/(auth)/login/page.tsx`):
- After the Google button, before the divider, add:
  ```tsx
  <Button variant="outline" className="w-full h-11 border-gray-300" asChild>
    <Link href="/phone-login">
      <Smartphone className="mr-2 h-5 w-5 text-green-600" />
      Continue with Mobile (OTP)
    </Link>
  </Button>
  ```
- Import `Smartphone` from `lucide-react` and `Link` from `next/link`
- Update the divider text from "or continue with email" to "or sign in with email"

**Signup page changes** (`src/app/(auth)/signup/page.tsx`):
- After the Google button, before the divider, add:
  ```tsx
  <Button variant="outline" className="w-full h-11 border-gray-300" asChild>
    <Link href="/phone-signup">
      <Smartphone className="mr-2 h-5 w-5 text-green-600" />
      Sign up with Mobile (OTP)
    </Link>
  </Button>
  ```

**Files affected:**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`

---

### Step 10: Environment Variables Documentation

Add the new OTP-related environment variables to `.env.example` (or `.env.local` for local dev).

**Actions:**
- Add the following block to `.env.example`:

```bash
# ─────────────────────────────────────────────────────────────────
# Mobile OTP Authentication
# ─────────────────────────────────────────────────────────────────
# Provider: 'twilio' for dev/production, 'fast2sms' for India production (cheaper)
OTP_PROVIDER=twilio

# Twilio (development + production)
# Sign up free at https://www.twilio.com/try-twilio (no GSTIN needed)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1415xxxxxxx          # Your Twilio number for SMS
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Sandbox: +14155238886 | Production: your WhatsApp number

# Fast2SMS (Indian production — cheaper, individual signup at fast2sms.com)
# No GSTIN required for individual/startup plan
FAST2SMS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Files affected:**
- `.env.example` (or whichever env example file exists in the project)

---

### Step 11: Type Safety — Extend NextAuth Session Types

The existing session type may need `phone` and `phoneVerified` added for completeness.

**Actions:**
- Check `src/types/next-auth.d.ts` or wherever NextAuth types are extended
- Add `phone?: string | null` and `phoneVerified?: Date | null` to the session user type if needed

**Files affected:**
- `src/types/next-auth.d.ts` (if it exists; otherwise create it)

---

### Step 12: Testing

**Dev testing with Twilio test credentials:**

1. Set `OTP_PROVIDER=twilio` in `.env.local`
2. Use Twilio test credentials (found in Twilio Console → Account Info):
   - `TWILIO_ACCOUNT_SID=ACtest...` (test SID starts with `AC`)
   - `TWILIO_AUTH_TOKEN=...` (test auth token)
3. Use Twilio's magic test phone numbers that never send real SMS:
   - `+15005550006` — always succeeds
   - `+15005550001` — invalid number (tests error handling)
   - `+15005550007` — always fails to deliver (tests delivery failure)
4. For WhatsApp sandbox: Join by messaging `join <sandbox-keyword>` to `+14155238886` on WhatsApp

**Manual test flow:**
- [ ] Navigate to `/phone-login` — page renders correctly
- [ ] Enter invalid phone (e.g., 5 digits) — validation error shown
- [ ] Enter valid test number, click "Send OTP" — success state with step 2
- [ ] Enter wrong OTP — "Invalid OTP" error shown
- [ ] Enter correct OTP — redirected to `/explore`, session established
- [ ] Navigate to `/phone-signup`, fill form, send OTP, verify — new user created in DB
- [ ] Check DB: `phone` and `phoneVerified` fields populated on User record
- [ ] Test rate limiting: send OTP 4 times in 10 min → 4th request returns 429
- [ ] Navigate to `/login` — "Continue with Mobile" button visible and navigates correctly

---

## Connections & Dependencies

### Files That Reference This Area

- `src/app/(dashboard)/layout.tsx` — checks `auth()` session; no changes needed
- `src/app/api/**` — all use `auth()` from `src/auth.ts`; phone-authed sessions will work transparently since same JWT strategy
- `src/components/layout/` — navbar/header may show user email; add phone fallback display if email is null

### Updates Needed for Consistency

- Any UI that displays `session.user.email` should handle null (phone users won't have email)
- The `content-moderation.service.ts` checks user age — ensure `age` is always set for phone users (DOB collected at signup)
- Footer or header nav that shows user info should display `name` (which is always set) instead of email as fallback

### Impact on Existing Workflows

- Existing email/password and Google OAuth users: **no impact**, both providers remain unchanged
- Phone users created without email will have `email = null` — audit all server-side code that assumes non-null email
- `plan-limits.service.ts` uses `userId` not email — no changes needed there

---

## Validation Checklist

- [ ] `npm run type-check` passes with no TypeScript errors
- [ ] `npm run lint` passes with no lint errors
- [ ] `npm run db:push` or migration succeeds — `phone` and `phoneVerified` columns exist in `users` table
- [ ] Prisma client regenerated (`npm run build` or `npx prisma generate`)
- [ ] Phone login page renders at `/phone-login`
- [ ] Phone signup page renders at `/phone-signup`
- [ ] Existing `/login` page shows "Continue with Mobile" button
- [ ] Existing `/signup` page shows "Sign up with Mobile" button
- [ ] OTP send API returns 200 with test phone number (Twilio test mode)
- [ ] OTP verify succeeds with correct code → user session created
- [ ] OTP verify fails with wrong code → error shown, session not created
- [ ] Rate limiting works: 4th OTP request in 10 min returns 429
- [ ] New phone user appears in DB with `phone`, `phoneVerified`, `name`, `age` fields set
- [ ] Existing email login still works (regression check)
- [ ] Google OAuth still works (regression check)
- [ ] Session `user.plan` and `user.age` correctly populated for phone users

---

## Success Criteria

The implementation is complete when:

1. A new user in India can sign up using only a phone number (+ name and DOB) and receive an OTP via WhatsApp or SMS, enter it, and be authenticated into the dashboard — without any email step.
2. An existing phone-registered user can log in at `/phone-login` by entering their number and OTP and be taken directly to `/explore`.
3. All existing email/password and Google OAuth flows continue to work without regression.
4. In development (Twilio test mode), the full OTP flow can be tested end-to-end without sending a real SMS or WhatsApp message.

---

## Notes

### India DLT Compliance Summary (for unregistered developers)

- **Development**: Use Twilio test credentials → no real SMS, no DLT required.
- **Production SMS**: Either (a) Twilio — they maintain DLT-registered sender IDs for India and route through them; or (b) Fast2SMS — register at fast2sms.com with your personal details (individual plan), and they handle DLT on your behalf. Neither requires GSTIN.
- **Production WhatsApp**: WhatsApp OTP completely bypasses SMS DLT regulation. Create a Meta Business Manager account with your personal name (no GSTIN required for initial access; formal business verification may be required after volume thresholds).

### Future Enhancements (Not in This Plan)

- **Phone number linking for existing email users**: Let email users add/link a phone number from Profile settings.
- **Remove email requirement for phone signup**: Make `email` truly optional by updating all downstream email assumptions.
- **Phone-based password reset**: "Forgot password? Reset via OTP" flow.
- **WhatsApp rich notifications**: Send quiz reminders via WhatsApp (not just SMS).
- **Fast2SMS production integration**: Once MVP is validated, switch from Twilio to Fast2SMS for cost savings.

---

## Implementation Notes

**Implemented:** 2026-02-23

### Summary

- Created feature branch `feature/mobile-otp-authentication`
- Installed `twilio` npm package
- Added `phone` and `phoneVerified` fields to `User` model in Prisma schema
- Regenerated Prisma client (`npx prisma generate`)
- Created `src/lib/services/otp.service.ts` — full OTP lifecycle service with Twilio + Fast2SMS providers
- Created `src/app/api/auth/send-otp/route.ts` — OTP send API with rate limiting
- Created `src/app/api/auth/verify-otp/route.ts` — OTP pre-validation API
- Updated `src/auth.ts` — added `phone-otp` CredentialsProvider for both login and signup
- Created `src/app/(auth)/phone-login/page.tsx` — 2-step phone login UI
- Created `src/app/(auth)/phone-signup/page.tsx` — 2-step phone signup UI (with email field)
- Updated `src/app/(auth)/login/page.tsx` — added "Continue with Mobile (OTP)" button
- Updated `src/app/(auth)/signup/page.tsx` — added "Sign up with Mobile (OTP)" button
- Updated `.env.example` — documented OTP provider env vars
- Updated `src/types/next-auth.d.ts` — added `age`, `phone` to session/user types

### Deviations from Plan

- **Step 2 Addendum (make email nullable) was NOT applied**: The user confirmed email is required during phone signup, so `email String @unique` remains NOT NULL. The phone-signup page collects email, and the `phone-otp` provider stores it normally.
- **`phone-otp` authorize adds `email` credential**: Since email is required, the authorize function takes email as an extra credential for new user signup and validates it isn't already in use.
- **`emailVerified` is set to `new Date()` on phone signup**: Since the user's identity was verified via phone OTP, there is no reason to also require email verification. This allows phone-signup users to log in immediately.
- The `npm run lint` wrapper has a pre-existing environment issue (exits with "Invalid project directory: .../lint"); ESLint run directly on all new/modified files shows 0 errors in new files.

### Issues Encountered

- Prisma client needed explicit regeneration (`npx prisma generate`) before type-check could pass — standard step that must be run before `npm run db:push` too.
- Pre-existing lint errors in `src/auth.ts` (no-explicit-any) and `src/app/(auth)/login/page.tsx` (unescaped apostrophe in "Don't") were present before this implementation and were not introduced by these changes.

### Next Steps Before Going Live

1. **Run `npm run db:push`** (or `npm run db:migrate`) with a live database connection to apply the schema changes.
2. **Configure Twilio credentials** in `.env.local`:  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_WHATSAPP_NUMBER`
3. **Test with Twilio test credentials**: Use phone `+15005550006` to test without real SMS.
4. **WhatsApp sandbox**: Message `join <keyword>` to `+14155238886` on WhatsApp, then test the WhatsApp channel.
5. **For production WhatsApp**: Create Meta Business Manager account (personal name ok, no GSTIN needed) and complete WhatsApp Business API setup.
6. **For production SMS (cheapest)**: Sign up at fast2sms.com, set `OTP_PROVIDER=fast2sms` and `FAST2SMS_API_KEY=...`.
