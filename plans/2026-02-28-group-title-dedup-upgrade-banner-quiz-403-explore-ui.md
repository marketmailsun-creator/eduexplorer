# Plan: Group Content Title Fix, Content Deduplication, Upgrade Banner, Quiz 403 Fix, Explore UI

**Created:** 2026-02-28
**Status:** Implemented
**Request:** Fix group shared content title, add content deduplication before search, replace upgrade modal with inline banner, fix quiz regenerate 403, improve explore page UI.

---

## Overview

### What This Plan Accomplishes

Five targeted improvements: (1) fix the "What to Learn Next" group content title bug by always using `query.queryText`; (2) add pre-submit similar-content detection so users can reuse existing work instead of re-generating; (3) replace browser `confirm()` upgrade dialogs with a persistent inline `UpgradeBanner` component; (4) surface the 403 plan-limit error from quiz regeneration properly in the UI; (5) redesign the explore page hero and page shell for stronger visual impact.

### Why This Matters

These fixes remove friction that breaks trust (wrong title), wastes API quota (duplicate generation), interrupts flow (confirm dialog), and silently fails (403 with no UI feedback). A better explore page is the first impression for every session.

---

## Current State

### Relevant Existing Structure

```
src/
  app/(dashboard)/
    groups/[id]/page.tsx        — shows sharedContent list; title uses content.title || query.queryText
    explore/page.tsx            — hero + TopicDiscoveryHub + SplitLayoutExplore
  app/api/
    query/
      submit/route.ts           — no similarity check; creates query directly
      history/route.ts          — returns user's completed queries (last 50)
    content/quiz/generate/route.ts — returns 403 when plan limit reached
  components/features/
    SplitLayoutExplore.tsx      — main search form; handleSubmit calls /api/query/submit
    PracticeQuizViewer.tsx      — handleRegenerate silently catches 403 (no UI feedback)
    GenerateQuizButton.tsx      — uses confirm() dialog on 403 → upgrade
    GenerateAudioButton.tsx     — uses confirm() dialog on 403 → upgrade
    WhatToLearnNext.tsx         — section shown on results page with "What to Learn Next" heading
    TopicDiscoveryHub.tsx       — trending chips, history, subject categories on explore page
  lib/services/
    plan-limits.service.ts      — PLAN_LIMITS: free = 1 quiz/topic, pro = 999
```

### Gaps or Problems Being Addressed

1. **Group content title**: `GroupSharedContent.content` is a `Content` record (no `.title` field). `shared.content.title` is always `undefined`, falling back to `query.queryText`. But `content.contentType` shows e.g. "article" — which is then placed alongside the section heading "What to Learn Next" (from WhatToLearnNext rendered below in results pages) confusing users about what the title represents. Fix: use `query.queryText` directly and show a human-readable type label.

2. **Content deduplication**: No similarity check before query submission. Users unknowingly re-generate content they already have, wasting quota.

3. **Upgrade dialog**: `confirm()` is a blocking browser-native dialog that looks archaic and can't be styled.

4. **Quiz 403 silent failure**: `PracticeQuizViewer.handleRegenerate()` swallows the 403 with `console.error`. User clicks "Generate Quiz Set 2" → spinner → stops. No message shown.

5. **Explore UI**: Plain `bg-gray-50` page, minimal hero, gradient text only. Needs a richer visual identity.

---

## Proposed Changes

### Summary of Changes

- **Group page**: Replace `shared.content.title || shared.content.query.queryText` with `shared.content.query?.queryText`, add human-friendly contentType label (emoji + capitalized name)
- **New API endpoint** `GET /api/query/similar` — returns user's own queries that match the search text (case-insensitive); also returns publicly shared queries on the same topic
- **SplitLayoutExplore**: Before submitting, call `/api/query/similar?q=...`; if matches found, show inline "Similar content found" UI with "View existing" / "Generate new" options
- **New `UpgradeBanner` component** — inline (non-modal) banner with Crown icon, upgrade message, and "Upgrade to Pro" button linking to `/upgrade`
- **GenerateQuizButton + GenerateAudioButton**: Replace `confirm()` with inline `UpgradeBanner` render
- **PracticeQuizViewer**: Check `res.status === 403` in `handleRegenerate` and show upgrade prompt instead of silent failure; add `regenError` state
- **Explore page**: Redesign hero section with gradient background blob, improved typography; update `explore/page.tsx` and `SplitLayoutExplore.tsx` search area styling

