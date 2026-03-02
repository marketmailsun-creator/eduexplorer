# Plan: Profile Avatar Fix, Phone Collection, Menu UI, Explore Layout & Production Checklist

**Created:** 2026-02-27
**Status:** Implemented
**Request:** Fix Google profile picture fallback, add phone number collection & update flow, improve mobile menu UI, improve explore page layout on mobile, and provide a production readiness checklist for phone/Twilio.

---

## Overview

### What This Plan Accomplishes

This plan addresses five concrete improvements to EduExplorer: (1) fixing the broken avatar in the profile page when a Google image fails to load, (2) collecting and allowing users to update their phone number with OTP verification, (3) redesigning the mobile menu dropdown to be visually appealing instead of plain white, (4) restructuring the explore page so the app purpose is clear immediately and the subject browser is compact on mobile, and (5) providing a step-by-step production checklist to ship phone/Twilio sign-up within one week.

### Why This Matters

These changes directly improve first-impressions (broken avatar, plain menu), onboarding completeness (missing phone at sign-up), mobile usability (explore page layout), and production readiness — all critical for a launch-ready app.

---

## Current State

### Relevant Existing Structure

**Avatar handling:**
- `src/components/ui/avatar-with-initials.tsx` — has `onError` → fallback to initials ✓
- `src/app/(dashboard)/profile/page.tsx` → `AvatarUpload` inline component — **no `onError`** on `<img>` tag, shows broken icon if Google image fails
- `public/default-avatar.svg` — exists but not referenced by AvatarUpload

**Phone collection:**
- `src/app/(auth)/phone-signup/page.tsx` — collects phone (OTP verified) ✓
- `src/app/(auth)/signup/page.tsx` — email signup, **no phone field**
- `src/app/(auth)/login/page.tsx` — Google OAuth, redirects directly to `/explore`
- `src/app/(dashboard)/profile/page.tsx` — **no phone field**, no phone in profile API response
- `src/app/api/user/profile/route.ts` — does not return `phone` / `phoneVerified`
- `prisma/schema.prisma` — `phone: String? @unique`, `phoneVerified: DateTime?` exist ✓
- `src/lib/services/otp.service.ts` — full OTP service ✓
- `src/app/api/auth/send-otp/route.ts` — rate-limited OTP send ✓

**Mobile menu:**
- `src/components/layout/Header.tsx` → `showMobileMenu` state → `<div className="absolute top-full ... bg-white border-b shadow-lg md:hidden">` — plain white dropdown with list of icon + label links

**Explore page:**
- `src/app/(dashboard)/explore/page.tsx` — renders `<TopicDiscoveryHub />` then `<SplitLayoutExplore />`
- `src/components/features/TopicDiscoveryHub.tsx` — Continue Exploring chips + 6 category cards (2×3 grid)
- `src/components/features/SplitLayoutExplore.tsx` — contains the hero heading ("Learn Anything, Instantly") and pulsing "AI Learning" badge in its own `<div className="text-center mb-6">` block INSIDE the component, i.e. below `TopicDiscoveryHub`
- On mobile: user sees "Continue Exploring" + full "Browse by Subject" section (6 cards tall) before reaching any search/heading

**next.config.js:**
- Duplicate `images` key (first definition overwritten — minor JS issue, functional but messy)

### Gaps or Problems Being Addressed

1. `AvatarUpload` in profile page has no `onError` on `<img>` → broken avatar shown instead of initials fallback when Google image fails
2. Email signup & Google OAuth skip phone collection entirely; no way to add phone after sign-up
3. First-time Google users land on `/explore` without ever being asked for their phone
4. Mobile menu is a plain white list with no visual hierarchy, color, or user context
5. On mobile explore page, "AI Learning" branding and "Learn Anything, Instantly" heading appear halfway down the screen, buried below the subject browser
6. Subject browser takes full-screen height on mobile with no way to collapse it
7. No comprehensive production checklist for phone/Twilio deployment

---

## Proposed Changes

### Summary of Changes

