# Plan: Results Page UI Redesign, Diagram Zoom, Flashcard Regen (Pro), Push Notification Fix

**Created:** 2026-02-28
**Status:** Implemented
**Request:** Improve results page UI, add diagram zoom, fix flashcard button overlap, add Pro-only flashcard regeneration, fix push notification button on mobile, and validate APIs / suggest student-focused improvements.

---

## Overview

### What This Plan Accomplishes

This plan transforms the results page from a functional-but-plain layout into a visually rich learning interface: colored card headers, a gradient hero header, diagram zoom controls, fixed flashcard navigation, Pro-only flashcard set regeneration (parity with quiz), and a proper push notification toggle in the mobile menu.

### Why This Matters

The results page is the highest-engagement screen in EduExplorer — students spend the most time here. A polished, visually differentiated UI reduces cognitive friction and creates a premium feel that supports the Pro upgrade conversion funnel. The functional fixes (zoom, nav overlap, flashcard regen) directly improve usability for the core learning workflow.

---

## Current State

### Relevant Existing Structure

```
src/app/(dashboard)/results/[id]/page.tsx      — Server page; plain white header
src/components/features/InteractiveResultsView.tsx — 2-col card grid; plain card headers
src/components/features/DiagramViewer.tsx       — mermaid.ink rendering, no zoom
src/components/features/FlashcardViewer.tsx     — flex-1 buttons that expand on desktop
src/components/features/GenerateFlashcardsButton.tsx — no plan limit awareness
src/app/api/content/flashcards/route.ts        — no plan limit check, no regenerate flag
src/lib/services/plan-limits.service.ts        — canGenerateContent() for flashcards exists
src/components/pwa/PushNotificationSetup.tsx   — defined but not imported anywhere in app
src/components/layout/Header.tsx               — mobile menu has no notifications toggle
```

### Gaps or Problems Being Addressed

1. **Results page**: White header and plain gray card headers; no visual differentiation between content types; monotone color scheme
2. **Diagram section**: No zoom — diagrams that are dense/complex can't be enlarged
3. **Flashcard nav buttons**: `flex-1` class causes Prev/Next buttons to expand to full row width and visually overlap card content on desktop viewport
4. **Flashcard regeneration**: API has no plan limit check; no regen UI; free users can generate unlimited flashcard sets; Pro benefit not enforced
5. **Push notifications**: `PushNotificationSetup` component is never rendered anywhere in the app; user sees a raw circle or nothing meaningful on mobile

---

## Proposed Changes

### Summary of Changes

- **Results page header**: Replace plain white sticky header with a gradient violet/indigo card (matches explore page hero pattern), query title in white text
- **InteractiveResultsView**: Add colored gradient top-strip (1.5px bar) + light gradient tinted header bg to each of the 7 content cards; improve empty-state designs with matching gradient backgrounds
- **DiagramViewer**: Add zoom state (default 1.0×, range 0.5×–3.0×), `ZoomIn`/`ZoomOut`/`RotateCcw` (reset) buttons below the diagram image; apply CSS transform scale
- **FlashcardViewer**: Fix nav by replacing `flex-1 sm:flex-none` with `min-w-[80px]`; add `isOwner`, `queryId`, `setNumber`, `totalSets` props; add "New Set" header button with regeneration logic + `UpgradeBanner` on 403
- **Flashcards API route**: Add `canGenerateContent` plan limit check + `regenerate` boolean flag (parity with quiz generate route)
- **InteractiveResultsView**: Filter all flashcard sets (like quizSets), pass `totalSets` + `setNumber` to FlashcardViewer; also pass `isOwner` and `queryId`
- **PushNotificationSetup**: Add to Header mobile menu as a proper full-row button with Bell icon + "Notifications" label; also add to profile page settings section

### New Files to Create

| File Path | Purpose |
| --------- | ------- |
| (none) | All changes are modifications to existing files |

### Files to Modify

