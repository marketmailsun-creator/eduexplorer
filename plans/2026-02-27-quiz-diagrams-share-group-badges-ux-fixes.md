# Plan: Quiz Scroll Fix, Diagram Enhancement, Share Design, Group Navigation, Badge Bug, XP Banner, Menu UX & API Cost Analysis

**Created:** 2026-02-27
**Status:** Implemented
**Request:** Fix 9 issues: quiz scroll bug, diagram visuals, share button design, group content navigation, perfect-score badge bug, challenge quiz navigation, persistent XP banner, mobile menu click-outside, API cost estimation.

---

## Overview

### What This Plan Accomplishes

Fixes 7 functional bugs and UX deficiencies across the EduExplorer app, plus provides a full API cost breakdown for 1000 users over 3-4 months. The changes cover the quiz section, diagram rendering, share dialogs, group content links, achievement awarding, XP banner visibility, and mobile navigation UX.

### Why This Matters

Several features are broken (badge unlocking incorrectly, wrong navigation routes, quiz scrolling away from context) which erodes user trust. The UX improvements (menu click-outside, persistent XP banner) increase discoverability of key features. The cost analysis helps the team plan infrastructure spend before scaling.

---

## Current State

### Relevant Existing Structure

| File | Area |
|------|------|
| `src/components/features/PracticeQuizViewer.tsx` | Quiz viewer — `quizComplete` state causes DOM swap, triggers scroll |
| `src/components/features/DiagramViewer.tsx` | Uses `mermaid.ink/img/` — basic black/white PNG, no theming |
| `src/components/social/ShareButton.tsx` | "Share to Groups" button has broken className; custom DOM toast instead of shadcn |
| `src/app/(dashboard)/groups/[id]/page.tsx` | Shared content links to `/query/{id}` — wrong route |
| `src/lib/services/achievement.service.ts` | `hasPerfectQuiz` — `undefined !== '0'` bug when raw SQL returns empty array |
| `src/app/(dashboard)/challenges/[id]/page.tsx` | "Take Quiz Now" links to `/query/{id}` — wrong route |
| `src/app/(dashboard)/layout.tsx` | XP redemption info only on `/xp` page — not visible elsewhere |
| `src/components/layout/Header.tsx` | Mobile menu has no click-outside handler |

### Gaps or Problems Being Addressed

1. **Quiz scroll bug** — `setQuizComplete(true)` replaces the quiz JSX with a results card, changing DOM height and causing a layout jump that scrolls the user to a different section (flashcards).
2. **Diagram visuals** — `mermaid.ink/img/` produces basic black-and-white PNG images. The SVG endpoint with theme support produces full-color diagrams at no extra cost.
3. **Share button design** — The "Share to Groups" button has an empty `className` blob with no background/text color. The `handleShareToGroups` function injects custom DOM toast elements instead of using the existing `useToast` hook.
4. **Group content navigation** — `href={/query/${shared.content.query.id}}` → `/query/` is not a valid dashboard route. The correct route is `/results/[id]`.
5. **Badge bug** — In `achievement.service.ts`: when `$queryRaw` returns `[]` (no rows), `[0]?.count` is `undefined`. `undefined !== '0'` evaluates to `true`, causing `hasPerfectQuiz = true` even with no perfect scores.
6. **Challenge quiz navigation** — Same wrong route: `href={/query/${challenge.query.id}}` → should be `/results/[id]`.
7. **XP banner** — "100 XP = ₹100 Amazon voucher" message is buried on the `/xp` page. A dismissable persistent banner in the layout would make it visible everywhere.
8. **Mobile menu click-outside** — `showMobileMenu` has no outside-click handler. Users must press the X button. The desktop dropdown already has an overlay div for this.
9. **API cost** — No documented cost breakdown exists. 1000-user estimate needed.

---

## Proposed Changes

### Summary of Changes

- **PracticeQuizViewer**: Add `containerRef` + `scrollIntoView` after `setQuizComplete(true)` to keep viewport in quiz section
- **DiagramViewer**: Switch from `mermaid.ink/img/` to `mermaid.ink/svg/` with `?theme=default` for rich color rendering; add gradient wrapper UI
- **ShareButton**: Fix "Share to Groups" button styling; replace custom DOM toast with `useToast`
- **groups/[id]/page.tsx**: Fix href from `/query/` to `/results/`
- **achievement.service.ts**: Fix `hasPerfectQuiz` boolean — check `Number(count) > 0`
- **challenges/[id]/page.tsx**: Fix href from `/query/` to `/results/`
- **layout.tsx + new XPRedemptionBanner**: Create dismissable floating banner component; mount in dashboard layout
- **Header.tsx**: Add click-outside overlay for mobile menu (same pattern as desktop dropdown)
- **plans/ (this file)**: API cost documentation in Notes section