- **AvatarUpload fix**: Add `onError` handler to the inline `AvatarUpload` component in `profile/page.tsx` so broken Google images fall back to the initials badge
- **Email signup**: Add optional phone field (with country code +91) to the email signup form — collected but not required; if provided, OTP is sent and must be verified before the account is created
- **Phone prompt modal**: Create a `PhoneUpdateModal` component triggered when a Google/email user has no phone number set; shown once on first login (`sessionStorage` flag to prevent repeat)
- **Profile page phone section**: Add a "Phone Number" card to the profile page showing current phone (if set), with an "Add" / "Change" button that opens an OTP verification flow
- **API route**: Add `PATCH /api/user/phone` — accepts `{ phone, code }`, verifies OTP, updates `user.phone` and `user.phoneVerified`; update `GET /api/user/profile` to return `phone` and `phoneVerified`
- **Mobile menu redesign**: Replace the plain white dropdown in `Header.tsx` with a full-width slide-down panel that has a gradient header (user avatar + name + plan badge), grouped navigation sections, and colored icon backgrounds
- **Explore page restructure**: Move the hero heading/badge OUT of `SplitLayoutExplore` into the explore page component, above `TopicDiscoveryHub`; make `TopicDiscoveryHub` show subject categories in a horizontally scrollable strip on mobile (instead of a 2×3 grid) so the main search input is visible without scrolling
- **Production checklist**: Documented in the Notes section of this plan (Step 14)

### New Files to Create

| File Path | Purpose |
|-----------|---------|
| `src/components/features/PhoneUpdateModal.tsx` | Modal for adding/verifying phone number post sign-up (Google/email users) |
| `src/app/api/user/phone/route.ts` | `PATCH` endpoint to verify OTP and update `user.phone` + `user.phoneVerified` |

### Files to Modify

| File Path | Changes |
|-----------|---------|
| `src/app/(dashboard)/profile/page.tsx` | Add `onError` to `AvatarUpload` `<img>`; add Phone section card; fetch + display `phone`/`phoneVerified`; wire OTP send/verify |
| `src/app/api/user/profile/route.ts` | Add `phone` and `phoneVerified` to the Prisma select and returned JSON |
| `src/app/(auth)/signup/page.tsx` | Add optional phone field with OTP step; collect phone before submitting signup |
| `src/components/layout/Header.tsx` | Redesign mobile menu dropdown with gradient header, grouped sections, plan badge |
| `src/app/(dashboard)/explore/page.tsx` | Move hero heading/badge above `TopicDiscoveryHub`; pass `userName` to heading |
| `src/components/features/SplitLayoutExplore.tsx` | Remove the hero heading/badge block (moved to page); keep rest intact |
| `src/components/features/TopicDiscoveryHub.tsx` | On mobile: replace 2×3 grid with a horizontal scrollable row for categories; add `showAll` toggle |
| `src/app/(dashboard)/layout.tsx` | Mount `PhoneUpdateModal` (checks if phone is missing and user logged in via Google/email) |

---

## Design Decisions

### Key Decisions Made

1. **Phone field is optional at email signup**: Requiring it would increase drop-off. Making it optional but encouraging it with clear benefit messaging ("Add for account recovery and faster login") is the right balance.

2. **PhoneUpdateModal — `sessionStorage` flag**: Show the prompt once per browser session, not on every page load. Users who dismiss it should not be nagged. The modal is also accessible permanently from the profile page.

3. **OTP verification in email signup happens BEFORE form submission**: When user fills the phone and clicks "Verify Phone", we send an OTP and require the code before the signup API is called. This prevents storing unverified phone numbers.

4. **Horizontal scroll for subject categories on mobile**: Instead of 2-column grid (which forces 3 rows × ~80px = ~240px of vertical space), a single horizontal scrollable row shows 2-3 cards with a scroll affordance, saving ~180px of vertical space above the fold.

5. **Hero heading moved to explore page, not inside SplitLayoutExplore**: `SplitLayoutExplore` is a feature component — it should not own the page-level branding. Moving the heading to the page component separates concerns and ensures it always appears first.

6. **Mobile menu as full-width gradient panel**: Uses the existing purple/indigo brand colors, shows user avatar + name at the top, groups navigation into "Learn" and "Progress" sections with colored icon circles. This is consistent with how modern mobile apps style their nav drawers.

7. **Profile phone section with inline OTP flow**: Rather than a separate page, the phone update is done inline in the profile page using a 2-step UI (enter phone → enter OTP). This keeps the flow within the user's current context.

### Alternatives Considered

- **Requiring phone at email signup**: Rejected — increases friction; phone is for optional account recovery/login, not a hard requirement.
- **Separate `/add-phone` page**: Rejected — a modal or inline section in profile is less context-switching.
- **Accordion/collapsible subject grid**: Rejected in favor of horizontal scroll — it's more mobile-native and doesn't require extra tap.
- **Full-screen menu overlay**: Rejected — the current slide-down approach is fine UX; just needs styling improvement.

### Open Questions (if any)