| File Path | Changes |
| --------- | ------- |
| `src/app/(dashboard)/results/[id]/page.tsx` | Gradient header with white text; `p-6` → `pt-0 p-6` |
| `src/components/features/InteractiveResultsView.tsx` | Colored top-strip + tinted header bg for all 7 cards; flashcard set tracking; improved empty states |
| `src/components/features/DiagramViewer.tsx` | Add `zoomScale` state + zoom buttons (ZoomIn/ZoomOut/reset) + CSS transform |
| `src/components/features/FlashcardViewer.tsx` | Fix nav button widths; add isOwner/queryId/setNumber/totalSets props; add regen header button + regenError + UpgradeBanner |
| `src/components/features/GenerateFlashcardsButton.tsx` | Add `showUpgrade`/`upgradeMessage` state; show UpgradeBanner on 403 (matches GenerateQuizButton pattern) |
| `src/app/api/content/flashcards/route.ts` | Add `canGenerateContent` check + `regenerate` flag to Zod schema |
| `src/components/layout/Header.tsx` | Import + render `PushNotificationSetup` in mobile menu Account section |
| `src/app/(dashboard)/profile/page.tsx` | Add notifications section with `PushNotificationSetup` |

### Files to Delete (if any)

None

---

## Design Decisions

### Key Decisions Made

1. **Colored top-strip pattern**: A 1.5px gradient bar at the top of each card is the least-invasive approach — it adds color identity without restructuring the existing shadcn Card layout or breaking responsive behavior.

2. **Light tinted header background**: Adding `bg-X-50/40` to the CardHeader area gives each card a subtle color wash that helps visual separation without being distracting during study sessions.

3. **Flashcard regen via existing route**: Rather than a new `/regenerate` endpoint, we add `regenerate: boolean` to the existing `/api/content/flashcards` route (same pattern as quiz). Simpler and consistent.

4. **Plan limit parity for flashcards**: Free plan = 1 flashcard set per topic (matches PLAN_LIMITS.free.flashcards = 1). Pro = 999 (unlimited). This is already configured in `plan-limits.service.ts` — the route just wasn't calling it.

5. **CSS transform zoom for diagrams**: Simplest implementation with no dependencies. The image sits in a container with `overflow-hidden`, and CSS `transform: scale(N)` is applied. This works perfectly for the `<img>` element returned by mermaid.ink.

6. **Push notification in mobile menu**: The component is already built. It needs to be rendered. Mobile menu Account section is the right UX location (used in context of profile/settings). Also add to profile page for discoverability.

7. **Results page header**: Keep it `sticky top-0 z-10` for accessibility, just change the visual style to gradient. White text remains readable against the violet/indigo gradient.

### Alternatives Considered

- **Full card header redesign** (replace `CardHeader` with custom div): More invasive, could break spacing. Rejected in favor of top-strip + tinted bg.
- **Mermaid.js client-side rendering for zoom**: Would give zoom + better reliability (no external mermaid.ink dependency), but is a larger change requiring `@mermaid-js/mermaid` package install. Deferred to a future plan.
- **Separate `/api/content/flashcards/regenerate` route**: Redundant. Existing route handles it cleanly with a `regenerate` flag.

### Open Questions (if any)

None — implementation path is clear.

---

## Step-by-Step Tasks

### Step 1: Upgrade Results Page Header

Transform the plain white sticky header in `results/[id]/page.tsx` into a gradient violet/indigo design.

**Actions:**

- Change `<div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">` to a gradient variant
- Style the back button with white/light color on the gradient background
- Make `h1` query title white text
- Make the level badge white/translucent
- Keep access banners (group/challenge) below with their existing styles
- Keep action buttons but ensure contrast on gradient bg

**Exact replacement — results page header div:**

