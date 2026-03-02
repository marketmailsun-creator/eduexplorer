# Plan: Fix Image Math Analysis, Diagram Loading, and UI Redesign for Library/Challenges/Leaderboard

**Created:** 2026-03-01
**Status:** Implemented
**Request:** Fix math image giving generic responses, fix visual diagram loading failure, redesign Library/Challenges/Leaderboard UI, and assess production scaling for 5000 users.

---

## Overview

### What This Plan Accomplishes

This plan fixes two critical bugs (image analysis returning error strings as content, and diagram SVG not rendering), and redesigns three pages (Library, Challenges, Leaderboard) with gradient headers, visual enhancements, and better UX — matching the design language already established in the explore/results pages. It also provides a scaling assessment for the current Vercel + Neon stack.

### Why This Matters

Image analysis is a core feature — when a student uploads a math problem photo and gets an article about "Understanding the Missing Image" instead of a solution, it destroys trust. Diagram loading is broken preventing visual learning. The Library, Challenges, and Leaderboard pages look plain compared to the polished explore/results pages, reducing engagement. All three fixes directly improve learning outcomes and app quality.

---

## Current State

### Relevant Existing Structure

```
src/lib/services/media-analysis.service.ts     — image analysis (Claude vision)
src/app/api/query/submit/route.ts              — query submission, media processing
src/components/features/DiagramViewer.tsx      — mermaid.ink SVG rendering
src/app/(dashboard)/library/page.tsx           — saved topics list
src/app/(dashboard)/challenges/page.tsx        — challenges list
src/app/(dashboard)/challenges/[id]/page.tsx   — challenge detail
src/app/(dashboard)/leaderboard/page.tsx       — quiz + XP tabs
```

### Gaps or Problems Being Addressed

**Bug 1 — Image analysis silently fails:**
- `analyzeImageWithClaude()` has a try-catch that returns `'Unable to analyze image'` on error instead of throwing
- `submit/route.ts` wraps this silently as `[Image content: Unable to analyze image]`
- Since there's no user query text (media-only), `enrichedQuery` becomes: `"Please analyze and explain the following:\n\n[Image content: Unable to analyze image]"`
- Perplexity + Groq treats this as a topic and generates an article about the error phrase
- The bug in the submit route catch block also uses `MediaError` (undefined variable) instead of `error`
- `max_tokens: 1024` is too low for complex math problems; analysis gets truncated
- The image analysis prompt doesn't instruct Claude to actually solve math problems

**Bug 2 — Diagram not loading:**
- The container has `overflow-hidden` which clips the diagram image and zoom wrapper
- The `new Image()` preload approach fails silently — SVG loading from mermaid.ink via Image() object is unreliable in some browsers
- There is no error state UI shown when diagram fails — just "Failed to load diagram" text with no retry option
- The useEffect correctly skips re-fetching but has no recovery path on failure

**UI Gap 3 — Library/Challenges/Leaderboard are visually dated:**
- Library: plain white sticky header, no gradient, no search, no category filter
- Challenges: `container py-8 px-4` flat layout, plain border cards, no hero
- Leaderboard: flat container layout, no podium visualization, no gradient hero

---

## Proposed Changes

### Summary of Changes

- Fix `analyzeImageWithClaude` to throw on error instead of returning error string
- Fix submit route catch block variable name bug (`MediaError` → `error`)
- Increase image analysis `max_tokens` from 1024 to 2048
- Update image analysis prompt to explicitly solve math problems step-by-step
- Add a query enrichment layer: when image contains math/science problems, set `queryText` to the solved problem for better Perplexity research
- Fix DiagramViewer: remove `overflow-hidden`, replace `new Image()` preload with direct `<img>` + error state, add retry button
- Redesign Library page: gradient hero header, colored left-border cards, "Generate more" CTA
- Redesign Challenges page: gradient hero banner, colored status cards with avatars, score display
- Redesign Leaderboard page: gradient hero, top-3 podium with special styling, better rank rows