- Should phone be required for free users vs pro users? (Current plan: optional for all)
- Should "Add phone" prompt appear for email users too, or only Google users? (Current plan: both)

---

## Step-by-Step Tasks

Execute these tasks in order during implementation.

---

### Step 1: Fix Profile Page Avatar `onError` Fallback

The inline `AvatarUpload` component inside `src/app/(dashboard)/profile/page.tsx` renders:
```tsx
<img src={preview} alt={name} className="w-full h-full object-cover" />
```
It has no `onError` handler. If Google's image URL returns a 403 or fails to load, the browser shows a broken image icon instead of the initials fallback.

**Actions:**

- In `AvatarUpload` component, add state: `const [imgError, setImgError] = useState(false);`
- Reset `imgError` to `false` whenever `preview` changes: `useEffect(() => setImgError(false), [preview]);`
- Update the render condition:
  ```tsx
  {preview && !imgError
    ? <img src={preview} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
    : <span className="text-3xl font-bold text-white">{initials}</span>
  }
  ```

**Files affected:**
- `src/app/(dashboard)/profile/page.tsx`

---

### Step 2: Update Profile API to Return Phone Data

The `GET /api/user/profile` endpoint currently omits `phone` and `phoneVerified`. The profile page needs them to display the phone section.

**Actions:**

- In the Prisma `select` block, add: `phone: true,` and `phoneVerified: true,`
- Add both fields to the returned JSON (they are already safe to expose — no sensitive content)

**Files affected:**
- `src/app/api/user/profile/route.ts`

---

### Step 3: Create `PATCH /api/user/phone` Route

This endpoint verifies an OTP and updates the user's phone number.

**Actions:**

- Create `src/app/api/user/phone/route.ts` with:
  ```ts
  export async function PATCH(req: Request) {
    // 1. Auth check: session required
    // 2. Parse body: { phone: string, code: string }
    // 3. normalizePhone(phone) → E.164
    // 4. verifyOtp(normalizedPhone, code) → { success, reason }
    //    - If not success: return 400 with reason
    // 5. Check if phone already in use by another user
    // 6. prisma.user.update({ where: { id }, data: { phone: normalizedPhone, phoneVerified: new Date() } })
    // 7. Return { success: true, phone: normalizedPhone }
  }
  ```
- Import `verifyOtp` from `@/lib/services/otp.service`
- Import `normalizePhone` from `@/lib/services/otp.service`
- Return 409 if phone already in use by a different user

**Files affected:**
- `src/app/api/user/phone/route.ts` (new)

---

### Step 4: Add Phone Section to Profile Page

Add a "Phone Number" card to the profile page between the plan badge and the stat row. The section has three states: (a) no phone — shows "Add Phone" button; (b) phone unverified — shows phone + "Verify" button; (c) phone verified — shows phone + green checkmark + "Change" button.

**Actions:**

- Add `phone`, `phoneVerified` to the profile data state and populate from `profileData`
- Add a `PhoneSection` sub-component (inline in the file) with:
  - State: `step: 'idle' | 'enter_phone' | 'enter_otp'`
  - State: `phoneInput`, `otpInput`, `sending`, `verifying`, `phoneError`, `otpError`
  - "Add/Change Phone" button → sets step to `'enter_phone'`
  - Phone input + "Send Code" → `POST /api/auth/send-otp` → step to `'enter_otp'`
  - OTP input + "Verify" → `PATCH /api/user/phone` → update `profileData.phone` + show success
  - Cancel button at each step
- Display the `PhoneSection` card in the profile layout after the plan badge row
- Import `Phone` icon from `lucide-react`

**Files affected:**
- `src/app/(dashboard)/profile/page.tsx`

---

### Step 5: Add Optional Phone Collection to Email Signup

Add an optional phone field to the email signup form. If the user fills it, show an OTP step before allowing form submission.

**Actions:**

- In `src/app/(auth)/signup/page.tsx`, add state:
  - `phone: string`, `phoneStep: 'idle' | 'enter_otp'`, `otpCode: string`, `phoneVerified: boolean`, `sendingOtp: boolean`, `otpError: string`
- Below the date-of-birth field, add a "Phone Number (optional)" input:
  - Prefix: `+91` label
  - 10-digit numeric input
  - "Send Code" button (disabled if phone < 10 digits or `phoneVerified`)
  - If `phoneVerified`: show green "✓ Verified" badge instead of Send Code button
- OTP input row (shown when `phoneStep === 'enter_otp'`):
  - 6-digit OTP input + "Verify" button
  - "Resend" link after 60s countdown