```tsx
{/* Header Section — gradient design */}
<div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 px-4 py-4 sticky top-0 z-10 shadow-lg">
  <div className="max-w-7xl mx-auto">
    {/* Back Button */}
    <Link href="/explore">
      <Button variant="ghost" size="sm" className="gap-2 mb-2 -ml-2 text-white/80 hover:text-white hover:bg-white/15">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">Back</span>
      </Button>
    </Link>

    {/* Title */}
    <div>
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">
        {query.queryText}
      </h1>
      <p className="text-xs sm:text-sm text-purple-200 mt-1">
        Level: {query.complexityLevel || 'college'}
      </p>
    </div>

    {/* Access context banners — keep their original styles but add mt-2 */}
    {accessResult.type === 'group' && (
      <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-white/15 backdrop-blur-sm rounded-lg text-sm text-white">
        <Users className="h-4 w-4 flex-shrink-0" />
        <span>
          Shared by{' '}
          <strong>{accessResult.sharedByUser?.name ?? 'a group member'}</strong>{' '}
          in <strong>{accessResult.groupName}</strong>
        </span>
      </div>
    )}
    {accessResult.type === 'challenge' && (
      <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-white/15 backdrop-blur-sm rounded-lg text-sm text-white">
        <Swords className="h-4 w-4 flex-shrink-0" />
        <span>
          ⚔️ Challenge:{' '}
          <strong>{accessResult.challengerName}</strong> vs{' '}
          <strong>{accessResult.challengeeName}</strong> — take the quiz to compete!
        </span>
      </div>
    )}

    {/* Action buttons */}
    <div className="flex gap-2 mt-3 flex-wrap">
      {isOwner && (
        <>
          <ShareButton queryId={query.id} title={query.queryText} />
          <WhatsAppShareButton
            topic={query.queryText}
            summary={cleanText}
            queryId={query.id}
          />
        </>
      )}
      <SaveButton queryId={query.id} isSaved={isSaved} />
    </div>
  </div>
</div>
```

**Files affected:**
- `src/app/(dashboard)/results/[id]/page.tsx`

---

### Step 2: Add Colored Card Headers to InteractiveResultsView

Add a 1.5px gradient top-strip + lightly tinted header background to all 7 content cards. Also update empty-state designs with matching gradient colors. Also add flashcard set tracking.

**Actions:**

For each card, insert a `<div className="h-1.5 bg-gradient-to-r from-X to-Y" />` immediately inside `<Card className="w-full overflow-hidden">`, and add a bg tint class to `CardHeader`.

**Card color mapping:**
- Explanation/Article: strip `from-blue-500 to-indigo-600`, header `bg-blue-50/60`
- Presentation: strip `from-orange-500 to-red-500`, header `bg-orange-50/60`
- Visual Diagrams: strip `from-emerald-500 to-teal-600`, header `bg-emerald-50/60`
- Concept Map: strip `from-amber-500 to-orange-500`, header `bg-amber-50/60`
- Audio: strip `from-purple-500 to-violet-600`, header `bg-purple-50/60`
- Practice Quiz: strip `from-pink-500 to-rose-600`, header `bg-pink-50/60`
- Flashcards: strip `from-indigo-500 to-blue-600`, header `bg-indigo-50/60`

**Add `overflow-hidden` to each Card:**
Change `<Card className="w-full">` → `<Card className="w-full overflow-hidden">`

**Insert strip div immediately inside each Card:**
```tsx
<Card className="w-full overflow-hidden">
  <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
  <CardHeader className="pb-3 px-4 bg-blue-50/60">
```

**Update empty-state backgrounds** from `bg-gray-50 border-2 border-dashed` to colored gradient:
- Article: `bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl`
- Presentation: `bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 rounded-xl`
- Diagrams: `bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl`
- Concept Map: `bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl`
- Audio: `bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-xl`
- Quiz: `bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 rounded-xl`
- Flashcards: `bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl`

**Add flashcard set tracking** (like quizSets pattern):
```tsx
const flashcardSets = query.content.filter(
  (c: { contentType: string }) => c.contentType === 'flashcards'
);
const latestFlashcard = flashcardSets[flashcardSets.length - 1];
const currentFlashcardData = (latestFlashcard?.data as any) ?? flashcardData;
const currentDeck = currentFlashcardData?.deck ?? flashcardData?.deck;
const currentDeckId = latestFlashcard?.id ?? flashcardData?.deckId;
const flashcardSetNumber = (latestFlashcard as any)?.setNumber ?? 1;
```

**Update FlashcardViewer call:**
```tsx
<FlashcardViewer
  deck={currentDeck}
  deckId={currentDeckId}
  queryId={queryId}
  isOwner={isOwner}
  totalSets={flashcardSets.length}
  setNumber={flashcardSetNumber}
/>
```