### New Files to Create

| File Path | Purpose |
| --- | --- |
| (none — all changes are to existing files) | — |

### Files to Modify

| File Path | Changes |
|---|---|
| `src/lib/services/media-analysis.service.ts` | Throw on error, increase max_tokens to 2048, improve math-solving prompt |
| `src/app/api/query/submit/route.ts` | Fix MediaError bug, add check for analysis failure string |
| `src/components/features/DiagramViewer.tsx` | Remove overflow-hidden, replace Image() preload with direct render + error state + retry |
| `src/app/(dashboard)/library/page.tsx` | Gradient hero header, colored left-border cards, improved typography |
| `src/app/(dashboard)/challenges/page.tsx` | Gradient hero banner, colored status cards, avatar display |
| `src/app/(dashboard)/leaderboard/page.tsx` | Gradient hero, podium top-3 display, improved rank rows |

### Files to Delete (if any)

None.

---

## Design Decisions

### Key Decisions Made

1. **Throw instead of silent-return in analyzeImageWithClaude**: The current approach swallows errors and returns a sentinel string, which propagates through the pipeline. Throwing lets the outer try-catch in the route return a proper 422 with a user-friendly message. Users should know the image failed rather than getting a nonsensical article.

2. **Solve math problems in image analysis step (not just extract text)**: The current prompt says "State clearly what question or problem needs to be answered". We change it to "If the image contains a math problem, solve it completely with step-by-step working, showing all calculations." This means the enriched query sent to Perplexity contains the full solution context, leading to a proper educational article about the solution method.

3. **Direct `<img>` rendering in DiagramViewer instead of preload**: `new Image()` for SVGs from external domains is unreliable. Removing the preload and rendering `<img>` directly with `onLoad`/`onError` handlers gives us the same outcome with more reliability. Add visible error UI with a "Retry" button.

4. **Remove `overflow-hidden` from diagram container**: The zoom implementation using `transform: scale()` inside `overflow-hidden` clips content. Change to `overflow-auto` with scroll support at high zoom levels, which gives a better UX (scrollable zoomed view).

5. **Library/Challenges/Leaderboard use gradient headers matching other pages**: The explore page and results page both use `bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700`. Use the same pattern for visual consistency.