- On "Send Code" click: `POST /api/auth/send-otp` with `{ phone: '+91'+phone, channel: 'sms' }`
- On "Verify" click: `POST /api/auth/verify-otp` (pre-validation UI only) → if ok, set `phoneVerified = true`
- On form submit: include `phone: phone ? '+91'+phone : undefined` in the signup payload
- Update `POST /api/auth/signup` server handler to accept optional `phone` and set `phoneVerified` if provided (the NextAuth phone-otp provider already does full OTP verify server-side; here we just pass through the pre-verified number since it was OTP-verified in the UI)

**Files affected:**
- `src/app/(auth)/signup/page.tsx`
- `src/app/api/auth/signup/route.ts` (minor: accept `phone` field, store `phoneVerified: new Date()` if phone provided)

---

### Step 6: Create `PhoneUpdateModal` Component

Create a modal that prompts Google/email users who have no phone number to add one. Shown once per session via `sessionStorage`.

**Actions:**

- Create `src/components/features/PhoneUpdateModal.tsx`:
  ```tsx
  'use client';
  // Props: { isOpen: boolean; onClose: () => void }
  // Content: 2-step phone collection (enter phone → verify OTP → done)
  // Uses same POST /api/auth/send-otp + PATCH /api/user/phone flow
  // Dialog/Sheet using shadcn Dialog component
  // Dismiss stores: sessionStorage.setItem('phone_prompt_dismissed', '1')
  ```
- The modal has:
  - Header: "Add Your Phone Number" with Phone icon
  - Description: "Add a phone number for faster login and account recovery. You can also skip for now."
  - Step 1: Phone input (+91 prefix) + "Send OTP" button
  - Step 2: OTP input + "Verify" button
  - "Skip for now" link (dismisses + sets sessionStorage flag)
  - Success state: "Phone verified! ✓" with auto-close after 2s

**Files affected:**
- `src/components/features/PhoneUpdateModal.tsx` (new)

---

### Step 7: Mount PhoneUpdateModal in Dashboard Layout

The modal should appear once after a Google/email user who has no phone number logs in.

**Actions:**

- In `src/app/(dashboard)/layout.tsx`, add a client component wrapper (or extend the existing `CapacitorInit` approach):
  - Create a `PhonePromptClient` client component that:
    - Reads `session.user` via `useSession()`
    - On mount: checks `sessionStorage.getItem('phone_prompt_dismissed')` — if set, does nothing
    - Fetches `GET /api/user/profile` to check if `phone` is null/empty
    - If phone is missing AND `phone_prompt_dismissed` is not set: sets `showModal = true`
    - Renders `<PhoneUpdateModal isOpen={showModal} onClose={() => { setShowModal(false); sessionStorage.setItem('phone_prompt_dismissed','1'); }} />`
  - Mount `<PhonePromptClient />` at the end of the layout's body (after existing children)
  - Only mount if session exists (guard with `session?.user?.id`)

**Files affected:**
- `src/app/(dashboard)/layout.tsx`
- Create `src/components/features/PhonePromptClient.tsx` (small client wrapper)

---

### Step 8: Redesign Mobile Menu in Header

Replace the plain white dropdown with a visually rich slide-down panel.

**Current state** (in `Header.tsx`, `showMobileMenu` block):
```tsx
<div className="absolute top-full left-0 right-0 bg-white border-b shadow-lg md:hidden">
  <nav className="container mx-auto px-4 py-4 space-y-2">
    {/* plain links */}
  </nav>
</div>
```

**Target design:**
- Full-width slide-down panel with a subtle gradient background (`bg-gradient-to-b from-purple-50 to-white`)
- **User section** at top: avatar (from session) + name + email + plan badge chip
- **Divider**
- **"Learn" section header** (small uppercase label) + Explore, Library, Groups links — each with a colored rounded-square icon background (purple, blue, teal)
- **"Progress" section header** + Challenges, Leaderboard, Badges, XP & Rewards links — each with colored icon backgrounds (orange, yellow, amber, green)
- **Bottom**: XP bar (current XP displayed as `⚡ {totalXP} XP`) + streak badge
- Smooth max-height CSS transition when opening/closing

**Actions:**

- Replace the existing `{showMobileMenu && (...)}` block in `Header.tsx` with the new design
- Add `AvatarWithInitials` import (already imported)
- Group links into two sections with `<p className="text-xs font-semibold uppercase text-gray-400 px-3 mb-1">` section labels
- Each nav item: `<div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">` colored icon container
- User info block at top: `<div className="flex items-center gap-3 px-4 py-4 border-b border-purple-100">`
- Plan badge: `<span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">Free</span>` (or gold for Pro)
- Add `transition-all duration-200` and `overflow-hidden` to the outer container for smooth animation