**Files affected:**
- `src/components/features/InteractiveResultsView.tsx`

---

### Step 3: Add Zoom Controls to DiagramViewer

Add zoom in/out/reset controls and apply CSS transform scale to the diagram image.

**Actions:**

- Import `ZoomIn`, `ZoomOut`, `RotateCcw` from lucide-react (add to existing import)
- Add `zoomScale` state: `const [zoomScale, setZoomScale] = useState(1);`
- Add zoom helper:
  ```tsx
  const zoomIn = () => setZoomScale(v => Math.min(3, parseFloat((v + 0.25).toFixed(2))));
  const zoomOut = () => setZoomScale(v => Math.max(0.5, parseFloat((v - 0.25).toFixed(2))));
  const resetZoom = () => setZoomScale(1);
  ```
- Wrap the diagram image in an `overflow-hidden` container and apply `transform: scale(zoomScale)`
- Add zoom controls bar below the diagram image (above the description area, or below the image within the card)
- Reset zoom to 1 when navigating to next/prev diagram

**Zoom container and image change:**

Replace:
```tsx
<div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 rounded-xl p-3 sm:p-4 md:p-6 flex items-center justify-center min-h-[200px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[400px]">
  {loading ? (
    <Loader2 ... />
  ) : renderedUrl ? (
    <img src={renderedUrl} alt={currentDiagram.title} className="max-w-full h-auto object-contain" ... />
  ) : (
    <p ...>Failed to load diagram</p>
  )}
</div>
```

With:
```tsx
{/* Zoom controls */}
<div className="flex items-center justify-between mb-2">
  <span className="text-xs text-gray-500 font-medium">{Math.round(zoomScale * 100)}% zoom</span>
  <div className="flex items-center gap-1">
    <button
      onClick={zoomOut}
      disabled={zoomScale <= 0.5}
      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors"
      title="Zoom out"
    >
      <ZoomOut className="h-3.5 w-3.5 text-gray-600" />
    </button>
    <button
      onClick={resetZoom}
      className="px-2 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600 font-medium"
      title="Reset zoom"
    >
      Reset
    </button>
    <button
      onClick={zoomIn}
      disabled={zoomScale >= 3}
      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors"
      title="Zoom in"
    >
      <ZoomIn className="h-3.5 w-3.5 text-gray-600" />
    </button>
  </div>
</div>

{/* Diagram image with zoom */}
<div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 rounded-xl overflow-hidden flex items-center justify-center min-h-[200px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[400px]">
  {loading ? (
    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 animate-spin text-purple-600" />
  ) : renderedUrl ? (
    <div
      style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center', transition: 'transform 0.2s ease' }}
      className="p-3 sm:p-4 md:p-6"
    >
      <img
        src={renderedUrl}
        alt={currentDiagram.title}
        className="max-w-full h-auto object-contain"
        onError={() => console.error('Failed to load diagram')}
      />
    </div>
  ) : (
    <p className="text-sm sm:text-base text-gray-500">Failed to load diagram</p>
  )}
</div>
```

**Reset zoom on diagram navigation:**
Add `setZoomScale(1)` to both `nextDiagram()` and `prevDiagram()` functions.

**Files affected:**
- `src/components/features/DiagramViewer.tsx`

---

### Step 4: Fix Flashcard Navigation Button Overlap

The `flex-1` class on `sm:flex-none` makes Prev/Next buttons stretch across the full row on desktop when the card is narrow.

**Actions:**

Replace in the Navigation section of `FlashcardViewer`:
```tsx
// OLD:
className="flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10"
// NEW:
className="min-w-[80px] text-xs sm:text-sm h-9 sm:h-10"
```

Apply to both the Prev and Next `<Button>` elements (lines 319 and 336).

**Files affected:**
- `src/components/features/FlashcardViewer.tsx`

---

### Step 5: Add Flashcard Plan Limit Enforcement to API

Update `/api/content/flashcards/route.ts` to check plan limits (parity with quiz) and support a `regenerate` flag.

**Actions:**