6. **Podium display for top 3 in Leaderboard**: Gold (#1), Silver (#2), Bronze (#3) styled cards with larger avatars and medal emoji badges makes the leaderboard visually exciting and encourages competition.

### Alternatives Considered

- **Use mermaid.js directly (npm package) instead of mermaid.ink**: More reliable but requires client-side WASM bundle (~400KB). Rejected for now — mermaid.ink fix is simpler and fixes the immediate issue.
- **Stream the image analysis response**: Streaming adds complexity. Rejected — 2048 tokens completes in ~3s, acceptable.
- **Add search to Library**: Useful but adds server state complexity (filter by queryText). Deferred to a future plan.

### Open Questions (if any)

None — all decisions are clear.

---

## Step-by-Step Tasks

### Step 1: Fix `analyzeImageWithClaude` — throw on error, increase tokens, improve math prompt

The `analyzeImageWithClaude` function in `media-analysis.service.ts` silently catches errors and returns a string. Fix it to throw so the submit route returns a proper 422.

**Actions:**

- Change `max_tokens: 1024` to `max_tokens: 2048`
- Replace the text prompt to explicitly include math problem solving
- In the catch block, `throw error` instead of `return 'Unable to analyze image'`

**New prompt text (replace the existing `text` field in the messages array):**

```
Analyze this image thoroughly in an educational context. Be exhaustive and precise.

1. Extract ALL visible text exactly as written — every word, number, symbol, label, and option
2. MATH/SCIENCE PROBLEMS: If the image contains a math problem, equation, or science question:
   a. Write out the full problem statement exactly
   b. Solve it completely step-by-step, showing all working and calculations
   c. State the final answer clearly
   d. Identify the method/concept used (e.g. quadratic formula, integration by parts, Newton's 2nd law)
3. MULTIPLE CHOICE: Include the question AND all answer options (A, B, C, D) with the correct answer identified
4. Identify the subject area (algebra, geometry, calculus, physics, chemistry, biology, history, etc.)
5. If it is a diagram, chart, or graph: describe all labels, axes, values, and what it represents

Reproduce every visible piece of text. This content will be used as a learning and research query.
```

**Files affected:**
- `src/lib/services/media-analysis.service.ts`

---

### Step 2: Fix submit route — MediaError bug + check for analysis failure

Fix the bug where `MediaError` is referenced instead of `error` in the catch block. Also add a guard: if the image analysis result contains the phrase "Unable to analyze", return a 422 immediately.

**Actions:**

- In the image processing catch block, change `MediaError` → `error`:
  ```typescript
  console.error('❌ Image analysis failed:', error);
  ```
- After calling `analyzeImageWithClaude`, add an explicit check:
  ```typescript
  const analysis = await analyzeImageWithClaude(buffer, imageFiles[0].type);
  // analyzeImageWithClaude now throws on error, so if we reach here it succeeded
  mediaContextParts.push(`[Image content: ${analysis}]`);
  ```
  (No special check needed if analyzeImageWithClaude throws — the outer catch handles it)
- The outer catch returns 422 with: `'Failed to analyze the attached image. Please try again or type your question manually.'`

**Files affected:**
- `src/app/api/query/submit/route.ts`

---

### Step 3: Fix DiagramViewer — remove overflow-hidden, replace preload with direct render + error state

The diagram container has `overflow-hidden` which clips content and prevents proper zoom scrolling. The `new Image()` preload is unreliable for external SVGs.

**Actions:**

Replace the diagram rendering section. The key changes:

1. Add `error` state: `const [errorDiagrams, setErrorDiagrams] = useState<Set<number>>(new Set())`
2. Add `retryCount` state: `const [retryCount, setRetryCount] = useState(0)`
3. Remove the `new Image()` preload — instead, set `renderedUrl` to the mermaid.ink URL immediately, and let the `<img>` itself handle onLoad/onError
4. Change `renderedDiagrams` from storing URLs (after preload) to storing "ready" URLs immediately
5. Change container from `overflow-hidden` to `overflow-auto`
6. Add an error state UI with "Retry" button

**Revised rendering logic:**

```typescript
// Replace the entire useEffect block with:
useEffect(() => {
  const renderDiagram = () => {
    if (!currentDiagram.mermaidCode || renderedDiagrams.has(currentDiagram.id)) {
      return;
    }
    setLoading(true);
    try {
      const encoded = btoa(unescape(encodeURIComponent(currentDiagram.mermaidCode)));
      const imageUrl = `https://mermaid.ink/svg/${encoded}?theme=default`;
      // Set URL directly — let <img> handle load/error
      setRenderedDiagrams(prev => new Map(prev).set(currentDiagram.id, imageUrl));
    } catch (error) {
      console.error('Error encoding diagram:', error);
      setErrorDiagrams(prev => new Set(prev).add(currentDiagram.id));
    } finally {
      setLoading(false);
    }
  };
  renderDiagram();
}, [currentIndex, retryCount]); // only re-run on navigation or retry, not on renderedDiagrams change
```

**Revised img rendering:**
```tsx
{renderedUrl ? (
  <div style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center', transition: 'transform 0.2s ease', padding: '12px' }}>
    <img
      src={renderedUrl}
      alt={currentDiagram.title}
      className="max-w-full h-auto object-contain"
      onLoad={() => setLoading(false)}
      onError={() => {
        setErrorDiagrams(prev => new Set(prev).add(currentDiagram.id));
        setRenderedDiagrams(prev => { const next = new Map(prev); next.delete(currentDiagram.id); return next; });
        setLoading(false);
      }}
    />
  </div>
) : errorDiagrams.has(currentDiagram.id) ? (
  <div className="text-center space-y-3">
    <p className="text-sm text-gray-500">Failed to render diagram</p>
    <button
      onClick={() => {
        setErrorDiagrams(prev => { const next = new Set(prev); next.delete(currentDiagram.id); return next; });
        setRetryCount(c => c + 1);
      }}
      className="px-4 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
    >
      Retry
    </button>
    {currentDiagram.mermaidCode && (
      <details className="text-left mt-2">
        <summary className="text-xs text-gray-400 cursor-pointer">Show diagram code</summary>
        <pre className="text-xs bg-gray-50 p-3 rounded mt-1 overflow-auto max-h-40">{currentDiagram.mermaidCode}</pre>
      </details>
    )}
  </div>
) : (
  <p className="text-sm text-gray-400">Loading diagram…</p>
)}
```

**Container div change:**
```tsx
// FROM: overflow-hidden
// TO: overflow-auto
<div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 rounded-xl overflow-auto flex items-center justify-center min-h-[200px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[400px]">
```

**Files affected:**
- `src/components/features/DiagramViewer.tsx`

---

### Step 4: Redesign Library page

Transform the Library page from a plain white layout to a gradient-header design matching the explore/results pages.

**Actions:**

Read the current file, then apply these changes:

1. **Replace the sticky header** from plain white `bg-white border-b` to gradient:
```tsx
<div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 px-4 py-5 sticky top-0 z-10 shadow-lg">
  <div className="max-w-2xl mx-auto">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-white">My Library</h1>
        <p className="text-xs text-purple-200 mt-0.5">
          {savedQueries.length > 0
            ? `${savedQueries.length} saved topic${savedQueries.length !== 1 ? 's' : ''}`
            : 'Your saved learning materials'}
        </p>
      </div>
      <Link
        href="/explore"
        className="text-sm font-semibold text-white/80 hover:text-white border border-white/30 hover:border-white/60 px-3 py-1.5 rounded-lg transition-colors"
      >
        + Explore
      </Link>
    </div>
  </div>
</div>
```

2. **Update content cards** — add a colored left border strip based on content type, and make the card header more prominent:
```tsx
<div key={saved.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
  {/* Color strip at top based on content richness */}
  <div className={`h-1 ${hasQuiz ? 'bg-gradient-to-r from-pink-500 to-rose-500' : hasFlash ? 'bg-gradient-to-r from-indigo-500 to-blue-500' : hasAudio ? 'bg-gradient-to-r from-purple-500 to-violet-500' : 'bg-gradient-to-r from-gray-200 to-gray-300'}`} />
  ...rest of card
```

3. **Add missing content counts/visual**: Show number of content types generated on each card as a mini stat row.

4. **Add level badge**: Show `query.complexityLevel` as a small badge (e.g. "College").

5. **Add empty state icon improvement**: For empty library, use a more compelling empty state (existing EmptyLibrary component is used, keep it).

**Full card structure after changes:**
```tsx
<div key={saved.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
  {/* Top color strip */}
  <div className={`h-1.5 ${hasQuiz ? 'bg-gradient-to-r from-pink-500 to-rose-500' : hasFlash ? 'bg-gradient-to-r from-indigo-500 to-blue-500' : hasAudio ? 'bg-gradient-to-r from-purple-500 to-violet-500' : 'bg-gradient-to-r from-violet-400 to-indigo-500'}`} />

  <div className="p-4 sm:p-5">
    {/* Level + Date row */}
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium capitalize">
        {saved.query.complexityLevel || 'College'}
      </span>
      <span className="text-xs text-gray-400">
        {new Date(saved.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
      </span>
    </div>

    <Link href={`/results/${saved.query.id}`} className="block group">
      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-2 text-sm sm:text-base leading-snug">
        {saved.query.queryText}
      </h3>
    </Link>

    {/* Content badges */}
    <div className="flex flex-wrap items-center gap-1.5 mt-3">
      {hasAudio && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-medium">🎧 Audio</span>}
      {hasQuiz && <span className="text-xs px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100 font-medium">🧩 Quiz</span>}
      {hasFlash && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">🎴 Flashcards</span>}
    </div>

    {/* Actions */}
    <div className="flex gap-2 mt-3">
      <Link href={`/results/${saved.query.id}`} className="flex-1 text-center py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors">
        Continue Learning →
      </Link>
      {hasAudio && (
        <Link href={`/results/${saved.query.id}#audio`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors">
          <Headphones className="h-3.5 w-3.5" />
          Listen
        </Link>
      )}
    </div>
  </div>
</div>
```

**Also import BookOpen from lucide-react** (for potential empty state enrichment).

**Files affected:**
- `src/app/(dashboard)/library/page.tsx`

---

### Step 5: Redesign Challenges page

Transform from a plain `container py-8 px-4` layout to a gradient-hero design. Improve challenge cards with better visual hierarchy.

**Actions:**

1. **Add gradient hero header** at the top (full-width, not inside container):
```tsx
<div className="bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 px-4 py-6 shadow-lg">
  <div className="max-w-3xl mx-auto">
    <div className="flex items-center gap-3">
      <Swords className="h-8 w-8 text-white" />
      <div>
        <h1 className="text-2xl font-bold text-white">Challenges</h1>
        <p className="text-sm text-orange-100 mt-0.5">
          {active.length > 0 ? `${active.length} active challenge${active.length !== 1 ? 's' : ''}` : 'Compete with friends on quiz topics'}
        </p>
      </div>
    </div>
  </div>
</div>
```

2. **Wrap content in max-width container** with `py-6 px-4` and `max-w-3xl mx-auto space-y-5`.

3. **Improve challenge cards** — add colored left border based on status, show opponent avatar:

```tsx
<div key={c.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all
  ${isPending && !isChallenger ? 'border-yellow-200' : isAccepted ? 'border-blue-200' : 'border-gray-100'}`}>

  {/* Status strip */}
  <div className={`h-1.5 ${
    c.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
    c.status === 'ACCEPTED' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
    c.status === 'COMPLETED' && myScore !== null && oppScore !== null && myScore > oppScore ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
    c.status === 'COMPLETED' ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
    'bg-gradient-to-r from-gray-200 to-gray-300'
  }`} />

  <div className="p-4 space-y-3">
    {/* Header row: opponent + status badge */}
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Opponent avatar */}
        <img
          src={opponent.image || '/default-avatar.svg'}
          alt={opponent.name || 'User'}
          className="w-10 h-10 rounded-full border-2 border-gray-100 flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-400">
            {isChallenger ? 'You challenged' : 'Challenged by'}
          </p>
          <p className="font-semibold text-gray-900 truncate">{opponent.name ?? 'Anonymous'}</p>
        </div>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${cfg.color}`}>
        <StatusIcon className="h-3 w-3" />
        {cfg.label}
      </span>
    </div>

    {/* Topic */}
    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">
      📚 {c.query.queryText.substring(0, 100)}
    </p>

    {/* Score display for completed */}
    {c.status === 'COMPLETED' && ...existing score UI...}

    {/* Action buttons */}
    ...existing buttons...
  </div>
</div>
```

4. **Improve empty state** — make it visually appealing with a centered hero:
```tsx
<div className="text-center py-20">
  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
    <Swords className="h-10 w-10 text-orange-500" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">No challenges yet</h3>
  <p className="text-sm text-gray-500 mb-4">Go to a Study Group and challenge a member to a quiz!</p>
  <Link href="/groups" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all">
    Browse Study Groups →
  </Link>
</div>
```

5. **Change outer layout** from `<div className="container max-w-3xl py-8 px-4 space-y-6">` to `<div className="min-h-screen bg-gray-50">` at the top level.

**Files affected:**
- `src/app/(dashboard)/challenges/page.tsx`

---

### Step 6: Redesign Leaderboard page

Transform from flat container layout to gradient hero with podium top-3 visualization.

**Actions:**

1. **Wrap in full-page layout** — `<div className="min-h-screen bg-gray-50">` replacing `<div className="container mx-auto p-4 sm:p-6 max-w-4xl">`.

2. **Add gradient hero header**:
```tsx
<div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-500 px-4 py-6 shadow-lg">
  <div className="max-w-4xl mx-auto">
    <div className="flex items-center gap-3">
      <TrendingUp className="h-8 w-8 text-white" />
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-sm text-yellow-100">Top learners across EduExplorer</p>
      </div>
    </div>
    {/* Tab switcher inside hero */}
    <div className="flex gap-2 mt-4">
      <Link href="/leaderboard?tab=quiz" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${!isXPTab ? 'bg-white text-orange-600' : 'bg-white/20 text-white hover:bg-white/30'}`}>
        🧩 Quiz
      </Link>
      <Link href="/leaderboard?tab=xp" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 ${isXPTab ? 'bg-white text-yellow-600' : 'bg-white/20 text-white hover:bg-white/30'}`}>
        ⚡ XP
      </Link>
    </div>
  </div>
</div>
```

3. **Add Podium component for top-3** (inline, not a separate file): Before the main list card, render a 3-column podium for ranks 1/2/3:
```tsx
{leaderboard.length >= 3 && (
  <div className="flex items-end justify-center gap-3 sm:gap-6 py-6 px-4">
    {/* 2nd place */}
    <div className="flex flex-col items-center gap-2">
      <img src={leaderboard[1].user?.image || '/default-avatar.svg'} className="w-14 h-14 rounded-full border-4 border-gray-300 shadow-md" />
      <div className="text-center">
        <p className="text-xs font-semibold truncate max-w-[80px]">{leaderboard[1].user?.name}</p>
        <p className="text-sm font-bold text-gray-600">{leaderboard[1].totalScore}</p>
      </div>
      <div className="w-20 h-14 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg flex items-center justify-center">
        <span className="text-2xl">🥈</span>
      </div>
    </div>
    {/* 1st place — taller */}
    <div className="flex flex-col items-center gap-2 -mb-2">
      <div className="text-2xl">👑</div>
      <img src={leaderboard[0].user?.image || '/default-avatar.svg'} className="w-16 h-16 rounded-full border-4 border-yellow-400 shadow-lg" />
      <div className="text-center">
        <p className="text-xs font-bold truncate max-w-[80px]">{leaderboard[0].user?.name}</p>
        <p className="text-sm font-bold text-yellow-600">{leaderboard[0].totalScore}</p>
      </div>
      <div className="w-20 h-20 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg flex items-center justify-center">
        <span className="text-3xl">🏆</span>
      </div>
    </div>
    {/* 3rd place */}
    <div className="flex flex-col items-center gap-2">
      <img src={leaderboard[2].user?.image || '/default-avatar.svg'} className="w-14 h-14 rounded-full border-4 border-orange-400 shadow-md" />
      <div className="text-center">
        <p className="text-xs font-semibold truncate max-w-[80px]">{leaderboard[2].user?.name}</p>
        <p className="text-sm font-bold text-orange-600">{leaderboard[2].totalScore}</p>
      </div>
      <div className="w-20 h-10 bg-gradient-to-t from-orange-400 to-orange-300 rounded-t-lg flex items-center justify-center">
        <span className="text-xl">🥉</span>
      </div>
    </div>
  </div>
)}
```

4. **Improve rank rows** — Add a highlighted background for the current user row with a "You" label:
```tsx
<div className={`flex items-center gap-3 p-3 rounded-xl ${
  entry.user?.id === currentUserId
    ? 'bg-purple-50 border-2 border-purple-200 ring-1 ring-purple-300'
    : entry.rank <= 3 ? 'bg-yellow-50/50' : 'hover:bg-gray-50'
} transition-colors`}>
```

5. **Move content into `max-w-4xl mx-auto px-4 py-6`** container div.

**Apply same podium pattern to XPLeaderboardTab** using `from-yellow-50 to-orange-50` colors.

**Files affected:**
- `src/app/(dashboard)/leaderboard/page.tsx`

---

### Step 7: TypeScript validation

Run `npx tsc --noEmit` and fix any errors.

**Actions:**
- Run type check
- Fix any type errors (particularly around the DiagramViewer state types)

**Files affected:**
- Any files with type errors

---

## Connections & Dependencies

### Files That Reference This Area

- `src/app/api/query/submit/route.ts` imports `analyzeImageWithClaude` from `media-analysis.service.ts`
- `src/components/features/InteractiveResultsView.tsx` renders `DiagramViewer`
- `src/components/layout/Header.tsx` links to `/library`, `/challenges`, `/leaderboard`

### Updates Needed for Consistency

- DiagramViewer error handling should log errors to help debug mermaid.ink failures
- Library page needs `BookOpen` import added if used in empty state

### Impact on Existing Workflows

- The image analysis fix will cause the submit route to return 422 when Claude fails to analyze an image, instead of silently proceeding with the error string. Users will see a clear error message and can retry or type manually.
- The diagram fix improves resilience — diagrams now show retry button instead of silent failure.

---

## Validation Checklist

- [ ] Upload a math problem image — should get a proper article about solving that type of problem, not "Understanding the Missing Image"
- [ ] Upload an image when Claude API key is missing/wrong — should get a 422 error with friendly message, not proceed silently
- [ ] Open a result with diagrams — diagram SVGs should load visibly within 3 seconds
- [ ] Diagram error state shown when mermaid.ink fails — retry button works
- [ ] Zoom in/out on diagram works without content being clipped
- [ ] Library page shows gradient violet header
- [ ] Library cards show colored top strip matching content type
- [ ] Challenges page shows orange/red gradient hero banner
- [ ] Challenge cards show opponent avatar and colored status strip
- [ ] Leaderboard page shows yellow/amber gradient hero
- [ ] Leaderboard shows podium for top 3 in both quiz and XP tabs
- [ ] Current user row highlighted in leaderboard
- [ ] `npx tsc --noEmit` passes with 0 errors

---

## Success Criteria

1. A math problem image results in an educational article that explains the solution method and steps — never an article about "Unable to analyze image"
2. Visual diagrams load and display correctly; zoom in/out works; error state shows with retry button
3. Library, Challenges, and Leaderboard pages have gradient headers and visually polished card layouts matching the explore/results design language

---

## Notes

### Production Scaling Assessment: Vercel + Neon for 5,000 users / 500 concurrent

**Current stack assessment:**

| Component | Tier | 5,000 users | 500 concurrent |
|---|---|---|---|
| **Vercel** | Hobby/Pro | ✅ Handles well | ✅ Serverless scales |
| **Neon PostgreSQL** | Free/Launch | ⚠️ Connection limit | ❌ Needs pooling |
| **Upstash Redis** | Pay-per-use | ✅ Scales fine | ✅ OK |
| **Perplexity API** | Usage-based | ⚠️ Rate limits | ❌ 10 req/min on Sonar |
| **Groq API** | Usage-based | ✅ Fast | ⚠️ Per-minute limits |
| **Claude API** | Usage-based | ✅ OK | ⚠️ Concurrent limits |
| **ElevenLabs** | Starter | ⚠️ 3 concurrent | ❌ Upgrade needed |

**Key bottlenecks for 500 concurrent:**

1. **Database connections**: Neon serverless + Prisma creates a new connection per serverless function invocation. At 500 concurrent, this can exhaust Neon's connection pool (default 100). **Fix: Enable [Prisma Accelerate](https://www.prisma.io/accelerate) (connection pooler) or use PgBouncer.** This is the #1 scaling issue.

2. **Perplexity API rate limits**: `sonar` model has rate limits (~10 requests/min on free, higher on paid). At 500 concurrent users all submitting queries, you'll hit 429s frequently. **Fix: Implement a job queue (e.g. BullMQ with Upstash Redis) to serialize AI requests. Consider Perplexity's Growth plan.**

3. **Vercel serverless timeout**: On Hobby plan, serverless functions timeout at 10 seconds. The query submission flow (research + article generation) can take 15-30 seconds. **Fix: Upgrade to Vercel Pro (60s timeout) or Vercel Enterprise (300s).** Pro is sufficient for most queries.

4. **AI content generation**: Flashcard/quiz/diagram generation runs inline in API routes. These can timeout. **Fix: Move to background jobs or use Vercel's `waitUntil` with streaming responses.**

**Recommended actions for 5,000 users:**

- ✅ Use Vercel Pro ($20/month) — needed for 60s function timeout
- ✅ Enable Prisma Accelerate — solves DB connection pooling
- ✅ Use Neon Launch plan ($19/month) — more compute units + branching
- ✅ Upgrade Perplexity to Growth plan — higher rate limits
- ✅ Upgrade ElevenLabs to Creator ($22/month) — 10 concurrent requests
- ⚠️ Add BullMQ or Upstash QStash for AI job queuing (prevents 429s on burst traffic)
- ⚠️ Add Sentry for error tracking and performance monitoring

**Conclusion:** Yes, Vercel + Neon is production-ready for 5,000 users if you add Prisma Accelerate (connection pooling) and upgrade to Vercel Pro. For 500 truly concurrent active-request users (not just logged-in users), you'll need the job queue for AI requests. Typically, "500 concurrent users" on an educational app means ~50-100 simultaneous API calls at peak, which Vercel handles well.

---

## Implementation Notes

**Implemented:** 2026-03-01

### Summary

- `analyzeImageWithClaude`: max_tokens 1024 → 2048; prompt updated to solve math problems step-by-step; catch block now throws instead of returning fallback string
- `analyzeMultipleImages`: same throw-on-error fix applied for consistency
- `submit/route.ts`: fixed `MediaError` undefined variable bug → `error`
- `DiagramViewer`: complete rewrite — replaced `new Image()` preload with direct `<img>` rendering; added `errorIds` + `retryCount` state; added retry button + mermaid code fallback in `<details>`; changed `overflow-hidden` → `overflow-auto` on container; removed `renderedDiagrams` from useEffect deps (now `[currentIndex, retryCount]` only — prevents re-render loops)
- Library page: gradient violet/indigo sticky hero header; colored top-strip on cards based on content type; level badge + date on each card; added diagrams/slides badges
- Challenges page: full `min-h-screen bg-gray-50` layout; orange/red gradient hero; colored status strips per challenge card; opponent avatar; topic pill; improved score display; better empty state with CTA button; removed unused `CheckCircle` import
- Leaderboard page: full `min-h-screen` layout; yellow/amber gradient hero with tab switcher inside; new `Podium` component for top-3 (gold/silver/bronze columns); current user highlighted with left border + "You" label; divide-y rows instead of space-y cards; applied to both Quiz and XP tabs

### Deviations from Plan

- Applied the same `throw error` fix to `analyzeMultipleImages` (not in plan, but same bug)
- Challenges page: removed `CheckCircle` which was imported but unused (TypeScript flagged it)
- Podium component kept inline in leaderboard file (not extracted to separate file) as specified in plan
- Library: added `hasDiagram` and `hasPresentation` badges beyond the plan's spec (Audio/Quiz/Flashcards only) — this adds more value without extra complexity

### Issues Encountered

- TypeScript flagged unused `CheckCircle` import in challenges page — removed immediately
- All other changes passed `npx tsc --noEmit` with 0 errors on first run