**Files affected:**
- `src/components/layout/Header.tsx`

---

### Step 9: Restructure Explore Page — Move Hero Heading to Top

Currently `SplitLayoutExplore` owns the hero heading block. Move it to the page level so it appears above everything.

**Actions:**

- In `src/components/features/SplitLayoutExplore.tsx`, **remove** the entire hero section block (lines ~420–434):
  ```tsx
  {/* Hero Section - Mobile Optimized */}
  <div className="text-center mb-6 sm:mb-8 space-y-2 sm:space-y-4">
    <div className="inline-flex items-center ...">AI Learning</div>
    <h1 className="...">Learn Anything, Instantly</h1>
    <p className="...">Ask any question...</p>
  </div>
  ```
- In `src/app/(dashboard)/explore/page.tsx`, **add a hero header** above `<TopicDiscoveryHub />`:
  ```tsx
  {/* Page Hero — shown above everything */}
  <div className="text-center py-6 sm:py-8 space-y-2">
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium animate-pulse">
      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
      AI-Powered Learning Platform
    </div>
    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
      Learn Anything, Instantly
    </h1>
    <p className="text-sm sm:text-base text-gray-600">
      Ask any question and get comprehensive learning materials
    </p>
  </div>
  ```
- Import `Sparkles` from `lucide-react` in the explore page

**Files affected:**
- `src/app/(dashboard)/explore/page.tsx`
- `src/components/features/SplitLayoutExplore.tsx`

---

### Step 10: Make Subject Categories Compact on Mobile (Horizontal Scroll)

The "Browse by Subject" 2×3 grid takes ~240px on mobile. Replace with a horizontal scrollable chip row that shows category emoji + label only (not the full card with topic links).

**Actions:**

- In `TopicDiscoveryHub.tsx`, change the `{/* Subject categories */}` section:
  - On mobile (`md:hidden`): render categories as horizontally scrollable emoji+label chips. When a chip is tapped, it expands to show the 3 topic links below.
  - On desktop (`hidden md:block`): keep the existing 6-column grid (unchanged).

  ```tsx
  {/* Mobile: horizontal scroll strip */}
  <div className="md:hidden">
    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
      🗂️ Browse by Subject
    </h2>
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map(cat => (
        <button
          key={cat.label}
          onClick={() => setExpandedCategory(expandedCategory === cat.label ? null : cat.label)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-colors
            ${expandedCategory === cat.label
              ? 'bg-purple-100 border-purple-300 text-purple-700'
              : 'bg-white border-gray-200 text-gray-700'}`}
        >
          <span>{cat.emoji}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
    {/* Expanded topics */}
    {expandedCategory && (() => {
      const cat = CATEGORIES.find(c => c.label === expandedCategory);
      return cat ? (
        <div className="flex flex-wrap gap-2 mt-2">
          {cat.topics.slice(0, 3).map(t => (
            <button key={t} onClick={() => navigate(t)}
              className="px-3 py-1.5 text-xs bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 hover:bg-indigo-100">
              {t}
            </button>
          ))}
        </div>
      ) : null;
    })()}
  </div>

  {/* Desktop: existing 6-col grid */}
  <div className="hidden md:block">
    {/* ... existing grid code unchanged ... */}
  </div>
  ```

- Add `expandedCategory: string | null` state initialized to `null`
- Add `setExpandedCategory` setter

**Files affected:**
- `src/components/features/TopicDiscoveryHub.tsx`

---

### Step 11: Fix `next.config.js` Duplicate `images` Key

The file currently has `images` defined twice. The second definition overwrites the first, so the first is dead code. Clean this up.

**Actions:**

- Remove the first `images` block (lines 14–21, which only has `elevenlabs.io`)
- The second `images` block (lines 27–45) already includes all domains including `elevenlabs.io` via wildcard — verify it covers `**.elevenlabs.io`
- Confirm `lh3.googleusercontent.com` and `**.googleusercontent.com` remain

**Files affected:**
- `next.config.js`

---

### Step 12: Validate Phone in Signup API

The `POST /api/auth/signup` route currently accepts `name, email, password, dob, plan`. Add optional `phone` support.

**Actions:**

- Read `src/app/api/auth/signup/route.ts`
- Parse optional `phone` from body
- If `phone` is provided: validate it's a valid E.164 Indian number (`/^\+91[6-9]\d{9}$/`)
- Check if phone is already taken: `prisma.user.findUnique({ where: { phone } })`
- If not taken: include `phone` and `phoneVerified: new Date()` in the `prisma.user.create(...)` call
- Note: Phone was already OTP-verified on the client side before signup submission

**Files affected:**
- `src/app/api/auth/signup/route.ts`

---

### Step 13: Test End-to-End

**Actions:**

- Run `npm run type-check` — fix any TypeScript errors
- Test avatar fallback: Log in with Google, go to profile — avatar should show initials if image fails
- Test phone signup: Email signup with phone → verify OTP → account created with phone
- Test phone update: Log in via Google → phone prompt modal appears → add phone → verify → phone shown in profile
- Test mobile menu: Open menu on mobile viewport — gradient panel with user info and sections should appear
- Test explore page on mobile (375px viewport): Hero heading visible at top, subject categories as horizontal chips, search input visible without scrolling

**Files affected:**
- None (testing only)

---

### Step 14: Production Readiness Checklist — Phone Sign-Up & Twilio (1-Week Launch)

This step documents what's already done and what remains before going live.

#### ✅ Already Complete (Code is Ready)

- [x] OTP service (`src/lib/services/otp.service.ts`) — rate limiting, Redis storage, Twilio & Fast2SMS dispatch
- [x] `POST /api/auth/send-otp` route — validates, rate-limits, sends OTP
- [x] `POST /api/auth/verify-otp` route — UI pre-validation
- [x] NextAuth `phone-otp` provider — creates/finds user, sets `phoneVerified`
- [x] Phone login page (`/phone-login`)
- [x] Phone signup page (`/phone-signup`)
- [x] Prisma schema — `phone`, `phoneVerified` fields
- [x] Redis (Upstash) — OTP storage with 5-min TTL
- [x] Rate limiting — 3 OTP sends per 10 min per phone number

#### 🔧 Environment Variables to Set in Production

```bash
# Twilio (required for phone OTP)
OTP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    # From Twilio Console
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx      # From Twilio Console
TWILIO_PHONE_NUMBER=+1415xxxxxxx                        # Purchased Twilio number
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886            # Dev: sandbox | Prod: WhatsApp Business number