- Add `regenerate` to the Zod schema:
  ```typescript
  const flashcardsSchema = z.object({
    queryId: z.string(),
    cardCount: z.number().optional().default(15),
    regenerate: z.boolean().optional().default(false),
  });
  ```
- Import `canGenerateContent` from `plan-limits.service.ts`:
  ```typescript
  import { canGenerateContent } from '@/lib/services/plan-limits.service';
  ```
- Add plan limit check after ownership check:
  ```typescript
  // Check plan limit
  const limitCheck = await canGenerateContent(session.user.id, queryId, 'flashcards');
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.reason || 'Upgrade to Pro for more flashcard sets.' }, { status: 403 });
  }
  ```

**Files affected:**
- `src/app/api/content/flashcards/route.ts`

---

### Step 6: Update GenerateFlashcardsButton to Handle 403 (UpgradeBanner)

Match the pattern used in `GenerateQuizButton` and `GenerateAudioButton`.

**Actions:**

- Import `UpgradeBanner` from `./UpgradeBanner`
- Add `showUpgrade`, `upgradeMessage` state
- Handle 403 response by showing UpgradeBanner instead of error
- Add plan info footer text: `Free: 1 flashcard set per topic • Pro: Unlimited`

**Complete replacement of GenerateFlashcardsButton.tsx:**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Layers, Zap, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UpgradeBanner } from './UpgradeBanner';

interface GenerateFlashcardsButtonProps {
  queryId: string;
}