### New Files to Create

| File Path | Purpose |
|-----------|---------|
| `src/components/features/XPRedemptionBanner.tsx` | Dismissable "100 XP = ₹100 Amazon voucher" banner, shown once per session |

### Files to Modify

| File Path | Changes |
|-----------|---------|
| `src/components/features/PracticeQuizViewer.tsx` | Add `containerRef`, scroll to quiz section on complete |
| `src/components/features/DiagramViewer.tsx` | Switch to SVG endpoint with theme; add gradient card wrapper |
| `src/components/social/ShareButton.tsx` | Fix Share to Groups button className; replace DOM toast with `useToast` |
| `src/app/(dashboard)/groups/[id]/page.tsx` | Change `/query/` to `/results/` in shared content links |
| `src/lib/services/achievement.service.ts` | Fix `hasPerfectQuiz` undefined comparison bug |
| `src/app/(dashboard)/challenges/[id]/page.tsx` | Change `/query/` to `/results/` in Take Quiz Now link |
| `src/app/(dashboard)/layout.tsx` | Mount `<XPRedemptionBanner />` |
| `src/components/layout/Header.tsx` | Add click-outside overlay for mobile menu |

---

## Design Decisions

### Key Decisions Made

1. **Diagram rendering — SVG over installing mermaid npm package**: `mermaid.ink/svg/{encoded}?theme=default` gives full-color diagrams without adding a package dependency or changing the server-side generation flow. The mermaid npm package approach would require complex `useEffect` initialization and SSR guards, while the API approach works instantly.

2. **XPRedemptionBanner — separate client component**: Dismissal state needs `sessionStorage` (client-only). Keeping it as a separate `'use client'` component means the dashboard layout stays a server component.

3. **Share button custom toast → useToast**: The DOM injection approach adds `<style>` tags to `<head>` on every share attempt (memory leak). The existing `useToast` from `@/hooks/use-toast` is already imported in the file; using it is simpler and consistent.

4. **Mobile menu click-outside — invisible overlay div**: Same pattern as the desktop dropdown (lines 134-137 in Header.tsx). This is already proven in the codebase and doesn't require adding a `useRef`/document event listener.

5. **Quiz scroll — `scrollIntoView` on `quizComplete` state change**: The container ref approach is the most reliable way to keep the quiz section in view across different screen sizes and layout structures. Using `useEffect` + `behavior: 'smooth'` gives a polished experience.

### Alternatives Considered

- **Mermaid npm package**: Would give interactive SVG and full theming control, but adds bundle weight (~2.5MB) and SSR complexity. The mermaid.ink SVG endpoint achieves the same visual result.
- **Custom DOM toast for groups share**: Already implemented but has memory leak (adds `<style>` tags). Replaced with `useToast`.
- **sessionStorage vs localStorage for XP banner**: sessionStorage chosen so the banner reappears each browser session (keeps it visible to users), but not on every navigation within a session (avoids annoyance).

### Open Questions

None. All decisions can be made without user input.

---

## Step-by-Step Tasks

### Step 1: Fix quiz scroll bug in PracticeQuizViewer

The issue: `setQuizComplete(true)` causes the component to render a completely different JSX tree (the results card), which changes the DOM height. If the quiz section is mid-page (e.g., on the right column in a 2-column layout), this reflow can scroll the viewport to a different section.

**Fix**: Add a `containerRef` to the outer wrapper div. In `handleQuizComplete`, after setting state, use `useEffect` to watch `quizComplete` and call `containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })` when it becomes true.

**Actions:**