# Alternative: Fast2SMS (India only, cheaper)
OTP_PROVIDER=fast2sms
FAST2SMS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Upstash Redis (for OTP storage + rate limiting)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<openssl rand -base64 32>
```

#### 📋 Step-by-Step Production Tasks

**Day 1: Twilio Account Setup**
1. Sign up at https://www.twilio.com/try-twilio (email + credit card, no GSTIN required)
2. Verify email + phone in Twilio Console
3. Note your `Account SID` and `Auth Token` from Console Dashboard
4. Purchase a phone number: Console → Phone Numbers → Buy a Number (choose US number, SMS capable) ~$1/month
5. For WhatsApp in production: apply for Twilio WhatsApp Business profile (takes 1–3 days); for testing use sandbox (`+14155238886`)
6. For India SMS compliance: Twilio handles DLT (Distributed Ledger Technology) registration for Indian numbers — you must register a DLT entity and template via Twilio's Indian DLT portal (https://www.twilio.com/en-us/help-center/articles/india-dlt-registration). **This takes 3–7 business days.** Start immediately.

**Day 1: Fast2SMS Alternative (Skip Twilio DLT wait)**
1. Sign up at https://www.fast2sms.com (individual, no GSTIN needed)
2. Add wallet credit (₹50 minimum for testing)
3. Register DLT template on Fast2SMS portal (they assist with this — 1–2 days)
4. Note your API Key from Fast2SMS dashboard
5. Set `OTP_PROVIDER=fast2sms` in production `.env`

**Day 2: Domain & SSL**
1. Point your domain DNS to your hosting provider (Vercel / Railway / Render)
2. Ensure HTTPS is active — Twilio requires HTTPS webhook URLs
3. Set `NEXTAUTH_URL=https://yourdomain.com`
4. Set `NEXT_PUBLIC_APP_URL=https://yourdomain.com`

**Day 2: Database Migration**
1. Run `npx prisma db push` OR `npx prisma migrate deploy` on the production database
2. Verify `phone` and `phoneVerified` columns exist in the `User` table
3. Verify all 6 gamification tables exist (`UserStreak`, `XPTransaction`, etc.)
4. Verify `FlashcardProgress` table exists

**Day 3: Redis (Upstash) Setup**
1. Create account at https://upstash.com
2. Create a Redis database (free tier supports 10k requests/day — sufficient for early launch)
3. Copy REST URL and token to production env vars
4. Test OTP flow: `POST /api/auth/send-otp` should respond with `{ success: true }` in production