### New Files to Create

| File Path | Purpose |
|---|---|
| `src/app/api/query/similar/route.ts` | GET endpoint returning user's own similar queries + public shared topics |
| `src/components/features/UpgradeBanner.tsx` | Reusable inline upgrade-to-pro banner (no modal) |

### Files to Modify

| File Path | Changes |
|---|---|
| `src/app/(dashboard)/groups/[id]/page.tsx` | Use `query.queryText` directly; human-friendly contentType labels |
| `src/components/features/SplitLayoutExplore.tsx` | Pre-submit similar-content check; inline suggestion UI |
| `src/components/features/GenerateQuizButton.tsx` | Replace `confirm()` with `UpgradeBanner` |
| `src/components/features/GenerateAudioButton.tsx` | Replace `confirm()` with `UpgradeBanner` |
| `src/components/features/PracticeQuizViewer.tsx` | Handle 403 in `handleRegenerate`; show upgrade prompt |
| `src/app/(dashboard)/explore/page.tsx` | Redesign hero section with gradient background |
| `src/components/features/TopicDiscoveryHub.tsx` | Minor styling improvements to match new explore theme |

---

## Design Decisions

### Key Decisions Made

1. **Group title: use `query.queryText` directly** — `Content` model has no `title` field; remove the `.title` fallback entirely; show `query?.queryText || 'Untitled'`.

2. **Similarity check is client-side gated** — similarity check fires on form submit (not while typing) to avoid excessive requests. If no match found, proceeds immediately. Response cached for the session; no API call if the same query is submitted twice.

3. **Similarity matching: exact + case-insensitive** — simpler than fuzzy/vector search; check `LOWER(queryText) = LOWER(input)` or `LOWER(queryText) LIKE LOWER(input + '%')`. No ML needed. Check user's own queries first, then public SharedContent.

4. **Similar content UI: inline (not modal)** — replaces the submit button area with a card showing "You already have content on this topic." Two options: view existing link, or "Generate new anyway" button. No modal overlay.

5. **UpgradeBanner: inline component** — appears where the generate button was. Shows Crown icon, plan limit message from API, and an `<a href="/upgrade">` styled as a button. `dismiss` prop hides it (local state).

6. **Quiz 403 fix: `regenError` state** — add `regenError: string` state to `PracticeQuizViewer`. When `res.status === 403`, set `regenError` to the error message and render `<UpgradeBanner>` below the regenerate button instead of the existing click handler.

7. **Explore page: gradient background section** — wrap the hero in a gradient blob background using Tailwind `bg-gradient-to-br` on a `div` with `rounded-b-3xl`. Keep `TopicDiscoveryHub` and `SplitLayoutExplore` below on white/gray background. Add a decorative ring or blob element for depth.

### Alternatives Considered

- **Fuzzy matching (Levenshtein)** for similarity — too complex, false positives. Simple case-insensitive match is sufficient.
- **Vector/embedding search** for semantic similarity — requires Anthropic or external API call per submission; out of scope.
- **Toast notification for upgrade** — would disappear too quickly; inline banner gives persistent context.
- **Redirect to /upgrade automatically** on 403 — disruptive; let user choose.

### Open Questions (if any)

None — all design decisions are resolved.

---

## Step-by-Step Tasks

### Step 1: Fix Group Shared Content Title

The title in the groups/[id] shared content list shows wrongly. Fix the display to always use `query.queryText` and show a proper human-readable content type badge.

**Actions:**

- Read `src/app/(dashboard)/groups/[id]/page.tsx`
- On line 168, change:
  ```tsx
  {shared.content.title || shared.content.query.queryText}
  ```
  to:
  ```tsx
  {shared.content.query?.queryText || 'Untitled Topic'}
  ```