- Add `useRef` to imports
- Add `const containerRef = useRef<HTMLDivElement>(null);`
- Add `useEffect(() => { if (quizComplete) { containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } }, [quizComplete]);`
- Add `ref={containerRef}` to the top-level `<div>` returned by both the active quiz and the complete screen paths
- Use `block: 'nearest'` to only scroll if the element is out of view (avoids unnecessary scroll if it's already visible)

**Files affected:**
- `src/components/features/PracticeQuizViewer.tsx`

---

### Step 2: Improve diagram rendering quality

Switch from `mermaid.ink/img/{encoded}` to `mermaid.ink/svg/{encoded}?bgColor=!white&theme=default` which produces a full-color SVG with proper node colors. Additionally, wrap the SVG in an `<img>` tag (same as before, since it's a URL) but switch the container to a gradient card with a colored header showing the diagram type.

**Actions:**

- In `DiagramViewer.tsx`, change the URL construction from:
  ```
  const imageUrl = `https://mermaid.ink/img/${encoded}`;
  ```
  to:
  ```
  const encoded = btoa(unescape(encodeURIComponent(currentDiagram.mermaidCode)));
  const imageUrl = `https://mermaid.ink/svg/${encoded}`;
  ```
  Note: use `btoa(unescape(encodeURIComponent(...)))` to safely handle Unicode characters in mermaid code.

- Replace the plain `bg-white border-2 border-gray-200 rounded-lg` container with a gradient card:
  - Add a colored header strip showing diagram type with icon (🔀 for flowchart, 📊 for other types)
  - Change container background to `bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100`
  - Add a subtle `shadow-md` to the card

- Update the `<img>` to use `className="max-w-full h-auto"` and remove the `max-h` limits that were truncating tall diagrams

- Add diagram type emoji mapping: `flowchart → 🔀`, `sequence → 📋`, `class → 🏗️`, `state → ⚙️`, `er → 🗄️`, default → `📊`

**Files affected:**
- `src/components/features/DiagramViewer.tsx`

---

### Step 3: Fix ShareButton design issues

Two issues to fix:
1. The "Share to Groups" button has a broken `className` with no background color or text color
2. `handleShareToGroups` injects custom DOM toast elements instead of using the imported `useToast`

**Actions:**

- In the `handleShareToGroups` function, remove the entire `showToast` inner function (lines 102-121) and the CSS animation style injection (lines 123-149).

- Replace the three `showToast(...)` calls with `toast({ title: ..., description: ... })` using the existing `{ toast }` from `useToast()`.

- Fix the "Share to Groups" `<Button>` at lines 372-385. Replace the current `className` with:
  ```
  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
  ```

**Files affected:**
- `src/components/social/ShareButton.tsx`

---

### Step 4: Fix group shared content navigation route

In `groups/[id]/page.tsx`, the shared content list links to `/query/${shared.content.query.id}` which is not a valid route. The results page is at `/results/[id]`.

**Actions:**

- Change line 163:
  ```tsx
  href={`/query/${shared.content.query.id}`}
  ```
  to:
  ```tsx
  href={`/results/${shared.content.query.id}`}
  ```

**Files affected:**
- `src/app/(dashboard)/groups/[id]/page.tsx`

---

### Step 5: Fix perfect-score badge bug in achievement service

**Root cause:** In `achievement.service.ts`:
```typescript
const hasPerfectQuiz = quizCount > 0
  ? (await prisma.$queryRaw<{ count: string }[]>`...`)[0]?.count !== '0'
  : false;
```
When the raw SQL returns `[]` (no rows match — i.e., no perfect scores), `[0]` is `undefined`, so `[0]?.count` is `undefined`. The expression `undefined !== '0'` evaluates to `true`, incorrectly marking `hasPerfectQuiz = true`.

**Fix:** Capture the raw result first, then check both that it has rows AND that the count is greater than 0:
```typescript
const perfectQuizRows = quizCount > 0
  ? await prisma.$queryRaw<{ count: string }[]>`
      SELECT COUNT(*) as count FROM "quiz_scores"
      WHERE "userId" = ${userId}
        AND score = "totalQuestions"
      LIMIT 1
    `
  : [];
const hasPerfectQuiz = perfectQuizRows.length > 0 && Number(perfectQuizRows[0].count) > 0;
```

**Actions:**
- Replace the `hasPerfectQuiz` block with the two-step pattern above

**Files affected:**
- `src/lib/services/achievement.service.ts`

---

### Step 6: Fix challenge "Take Quiz Now" navigation route

In `challenges/[id]/page.tsx` line 134, the link points to `/query/${challenge.query.id}` which doesn't exist. The correct route is `/results/[id]`.

**Actions:**

- Change line 134:
  ```tsx
  href={`/query/${challenge.query.id}`}
  ```
  to:
  ```tsx
  href={`/results/${challenge.query.id}`}
  ```

**Files affected:**
- `src/app/(dashboard)/challenges/[id]/page.tsx`

---

### Step 7: Create persistent XPRedemptionBanner component

Create a new dismissable client component that shows a compact banner: "⚡ 100 XP = ₹100 Amazon Voucher — Redeem now →". It stores the dismissed state in `sessionStorage` so it reappears each new session but not on every navigation.

**Actions:**

- Create `src/components/features/XPRedemptionBanner.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Zap, X } from 'lucide-react';
import Link from 'next/link';

const DISMISS_KEY = 'xp_banner_dismissed';

export function XPRedemptionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(DISMISS_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 text-white">
      <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium">
        <Zap className="h-4 w-4 flex-shrink-0 fill-white" />
        <span>
          Earn <strong>100 XP</strong> → Get a{' '}
          <strong>₹100 Amazon Voucher!</strong>
        </span>
        <Link
          href="/xp"
          className="underline underline-offset-2 hover:no-underline font-bold flex-shrink-0"
        >
          Redeem now →
        </Link>
        <button
          onClick={dismiss}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

- In `src/app/(dashboard)/layout.tsx`:
  - Import `XPRedemptionBanner`
  - Mount it between `<InactivityBanner>` and `<Header>`:
    ```tsx
    <InactivityBanner daysInactive={daysInactive} />
    <XPRedemptionBanner />
    <Header />
    ```

**Files affected:**
- `src/components/features/XPRedemptionBanner.tsx` (new)
- `src/app/(dashboard)/layout.tsx`

---

### Step 8: Add click-outside to mobile menu in Header

The mobile menu (`showMobileMenu`) currently has no way to close by clicking outside. The desktop dropdown uses an invisible full-screen overlay div (`fixed inset-0 z-10 onClick={() => setShowDropdown(false)}`). Apply the same pattern to the mobile menu.

**Actions:**

- In `Header.tsx`, inside the `{showMobileMenu && (...)}` block, add an invisible overlay **before** the menu panel:
  ```tsx
  {showMobileMenu && (
    <>
      {/* Click-outside overlay */}
      <div
        className="fixed inset-0 z-30"
        onClick={() => setShowMobileMenu(false)}
      />
      {/* Menu panel — must have higher z-index than overlay */}
      <div className="absolute top-full left-0 right-0 z-40 bg-gradient-to-b from-purple-50 to-white ...">
        ...
      </div>
    </>
  )}
  ```
- The menu panel gets `z-40` and the overlay gets `z-30` so clicks on the overlay close the menu, and clicks on the menu panel items work normally.
- The `header` element needs `relative` positioning (it already has `sticky top-0 z-50`; the absolute menu panel is positioned relative to the header).

**Files affected:**
- `src/components/layout/Header.tsx`

---

### Step 9: Run type check to validate all changes

After all code changes, run `npm run type-check` to confirm 0 TypeScript errors.

**Actions:**
- Run `npx tsc --noEmit`
- Fix any type errors found

**Files affected:**
- Any file with type errors

---

## Connections & Dependencies

### Files That Reference This Area

- `src/app/(dashboard)/results/[id]/page.tsx` — renders `InteractiveResultsView` which mounts `PracticeQuizViewer` and `DiagramViewer`
- `src/app/api/quiz/submit-score/route.ts` — calls `checkAndUnlockAchievements` after each quiz submission; this is where the badge bug gets triggered
- `src/components/features/InteractiveResultsView.tsx` — renders `PracticeQuizViewer` in the right column; layout change triggers quiz scroll bug

### Updates Needed for Consistency

- None beyond what's listed above; no cross-references need updating.

### Impact on Existing Workflows

- Badge unlock fix: existing incorrectly-awarded `quiz_perfect` achievements are NOT removed (data integrity preserved). Only future awards will be correct.
- Diagram SVG: SVGs are inline images rendered by browser — no backend change needed.
- Group/challenge route fix: If any user had bookmarked `/query/{id}` URLs, those would now 404 until Next.js is configured. (The `/results/[id]` route already exists.)

---

## Validation Checklist

- [ ] Quiz: Submitting the last answer no longer scrolls away from the quiz section
- [ ] Quiz: Clicking "Retry This Set" resets and stays in quiz section
- [ ] Diagrams: Rendered diagrams show colors (not plain black/white)
- [ ] Share: "Share to Groups" button shows a visible purple background with white text
- [ ] Share: Successful group share shows a proper toast notification (not custom DOM div)
- [ ] Groups page: Clicking a shared content item navigates to `/results/{id}` correctly
- [ ] Achievements: User who scored 20% does NOT get the `quiz_perfect` badge
- [ ] Achievements: User who scored 100% (score === totalQuestions) DOES get the badge
- [ ] Challenges: "Take Quiz Now" navigates to `/results/{id}` and shows full content
- [ ] XP Banner: Visible at the top of all dashboard pages on first session visit
- [ ] XP Banner: Clicking X dismisses it for the session; it reappears on next session
- [ ] XP Banner: "Redeem now →" link navigates to `/xp` page
- [ ] Mobile menu: Clicking anywhere outside the mobile menu closes it
- [ ] Mobile menu: Clicking menu items still navigates correctly
- [ ] `npm run type-check` passes with 0 errors

---

## Success Criteria

The implementation is complete when:

1. All 15 validation checklist items pass
2. `npx tsc --noEmit` exits with code 0
3. The quiz section stays visible after answer submission (no rogue scroll)
4. Diagram images render with color and detail instead of black-and-white
5. The XP redemption banner is visible on the explore, results, and library pages

---

## Notes

### API Cost Analysis: Paid vs Free (1000 Users, 3-4 Months)

#### Free APIs (No Usage Cost)
| API | Why Free |
|-----|---------|
| **mermaid.ink** | Completely free, no rate limits documented |
| **Google OAuth** | Free for any volume |
| **NextAuth.js** | Open source, self-hosted |
| **Prisma ORM** | Open source, self-hosted |
| **PostgreSQL** | Open source (hosting cost separate) |

#### Paid APIs with Estimated Costs

**Assumptions for 1000 users over 3.5 months:**
- DAU (daily active users): ~15% of 1000 = 150/day
- Avg queries/user/day: 2 → 300 queries/day → ~31,500 queries total
- Avg quiz attempts/user: 1/week → 6,000 quizzes total
- Avg flashcard sets: 1 per topic → 31,500 generations (same as queries)
- Audio: 10% of users generate audio → 3,150 audio files
- OTP SMSes: 1000 sign-ups + re-verifications → ~1,500 OTPs total

---

**1. Perplexity API (sonar model)**
- Used for: Research per query (`POST /api/query/submit`)
- Pricing: `sonar` model = $1/M input tokens, $1/M output tokens (as of Feb 2026)
- Avg tokens/query: ~2,000 input + 2,000 output = 4,000 tokens
- 31,500 queries × 4,000 tokens = 126M tokens total
- **Estimated cost: ~$126 for 3.5 months**

**2. Groq API (llama-3.1-8b-instant)**
- Used for: Article generation from research
- Pricing: Very generous free tier — 6,000 requests/minute, 500,000 tokens/day free; $0.05/M tokens paid
- 31,500 articles × ~3,000 output tokens = 94.5M tokens
- Free tier covers most of this; overflow ~$4.73
- **Estimated cost: ~$5 for 3.5 months**

**3. Anthropic API (Claude — for flashcards, quizzes, diagrams, moderation)**
- Model: claude-3-haiku-20240307 (cheapest, used for generation tasks)
- Pricing: $0.25/M input tokens, $1.25/M output tokens
- Flashcards: 31,500 × 2,000 tokens = 63M tokens → $94.50
- Quizzes: 6,000 × 2,500 tokens = 15M tokens → $22.50
- Diagrams: 20,000 × 2,000 tokens = 40M tokens → $60
- Moderation: 31,500 × 500 tokens = 15.75M → $3.94
- **Estimated cost: ~$181 for 3.5 months**

**4. ElevenLabs TTS**
- Used for: Audio summaries (Pro users or on-demand)
- Pricing: Free tier = 10,000 characters/month. Creator plan = $22/month for 100k chars
- 3,150 audio files × avg 2,000 chars = 6.3M characters total
- Far exceeds free tier. At Creator plan ($22/month): insufficient for 1000 users.
- Business plan ($330/month) = 2M characters/month. 6.3M ÷ 2M = ~3.5 months = $1,155
- **Estimated cost: ~$1,155 for 3.5 months** ← Biggest cost driver
- *Recommendation: Gate audio to Pro plan users only (already done in plan-limits.service.ts). With 5% Pro adoption (50 users), audio cost drops to ~$58.*

**5. Resend (Transactional Email)**
- Used for: Email verification, password reset, reminders
- Pricing: Free tier = 3,000 emails/month (100/day). Pro = $20/month for 50k emails
- 1000 sign-ups + weekly reminders to active users = ~5,000 emails/month
- Exceeds free tier → Pro plan
- **Estimated cost: ~$70 for 3.5 months ($20/month)**

**6. Twilio (SMS OTP)**
- Used for: Phone OTP sign-up/login
- Pricing: $0.0079/SMS (US); India (Fast2SMS) ≈ ₹0.15/SMS (~$0.0018)
- 1,500 OTPs via Fast2SMS = ₹225 (~$2.70)
- **Estimated cost: ~$3 for 3.5 months** (if using Fast2SMS)
- Twilio: 1,500 × $0.0079 = **~$12**

**7. Upstash Redis**
- Used for: Research caching (24h TTL), OTP storage (5min TTL), rate limiting
- Pricing: Free tier = 10,000 requests/day (300k/month). Pay-as-you-go = $0.2/100k requests
- 300 queries/day × 2 Redis ops = 600 reads + OTP ops ≈ ~1,500 Redis ops/day = 45k/month
- Well within free tier for 1000 users
- **Estimated cost: $0 (free tier sufficient)**

**8. Cloudflare R2 (Audio Storage)**
- Pricing: Free = 10 GB storage, 1M Class A operations/month
- 3,150 audio files × avg 1MB = 3.15 GB
- **Estimated cost: $0 (free tier sufficient)**

**9. Razorpay (Payment Processing)**
- Pricing: 2% per transaction (domestic India)
- If 50 Pro users × ₹600/month = ₹30,000 revenue
- Razorpay fee: 2% = ₹600/month → ₹2,100 for 3.5 months (~$25)
- **Estimated cost: ~$25 for 3.5 months**

**10. PostgreSQL Hosting (e.g., Neon, Railway, Supabase)**
- For 1000 users: ~500MB-1GB of data
- Neon free tier: 512MB, 1 compute unit. Suitable up to ~300-400 users.
- Neon Pro: $19/month for up to 10GB
- **Estimated cost: ~$67 for 3.5 months (Pro plan)**

#### Total Cost Summary (1000 Users, 3.5 Months)

| Service | Estimated Cost |
|---------|---------------|
| Perplexity API | $126 |
| Groq API | $5 |
| Anthropic API | $181 |
| ElevenLabs (if gated to Pro only, 50 users) | $58 |
| Resend | $70 |
| Twilio/Fast2SMS | $3 |
| Upstash Redis | $0 |
| Cloudflare R2 | $0 |
| Razorpay fees | $25 |
| PostgreSQL hosting | $67 |
| **Total** | **~$535 for 3.5 months (~$153/month)** |

#### Revenue Potential
- 50 Pro users × ₹600/month × 3.5 months = ₹105,000 (~$1,260)
- Infrastructure cost: ~$535
- **Gross margin: ~$725 (~57%) at 5% Pro conversion**

#### Key Recommendations
1. **ElevenLabs is the biggest variable cost** — keep audio strictly gated to Pro users (already done).
2. **Perplexity + Anthropic** are the largest fixed costs — consider caching article generation for identical queries (already done for research via Redis; extend to article text).
3. **Fast2SMS over Twilio** — significantly cheaper for Indian market (~$3 vs $12 for OTPs).
4. **Groq for article generation** is nearly free — excellent choice.

---

## Implementation Notes

**Implemented:** 2026-02-27

### Summary

- Fixed quiz scroll bug by adding `containerRef` + `useEffect` with `scrollIntoView({ block: 'nearest' })` in `PracticeQuizViewer.tsx`
- Upgraded diagram rendering from `mermaid.ink/img/` (black/white PNG) to `mermaid.ink/svg/?theme=default` (full-color SVG) with gradient card UI and diagram type emojis
- Fixed `ShareButton`: removed custom DOM toast injection, replaced with `useToast`; fixed "Share to Groups" button with proper purple styling
- Fixed group shared content links: `/query/{id}` → `/results/{id}`
- Fixed perfect-score badge bug: `undefined !== '0'` → `Number(count) > 0` check
- Fixed challenge "Take Quiz Now" link: `/query/{id}` → `/results/{id}`
- Created `XPRedemptionBanner` component (yellow-orange gradient, sessionStorage-dismissed) and mounted in dashboard layout
- Added click-outside overlay div to mobile menu in Header (same pattern as desktop dropdown)
- `npx tsc --noEmit` passes with 0 errors

### Deviations from Plan

None. All steps executed as specified.

### Issues Encountered

None. TypeScript check passed cleanly on first run.