export function GenerateFlashcardsButton({ queryId }: GenerateFlashcardsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setShowUpgrade(false);

    try {
      const response = await fetch('/api/content/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId, cardCount: 15 }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setUpgradeMessage(data.error || 'Upgrade to Pro for unlimited flashcard sets.');
          setShowUpgrade(true);
          return;
        }
        throw new Error(data.error || 'Failed to generate flashcards');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {showUpgrade ? (
        <UpgradeBanner message={upgradeMessage} dismissible />
      ) : (
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Flashcards...
            </>
          ) : (
            <>
              <Layers className="mr-2 h-4 w-4" />
              Generate Flashcards
            </>
          )}
        </Button>
      )}

      {!showUpgrade && (
        <p className="text-xs text-center text-gray-500">
          <Zap className="h-3 w-3 inline mr-1" />
          Free: 1 set per topic
          <span className="mx-2">•</span>
          <Crown className="h-3 w-3 inline mr-1" />
          Pro: Unlimited sets
        </p>
      )}
    </div>
  );
}
```

**Files affected:**
- `src/components/features/GenerateFlashcardsButton.tsx`

---

### Step 7: Add Flashcard Regeneration to FlashcardViewer

Add Pro-only "New Set" button to the FlashcardViewer header (parity with PracticeQuizViewer's "New questions" button).

**Actions:**

- Add new props to `FlashcardViewerProps` interface:
  ```typescript
  isOwner?: boolean;
  queryId?: string;
  setNumber?: number;
  totalSets?: number;
  ```
- Update function signature to include these props with defaults
- Add `regenerating`, `regenError` state
- Import `RefreshCw`, `Loader2`, `Sparkles` from lucide-react (add to existing import)
- Import `UpgradeBanner` from `./UpgradeBanner`
- Add `handleRegenerate` function:
  ```typescript
  const handleRegenerate = async () => {
    if (!queryId) return;
    setRegenerating(true);
    setRegenError('');
    try {
      const res = await fetch('/api/content/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId, cardCount: 15, regenerate: true }),
      });
      if (res.status === 403) {
        const errData = await res.json();
        setRegenError(errData.error || 'Plan limit reached. Upgrade to Pro for more flashcard sets.');
        return;
      }
      if (!res.ok) throw new Error('Failed to generate');
      // Refresh page to load new deck
      router.refresh();
    } catch (err) {
      console.error('Flashcard regen error:', err);
    } finally {
      setRegenerating(false);
    }
  };
  ```
- Add `useRouter` import (add to imports)
- Add "New Set" button to Header `<div className="flex gap-2 flex-wrap">`:
  ```tsx
  {isOwner && queryId && (
    <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={regenerating} className="text-xs">
      {regenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
      <span className="hidden sm:inline">New Set</span>
    </Button>
  )}
  ```
- Show UpgradeBanner after header when `regenError` is set:
  ```tsx
  {regenError && (
    <div className="mb-3">
      <UpgradeBanner message={regenError} />
    </div>
  )}
  ```
- Show `Set {setNumber} of {totalSets}` badge in header when `totalSets > 1`:
  ```tsx
  <p className="text-xs sm:text-sm text-muted-foreground">
    {setNumber && totalSets && totalSets > 1 ? `Set ${setNumber} of ${totalSets} — ` : ''}
    {reviewOnly ? '🔁 Review mode — ' : ''}
    Card {currentIndex + 1} of {activeCards.length}
  </p>
  ```
- Add session-complete regeneration CTA (similar to PracticeQuizViewer's "Generate Quiz Set N+1"):
  ```tsx
  {isOwner && queryId && !regenError && (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-4 mb-4">
      <Sparkles className="h-5 w-5 text-indigo-500 mx-auto mb-2" />
      <p className="font-semibold text-gray-800 text-sm mb-1 text-center">Ready for a new challenge?</p>
      <p className="text-xs text-gray-500 mb-3 text-center">Get 15 fresh flashcards on the same topic</p>
      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                   bg-gradient-to-r from-indigo-600 to-blue-600 text-white
                   font-bold text-sm hover:from-indigo-700 hover:to-blue-700
                   transition-all disabled:opacity-60"
      >
        {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {regenerating ? 'Generating…' : `Generate Set ${(setNumber ?? 1) + 1}`}
      </button>
    </div>
  )}
  {isOwner && regenError && (
    <div className="mb-4"><UpgradeBanner message={regenError} /></div>
  )}
  ```
  This goes in the `sessionComplete` return block, before the existing action buttons.

**Files affected:**
- `src/components/features/FlashcardViewer.tsx`

---

### Step 8: Add Push Notification Toggle to Mobile Menu and Profile

`PushNotificationSetup` is defined but never rendered. Add it to two places.

**Actions for Header.tsx:**

- Import `PushNotificationSetup` from `@/components/pwa/PushNotificationSetup`
- Import `Bell` from lucide-react (already imported in PushNotificationSetup; add to Header imports if not present)
- Add a new "Account" section to the mobile menu, after the "Progress" section, containing PushNotificationSetup:

```tsx
{/* Account section */}
<div>
  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-2 mb-2">Account</p>
  <div className="px-3 py-2 rounded-xl bg-white/60">
    <p className="text-xs text-gray-500 mb-2">Push Notifications</p>
    <PushNotificationSetup />
  </div>
</div>
```

**Actions for profile page:**

Find `src/app/(dashboard)/profile/page.tsx` and add a "Notifications" section.

- The profile page is a server component, but `PushNotificationSetup` is a client component — import directly in the JSX
- Add a card/section at the bottom of the profile page content:

```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
  <h3 className="text-sm font-semibold text-gray-900 mb-1">Push Notifications</h3>
  <p className="text-xs text-gray-500 mb-3">Get reminders for quiz reviews and streak alerts</p>
  <PushNotificationSetup />
</div>
```

The `PushNotificationSetup` component renders a properly styled Button with Bell icon + text. On mobile, when it's inside the mobile menu, the Button renders as a full row element — not a circle. The circle issue was likely because the component was missing from the render tree, or a browser's native notification permission bubble was shown without context.

**Files affected:**
- `src/components/layout/Header.tsx`
- `src/app/(dashboard)/profile/page.tsx`

---

### Step 9: TypeScript Validation

Run type check to verify all changes compile cleanly.

**Actions:**
- Run `npx tsc --noEmit`
- Fix any type errors (likely: FlashcardViewer new props need defaults, router import, etc.)

**Files affected:**
- Any files with TypeScript errors from previous steps

---

## Connections & Dependencies

### Files That Reference This Area

- `src/app/(dashboard)/results/[id]/page.tsx` → renders `InteractiveResultsView`, `FlashcardViewer` indirectly
- `src/components/features/InteractiveResultsView.tsx` → renders `FlashcardViewer`, `DiagramViewer`, `GenerateFlashcardsButton`
- `src/lib/services/plan-limits.service.ts` → `canGenerateContent` used in flashcards route
- `src/components/pwa/PushNotificationSetup.tsx` → added to Header + profile
- `src/components/layout/Header.tsx` → rendered in dashboard layout

### Updates Needed for Consistency

- `UpgradeBanner` is already created (from previous plan implementation) — just import it
- The flashcard API endpoint path is `/api/content/flashcards` (POST) — same endpoint used by FlashcardViewer regen

### Impact on Existing Workflows

- Free users who have already generated a flashcard set will now see UpgradeBanner when trying to regenerate
- Pro users can generate unlimited flashcard sets (same as quiz behavior)
- Diagram zoom resets when navigating between diagrams (intentional UX)
- The results page header is now gradient — action buttons (Share/Save/WhatsApp) need to remain visible on the purple background

---

## Validation Checklist

- [ ] Results page header shows gradient violet/indigo with white query title text
- [ ] Each of the 7 content cards has a distinct colored top-strip
- [ ] Diagram zoom buttons appear below the diagram and +/- scale works correctly
- [ ] Zoom resets when navigating to next/prev diagram
- [ ] Flashcard Prev/Next buttons no longer expand to full-width on desktop
- [ ] Free user generating a second flashcard set gets 403 + UpgradeBanner
- [ ] Pro user can generate additional flashcard sets (regenerate button visible to owner)
- [ ] FlashcardViewer shows "Set X of Y" badge when multiple sets exist
- [ ] PushNotificationSetup appears in mobile menu Account section with Bell + text (not a circle)
- [ ] PushNotificationSetup appears on profile page in a notifications card
- [ ] `npx tsc --noEmit` passes with 0 errors

---

## Success Criteria

The implementation is complete when:

1. The results page header is a gradient violet/indigo design with white text, and all 7 content cards have distinct colored identities via top-strips and header tints
2. Diagram viewer has +/- zoom controls that scale the mermaid.ink image with CSS transform
3. Flashcard navigation Prev/Next buttons have fixed `min-w-[80px]` width (no overlap on desktop)
4. Flashcard regeneration (Pro only): API enforces plan limit with 403; FlashcardViewer shows "New Set" button for owner + UpgradeBanner on 403; GenerateFlashcardsButton shows UpgradeBanner on 403
5. Push notification toggle is a full-width button with icon + text in mobile menu, not a circle

---

## Notes

### API Assessment (Item 6)

**Current APIs — assessment:**

| Service | Status | Notes |
|---------|--------|-------|
| Perplexity `sonar` | ✅ Good | Fallback chain sonar → sonar-pro → llama-online |
| Groq `llama-3.1-8b-instant` | ⚠️ Acceptable | Older 8B model; `llama-3.3-70b-versatile` would give richer articles but costs more tokens |
| Gemini 2.5 Flash (flashcards) | ✅ Good | Current and fast |
| Claude API (quiz/diagrams/ppt) | ✅ Good | claude-sonnet-4-6 or claude-haiku-4-5 depending on budget |
| ElevenLabs TTS | ✅ Good | High-quality audio; consider `eleven_turbo_v2_5` for faster generation |
| mermaid.ink (diagram rendering) | ⚠️ External dependency | Could be replaced with client-side `mermaid` npm package for reliability (no external network call); deferred to future plan |

**Suggested API improvement for a future plan:**
- Replace `mermaid.ink` with `mermaid.js` npm package rendered in a `useEffect` — eliminates the external network dependency and allows higher-quality theming
- Upgrade Groq model from `llama-3.1-8b-instant` → `llama-3.3-70b-versatile` for richer articles (test cost impact first)

### Student-Focused Improvement Suggestions

**Already implemented:**
- Gamification (XP, streaks, achievements) ✓
- Spaced repetition for flashcards ✓
- Social learning (groups, challenges) ✓
- Multiple content formats (7 types) ✓

**Next high-value additions for students:**
1. **Article highlights/notes**: Allow students to highlight text and add personal notes on the article — very high engagement feature for UPSC/JEE preparation
2. **Quiz timer mode**: Optional countdown timer for UPSC-style timed practice
3. **Weak areas tracking**: Track which quiz questions users consistently get wrong across sessions; surface as "Focus these topics" on the dashboard
4. **Collaborative notes in groups**: Allow group members to annotate shared content
5. **Mobile keyboard shortcut for flashcards**: Swipe left/right gesture on mobile to flip/navigate

### Production Deployment Readiness

**Ready for production:**
- Auth (NextAuth v5 + Google + credentials) ✓
- Payments (Razorpay) ✓
- Storage (Cloudflare R2) ✓
- Email (Resend) ✓
- Database (Prisma + PostgreSQL) ✓ — ensure `npx prisma migrate deploy` on prod
- PWA (service worker, push) ✓
- Redis (Upstash) ✓

**Pre-launch checklist:**
1. `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` set to production domain
2. `npx prisma migrate deploy` on production DB
3. All API keys (Perplexity, Groq, Anthropic, ElevenLabs, Razorpay, Resend, VAPID) in prod environment
4. Google OAuth redirect URIs updated for production domain
5. Rate limiting on `/api/query/submit` (Upstash Ratelimit) — not currently implemented; recommend adding

**User traction opportunity:**
- Indian EdTech market is large — target UPSC/JEE/NEET/CAT preparation audiences
- Freemium model at ₹600/month is competitive vs. Unacademy (₹2500+), BYJU's (₹3000+)
- Unique angle: **instant AI-powered multi-format content** vs. static video courses
- Suggested first marketing channel: Reddit (r/UPSC, r/JEE), Telegram groups for exam prep
- A/B test the landing page hero — emphasize the "7 formats in 60 seconds" value prop
- Pre-populate demo content for common search terms so new users see value before signup

---

## Implementation Notes

**Implemented:** 2026-02-28

### Summary

- Results page header changed to violet/indigo gradient with white text (Step 1)
- All 7 content cards (Article, Presentation, Diagrams, Concept Map, Audio, Quiz, Flashcards) now have colored gradient top-strips and tinted headers (Step 2)
- Flashcard set tracking added (parity with quizSets) — "Set N" label shows when multiple sets exist (Step 2)
- All empty states updated to colored gradient backgrounds matching their card theme (Step 2)
- FlashcardViewer call updated to pass isOwner, queryId, setNumber, totalSets (Step 2)
- DiagramViewer: added ZoomIn/ZoomOut/Reset controls in gradient header (25% steps, 50%–300%), CSS transform zoom with transition; zoom resets on diagram navigation (Step 3)
- FlashcardViewer: fixed prev/next button overlap by changing flex-1 → min-w-[80px] (Step 4)
- FlashcardViewer: added isOwner/queryId/setNumber/totalSets props; handleRegenerate function; "New Set" button in header; UpgradeBanner on 403; session-complete regen CTA (Step 7)
- Flashcards API route: added regenerate Zod flag; plan limit check (canGenerateContent) only enforced when regenerate=true (Step 5)
- GenerateFlashcardsButton: UpgradeBanner shown on 403 instead of red error box (Step 6)
- PushNotificationSetup: refactored to compact inline Button (no wrapping div, flex row) (Step 8)
- Header: added Bell import + PushNotificationSetup; added "Account" section in mobile menu with Profile, Upgrade to Pro, Notifications row (PushNotificationSetup), and Sign Out (Step 8)
- Profile page: added Push Notifications card section above NotificationPreferences (Step 8)
- TypeScript: 0 errors (Step 9)

### Deviations from Plan

- Flashcard plan limit check: applied only when `regenerate: true` (not on initial generation) to avoid breaking the initial "Generate Flashcards" button for free users who haven't generated yet. The free plan limit of 1 means free users can generate once initially; regeneration requires Pro.
- Zoom implementation uses dynamic padding on the inner wrapper instead of a fixed-size overflow container, providing better visual behavior with large diagrams.
- PushNotificationSetup loading spinner uses CSS border animation instead of lucide Loader2 to keep the button compact.

### Issues Encountered

- None — TypeScript passed with 0 errors on first attempt.