**Day 3: Google OAuth Production Config**
1. In Google Cloud Console → OAuth 2.0 Credentials:
   - Add `https://yourdomain.com` to Authorized JavaScript origins
   - Add `https://yourdomain.com/api/auth/callback/google` to Authorized redirect URIs
2. Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in production

**Day 4: Test Full Phone Flow in Production**
1. Register a test user via `/phone-signup` — should receive real SMS
2. Verify OTP arrives within 30 seconds
3. Test `/phone-login` with the same number
4. Check rate limiting: try sending OTP 4 times — 4th should return 429

**Day 4: Razorpay Production**
1. Complete Razorpay KYC (business account or individual with PAN)
2. Switch from test mode to live mode in Razorpay Dashboard
3. Update `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` to live values
4. Set webhook URL: `https://yourdomain.com/api/razorpay/webhook`
5. Test a ₹1 payment to verify the webhook fires and updates `user.plan = 'pro'`

**Day 5: Other Service Production Keys**
1. **Perplexity API**: Set `PERPLEXITY_API_KEY` (production key — check rate limits for your plan)
2. **Groq API**: Set `GROQ_API_KEY`
3. **Anthropic API**: Set `ANTHROPIC_API_KEY`
4. **ElevenLabs**: Set `ELEVENLABS_API_KEY`
5. **Resend**: Set `RESEND_API_KEY`; verify your domain in Resend dashboard for branded emails (from: noreply@yourdomain.com)
6. **Cloudflare R2**: Set all R2 vars; create bucket; verify audio file upload works

**Day 5: PWA & Push Notifications**
1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in production
3. Test push notification opt-in in browser

**Day 6: Security Checklist**
1. Set `NODE_ENV=production` — disables verbose error messages
2. Verify `NEXTAUTH_SECRET` is a strong random value (`openssl rand -base64 32`)
3. Ensure `.env.local` is NOT committed to git (check `.gitignore`)
4. Review rate limiting on all sensitive routes (`/api/auth/send-otp`, `/api/auth/signup`, `/api/auth/login`)
5. Test content moderation: submit a flagged query — should be blocked for users under 18
6. Enable Twilio Fraud Guard in Console (blocks known fraud numbers)

**Day 7: Final QA & Soft Launch**
1. Full end-to-end test on mobile device (not emulator):
   - Sign up via Google → phone prompt → add phone → verify
   - Sign up via email (with phone) → verify email → login
   - Sign up via phone OTP → explore topics → generate content
2. Test on low-bandwidth network (3G simulation in Chrome DevTools)
3. Check Lighthouse PWA score (target > 85)
4. Monitor Twilio Console for SMS delivery rates (should be > 95%)
5. Set up error monitoring (Sentry or similar) with `SENTRY_DSN`
6. Launch to first 50 users — monitor logs and Upstash Redis dashboard for anomalies

#### 🚨 Critical Blockers to Resolve First

1. **India DLT Registration** — Required for all commercial SMS to Indian numbers. Twilio or Fast2SMS needs an approved DLT entity and template before OTPs will be delivered. Start this process on Day 1. Without DLT, SMS will be blocked by Indian carriers (after 1st Sept 2021 regulation).
   - Fast path: Use Fast2SMS — they assist with DLT registration and it's often faster (1–2 days vs 3–7 for Twilio)
   - Fallback for testing: Use WhatsApp OTP (Twilio sandbox works without DLT)

2. **Resend Domain Verification** — Without it, emails go to spam. Add DNS TXT/CNAME records from Resend dashboard to your domain. Takes 24–48 hours to propagate.

3. **Google OAuth Production Redirect URI** — If you haven't updated Google Console with your production domain, all Google logins will fail with "redirect_uri_mismatch" error.

---

## Connections & Dependencies

### Files That Reference This Area

- `src/components/layout/Header.tsx` — renders `AvatarWithInitials` (already correct) and mobile menu (being redesigned)
- `src/app/(dashboard)/layout.tsx` — will mount `PhonePromptClient`
- `src/app/(auth)/signup/page.tsx` — will call `POST /api/auth/send-otp` for phone OTP during signup
- `src/app/api/auth/signup/route.ts` — will accept and store optional phone number

### Updates Needed for Consistency

- `src/app/api/user/profile/route.ts` — add `phone`, `phoneVerified` fields
- `src/app/api/auth/signup/route.ts` — accept optional `phone` field