- On line 170-172, replace the raw contentType badge with a human-friendly version:
  ```tsx
  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full font-medium whitespace-nowrap">
    {({
      'article': '📄 Article',
      'quiz': '🧠 Quiz',
      'flashcards': '🃏 Flashcards',
      'audio': '🎧 Audio',
      'presentation': '📊 Slides',
      'diagrams': '📐 Diagrams',
      'concept-map': '🗺️ Concept Map',
    } as Record<string, string>)[shared.content.contentType] || shared.content.contentType}
  </span>
  ```

**Files affected:**
- `src/app/(dashboard)/groups/[id]/page.tsx`

---

### Step 2: Create Similar Content API Endpoint

New `GET /api/query/similar?q=text` endpoint. Returns the user's own matching completed queries and any publicly shared content on the same topic.

**Actions:**

- Create `src/app/api/query/similar/route.ts` with:

```typescript
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ similar: [] });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  if (q.length < 3) return NextResponse.json({ similar: [] });

  // 1. User's own queries with case-insensitive match
  const ownQueries = await prisma.query.findMany({
    where: {
      userId: session.user.id,
      status: 'completed',
      queryText: { contains: q, mode: 'insensitive' },
    },
    select: { id: true, queryText: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  // 2. Public shared content on similar topics (from other users)
  const publicShares = await prisma.sharedContent.findMany({
    where: {
      shareType: 'public',
      query: {
        queryText: { contains: q, mode: 'insensitive' },
        status: 'completed',
        userId: { not: session.user.id }, // exclude own queries (already above)
      },
    },
    select: {
      query: { select: { id: true, queryText: true } },
      views: true,
    },
    orderBy: { views: 'desc' },
    take: 3,
    distinct: ['queryId'],
  });

  const similar = [
    ...ownQueries.map(q => ({ type: 'own' as const, id: q.id, queryText: q.queryText })),
    ...publicShares.map(s => ({ type: 'public' as const, id: s.query.id, queryText: s.query.queryText })),
  ];

  return NextResponse.json({ similar });
}
```

**Files affected:**
- `src/app/api/query/similar/route.ts` (new)

---

### Step 3: Create Reusable UpgradeBanner Component

A clean inline upgrade banner with dismiss functionality.

**Actions:**

- Create `src/components/features/UpgradeBanner.tsx`:

```tsx
'use client';

import { Crown, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface UpgradeBannerProps {
  message?: string;
  dismissible?: boolean;
}

export function UpgradeBanner({
  message = 'Upgrade to Pro for unlimited access.',
  dismissible = true,
}: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Crown className="h-4 w-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 mb-0.5">Free plan limit reached</p>
        <p className="text-xs text-amber-700 leading-relaxed">{message}</p>
        <Link
          href="/upgrade"
          className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Crown className="h-3 w-3" />
          Upgrade to Pro
        </Link>
      </div>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

**Files affected:**
- `src/components/features/UpgradeBanner.tsx` (new)

---

### Step 4: Replace confirm() in GenerateQuizButton and GenerateAudioButton

Remove the browser `confirm()` calls and show the `UpgradeBanner` inline instead.

**Actions:**

**A. GenerateQuizButton.tsx:**
- Read `src/components/features/GenerateQuizButton.tsx`
- Add import: `import { UpgradeBanner } from './UpgradeBanner';`
- Add state: `const [showUpgrade, setShowUpgrade] = useState(false);`
- Replace the 403 handling block:
  ```typescript
  // Old:
  if (response.status === 403) {
    if (data.error?.includes('Upgrade to Pro')) {
      setError(data.error);
      setTimeout(() => {
        if (confirm('Upgrade to Pro for unlimited quizzes?')) {
          router.push('/upgrade');
        }
      }, 100);
      return;
    }
  }
  // New:
  if (response.status === 403) {
    setShowUpgrade(true);
    return;
  }
  ```
- In the JSX, add `{showUpgrade && <UpgradeBanner message={error || 'Upgrade to Pro for unlimited quizzes per topic.'} />}` above the button, and hide the generate button when `showUpgrade` is true.
- Remove `router` import if no longer used elsewhere (keep if still needed).

**B. GenerateAudioButton.tsx:**
- Read `src/components/features/GenerateAudioButton.tsx`
- Apply the same pattern: add `showUpgrade` state, replace `confirm()` with `setShowUpgrade(true)`, render `UpgradeBanner` inline.

**Files affected:**
- `src/components/features/GenerateQuizButton.tsx`
- `src/components/features/GenerateAudioButton.tsx`

---

### Step 5: Fix PracticeQuizViewer Quiz Regenerate 403

Add proper error handling and upgrade prompt when `handleRegenerate` gets a 403.

**Actions:**

- Read `src/components/features/PracticeQuizViewer.tsx`
- Add state: `const [regenError, setRegenError] = useState('');`
- Add import: `import { UpgradeBanner } from './UpgradeBanner';`
- In `handleRegenerate`, before `const data = await res.json()`:
  ```typescript
  if (res.status === 403) {
    const errData = await res.json();
    setRegenError(errData.error || 'Plan limit reached. Upgrade to Pro for more quiz sets.');
    return;
  }
  ```
- Also clear `regenError` at the top of `handleRegenerate`: `setRegenError('');`
- In the active quiz header (where the "New questions" button is), add after the button:
  ```tsx
  {regenError && (
    <UpgradeBanner message={regenError} />
  )}
  ```
  This should be placed just below the header `div` (after `</div>` at the header closing), before the progress bar.
- In the completed screen, where the regenerate CTA appears (`{isOwner && (...)}`), wrap with:
  ```tsx
  {isOwner && !regenError && (...existing regen CTA...)}
  {isOwner && regenError && <UpgradeBanner message={regenError} />}
  ```

**Files affected:**
- `src/components/features/PracticeQuizViewer.tsx`

---

### Step 6: Add Similar Content Detection to SplitLayoutExplore

Before submitting a query, check for similar existing content and show an inline suggestion UI.

**Actions:**

- Read `src/components/features/SplitLayoutExplore.tsx` fully
- Add state variables:
  ```typescript
  const [similarContent, setSimilarContent] = useState<Array<{ type: 'own' | 'public', id: string, queryText: string }>>([]);
  const [showSimilar, setShowSimilar] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  ```
- Create a `checkSimilar` function:
  ```typescript
  const checkSimilar = async (queryText: string): Promise<boolean> => {
    if (queryText.trim().length < 5) return false;
    try {
      const res = await fetch(`/api/query/similar?q=${encodeURIComponent(queryText.trim())}`);
      const data = await res.json();
      if (data.similar?.length > 0) {
        setSimilarContent(data.similar);
        setShowSimilar(true);
        return true; // has similar
      }
    } catch { /* silent */ }
    return false;
  };
  ```
- Modify the form's `handleSubmit` (or the submit handler) to:
  1. First call `checkSimilar(query)`
  2. If it returns `true` (similar found), set `pendingSubmit = true` and return early (show the similar UI)
  3. If `false`, proceed with normal submit
- Add a "Continue anyway" / "Proceed" button in the similar UI that calls the original submit logic:
  ```typescript
  const proceedWithSubmit = () => {
    setShowSimilar(false);
    setSimilarContent([]);
    setPendingSubmit(false);
    // Call the original submit logic
    handleActualSubmit(query, level);
  };
  ```
- Refactor the existing submit handler so the actual API call is in `handleActualSubmit(query, level)` and the existing `handleSubmit` calls `checkSimilar` first (when !pendingSubmit).
- **Similar Content UI** — render this above the submit button when `showSimilar`:
  ```tsx
  {showSimilar && similarContent.length > 0 && (
    <div className="border border-blue-200 rounded-xl bg-blue-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-blue-600 font-semibold text-sm">Similar content found</span>
      </div>
      <div className="space-y-2">
        {similarContent.map((item) => (
          <Link
            key={item.id}
            href={`/results/${item.id}`}
            className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 hover:border-blue-300 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.queryText}</p>
              <p className="text-xs text-blue-500">{item.type === 'own' ? 'Your previous content' : 'Public content'}</p>
            </div>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">View →</span>
          </Link>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={proceedWithSubmit}
          className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Generate new anyway
        </button>
        <button
          onClick={() => { setShowSimilar(false); setSimilarContent([]); }}
          className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  )}
  ```

**Files affected:**
- `src/components/features/SplitLayoutExplore.tsx`
- `src/app/api/query/similar/route.ts` (created in Step 2)

---

### Step 7: Redesign Explore Page Hero

Improve the visual appeal of the explore page with a gradient hero section and better hierarchy.

**Actions:**

**A. explore/page.tsx:**
- Read `src/app/(dashboard)/explore/page.tsx`
- Replace the current hero section:
  ```tsx
  {/* OLD */}
  <div className="text-center pt-6 pb-4 sm:pt-8 sm:pb-6 space-y-2">
    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium animate-pulse">
      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
      <span>AI-Powered Learning Platform</span>
    </div>
    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent px-4">
      Learn Anything, Instantly
    </h1>
    <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
      Ask any question and get comprehensive learning materials
    </p>
  </div>
  ```
  With this improved version:
  ```tsx
  {/* NEW — Gradient Hero */}
  <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-6 py-8 sm:py-12 text-center">
    {/* Decorative blobs */}
    <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
    <div className="absolute -bottom-8 -left-8 w-56 h-56 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

    <div className="relative space-y-3">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 text-white rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
        <Sparkles className="h-3.5 w-3.5" />
        <span>AI-Powered Learning Platform</span>
      </div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight px-4">
        Learn Anything,{' '}
        <span className="text-yellow-300">Instantly</span>
      </h1>
      <p className="text-sm sm:text-base text-purple-100 max-w-xl mx-auto px-4">
        Ask any question — get articles, flashcards, quizzes, audio, and more
      </p>

      {/* Stats row */}
      <div className="flex items-center justify-center gap-6 pt-2 text-white/80 text-xs sm:text-sm">
        <span>📚 7 learning formats</span>
        <span className="text-white/40">•</span>
        <span>⚡ AI-generated in seconds</span>
        <span className="text-white/40">•</span>
        <span>🏆 Gamified learning</span>
      </div>
    </div>
  </div>
  ```
- Also wrap the outer `div` to account for the new hero styling — the page wrapper should be `min-h-screen`:
  ```tsx
  <div className="w-full px-4 sm:px-6 pb-10">
  ```

**B. TopicDiscoveryHub.tsx** (minor):
- Read `src/components/features/TopicDiscoveryHub.tsx`
- Check the component's outer wrapper — if it has a gray or blue background section header, adjust the heading color to match the new purple theme (e.g., update any blue text colors to purple/indigo).

**Files affected:**
- `src/app/(dashboard)/explore/page.tsx`
- `src/components/features/TopicDiscoveryHub.tsx` (minor color tweaks)

---

## Connections & Dependencies

### Files That Reference This Area

- `src/app/(dashboard)/results/[id]/page.tsx` — renders `WhatToLearnNext` at bottom (unchanged; the title fix is in groups page only)
- `src/components/features/InteractiveResultsView.tsx` — uses `GenerateQuizButton`; after Step 4, this component will show `UpgradeBanner` inline when limit hit
- `src/app/(dashboard)/layout.tsx` — `XPRedemptionBanner` mounted here; `UpgradeBanner` is per-component, no layout changes needed

### Updates Needed for Consistency

- `GenerateFlashcardsButton.tsx` and `GeneratePresentationButton.tsx` — these already show errors inline via `setError()` but do NOT use `confirm()`. They don't need the `UpgradeBanner` treatment but could be improved later.
- No schema changes required (similar check uses existing Query + SharedContent tables).

### Impact on Existing Workflows

- Quiz regeneration: free users now see an upgrade prompt instead of silent failure
- Group shared content: title is now always the actual topic; no change to navigation
- Query submission: 1 extra API call to `/api/query/similar` per submission (lightweight query, <50ms expected)
- Explore page: visual redesign only; all functionality preserved

---

## Validation Checklist

- [ ] Groups page: shared content card titles show `query.queryText`, not "What to Learn Next" or undefined
- [ ] Groups page: contentType badge shows human-friendly label (e.g., "📄 Article" not "article")
- [ ] `/api/query/similar?q=photosynthesis` returns matching user queries in `similar[]`
- [ ] SplitLayoutExplore: submitting a topic the user already researched shows the "Similar content found" card with existing query links
- [ ] "Generate new anyway" button in similar UI proceeds with new query submission
- [ ] UpgradeBanner renders correctly with Crown icon, message, and "Upgrade to Pro" link
- [ ] UpgradeBanner dismiss (X) button hides it
- [ ] GenerateQuizButton: clicking Generate on free-plan limit shows UpgradeBanner inline (no confirm() dialog)
- [ ] GenerateAudioButton: same — no confirm() dialog on 403
- [ ] PracticeQuizViewer: clicking "New questions" or "Generate Quiz Set 2" on a free plan shows UpgradeBanner in the quiz UI
- [ ] Explore hero: gradient purple/indigo background with white text, yellow "Instantly", stats row
- [ ] Explore hero: no `animate-pulse` badge (static `bg-white/20` backdrop pill)
- [ ] TopicDiscoveryHub: color scheme consistent with new purple theme
- [ ] `npm run type-check` passes with 0 errors

---

## Success Criteria

1. A group member viewing the shared content list sees correct topic titles (not "What to Learn Next") and friendly content type labels.
2. A user who submits a previously-researched topic sees an inline card with a link to their existing content before a new query is generated.
3. Free users who hit any generation limit see an inline amber `UpgradeBanner` with a "Upgrade to Pro" CTA — no browser `confirm()` dialog appears anywhere.
4. The explore page hero is a gradient purple/indigo card with white text and a stats row, clearly distinct from the plain gray body below.

---

## Notes

- **Similarity matching**: The `contains` Prisma filter with `mode: 'insensitive'` does a SQL `ILIKE '%term%'` — this is a substring match. If a user types "photosynthesis" it will match "What is photosynthesis?" — intentional and useful. Limit results to 3 to keep the UI compact.
- **GenerateFlashcardsButton and GeneratePresentationButton**: These don't use `confirm()` currently (just inline error text). They can optionally adopt `UpgradeBanner` in a follow-up pass but are not blocking issues.
- **explore/page.tsx uses a server component** — the new hero div is pure JSX/HTML, fully compatible with server rendering.
- **The stats row in the hero** ("7 learning formats", "AI-generated in seconds", "Gamified learning") is static copy — no dynamic data needed.
- **No new Prisma migrations** — all queries use existing tables and fields.

---

## Implementation Notes

**Implemented:** 2026-02-28

### Summary

- Fixed group shared content title to use `query.queryText` instead of missing `.title` field
- Created `/api/query/similar` endpoint for case-insensitive substring matching of similar topics
- Created `UpgradeBanner` component — inline amber gradient banner replacing all browser `confirm()` dialogs
- Updated `GenerateQuizButton` and `GenerateAudioButton` to show `UpgradeBanner` on 403
- Updated `PracticeQuizViewer` to surface 403 regen errors via `UpgradeBanner` in both the active quiz header and completion screen
- Added similar-content detection in `SplitLayoutExplore.handleSubmit` — shows violet card with existing links + "Generate New" / "Cancel" buttons
- Redesigned explore page hero with full-bleed violet-to-indigo gradient card, decorative blobs, yellow "Instantly" accent, and stats row
- Updated `TopicDiscoveryHub` "Continue Exploring" chips to purple gradient styling

### Deviations from Plan

- `proceedWithSubmit` extracts full submission logic from `handleSubmit` (cleaner than storing FormData in state)
- UpgradeBanner placed inside `px-5 pt-3` wrapper div in active quiz header for consistent padding

### Issues Encountered

None — TypeScript check passed with 0 errors.