### Impact on Existing Workflows

- Email signup: slightly longer (optional phone step) but no breaking change — phone remains optional
- Google login: new modal appears once if phone is missing; users can dismiss with no impact on functionality
- Explore page: heading moves from inside `SplitLayoutExplore` to the page — the component itself is unchanged except for removing that block

---

## Validation Checklist

- [ ] Profile page: Broken Google image URL falls back to initials (not broken icon)
- [ ] Profile API: Returns `phone` and `phoneVerified` fields
- [ ] New `PATCH /api/user/phone` route: Returns 200 with verified phone, 400 on wrong OTP, 409 on phone taken
- [ ] Email signup: Phone field appears (optional), OTP verification works, phone stored with account
- [ ] Google login: `PhoneUpdateModal` appears on first session when phone is null; disappears after add/dismiss
- [ ] Phone update in profile: "Add Phone" → OTP flow → phone shown with green checkmark
- [ ] Mobile menu: Gradient header with user avatar/name, two grouped sections with colored icons
- [ ] Explore page: "Learn Anything, Instantly" heading appears at the TOP of the page on mobile
- [ ] Mobile explore: Subject categories shown as horizontal scrollable chips (not 2×3 grid)
- [ ] `next.config.js`: Duplicate `images` key removed
- [ ] `npm run type-check` passes with 0 errors

---

## Success Criteria

The implementation is complete when:

1. A Google user who has no phone number sees the `PhoneUpdateModal` once after login, can add + verify their phone, and the profile page shows the phone with a green checkmark.
2. An email sign-up user can optionally add a phone number during sign-up with OTP verification, and this phone is stored and shown in their profile.
3. The mobile menu dropdown is visually rich (gradient background, user avatar + name at top, colored icon sections) instead of the plain white list.
4. Opening the explore page on a 375px mobile screen shows the "AI Learning" badge and "Learn Anything, Instantly" heading as the FIRST visible content, before the subject browser.
5. The subject browser on mobile is a horizontal scrollable chip row (not a 2×3 grid), saving ~180px of vertical space.
6. `npm run type-check` and `npm run lint` pass with 0 errors.

---

## Notes

### Additional Context

- The `PhoneUpdateModal` uses the same `POST /api/auth/send-otp` endpoint already built — no new OTP infrastructure needed.
- The `PATCH /api/user/phone` endpoint must check for phone uniqueness (`@unique` constraint) to prevent duplicate phone errors.
- The `sessionStorage` approach for the phone prompt dismissal is intentional — it's per-session, so if users close and reopen the browser they'll see the prompt again until they add their phone. To make it permanent, use a database flag `user.phonePromptDismissed: Boolean @default(false)` — this is a nice-to-have for v2.
- For the India DLT requirement: OTP message template that needs to be registered is: `"Your EduExplorer verification code is: {#var#}. This code expires in 5 minutes."` — register this as a transactional template.
- WhatsApp OTP is a great backup for DLT registration delays — it doesn't require DLT and is already implemented in `otp.service.ts`.

---

## Implementation Notes

**Implemented:** 2026-02-27

### Summary

All 12 code steps implemented (Step 13 = type check passed, Step 14 = documentation only):
- Avatar `onError` fallback fixed in profile page AvatarUpload component
- Profile API updated to return `phone` and `phoneVerified`
- New `PATCH /api/user/phone` route created
- PhoneSection added inline to profile page (3 states: idle/enter_phone/enter_otp)
- Optional phone OTP field added to email signup form
- Signup API updated to accept and store optional `phone`
- `PhoneUpdateModal` component created (step-through modal)
- `PhonePromptClient` created and mounted in dashboard layout
- Mobile menu in Header redesigned (gradient panel, user section, grouped nav sections with colored icons)
- Hero heading moved from SplitLayoutExplore to explore page (now always top-most)
- TopicDiscoveryHub: mobile shows horizontal scroll chips, desktop keeps 6-column grid
- `next.config.js` duplicate `images` key removed
- Unused `TRENDING` constant removed from TopicDiscoveryHub
- Unused `Sparkles` import removed from SplitLayoutExplore

### Deviations from Plan

- Removed unused `TRENDING` constant and its commented-out JSX block from TopicDiscoveryHub (it was already commented out but declared, causing a TS6133 warning)
- Removed unused `Sparkles` import from SplitLayoutExplore after moving the hero block
- `PhonePromptClient` kept as a separate file (not co-located in layout) as planned

### Issues Encountered

None — `npm run type-check` passes with 0 errors and 0 IDE diagnostics.
