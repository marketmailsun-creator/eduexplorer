# Plan: Challenge Completion Flow, Concept Map Mindmap, PPT Visuals, Share Button Styling

**Created:** 2026-02-28
**Status:** Implemented
**Request:** Fix challenge completion/results display, improve concept maps with mindmap syntax, improve PPT slide visuals, unify Share/WhatsApp/Save button styling.

---

## Overview

### What This Plan Accomplishes

Four independent improvements: (1) properly close challenges after completion and surface both players' scores; (2) replace the `graph TD` concept-map diagrams with Mermaid `mindmap` syntax for richer educational context; (3) add visual slide types to the presentation generator/viewer (icons, stat callouts, key-concept highlights); (4) unify the three action buttons (Share, WhatsApp, Save) to a consistent `rounded-lg px-3 py-1.5` style with individual brand colours.

### Why This Matters

Students using the challenge feature need clear feedback when a duel is complete. Concept maps are more pedagogically useful as radial mind maps than as directed-graph flowcharts. Plain-text slides feel unpolished compared to the rest of the app. Inconsistent button styles reduce perceived quality.

---

## Current State

### Relevant Existing Structure

```
src/
  app/(dashboard)/challenges/
    page.tsx                    — lists active (PENDING/ACCEPTED) and past (COMPLETED/DECLINED/EXPIRED)
    [id]/page.tsx               — challenge detail; shows "Take Quiz Now" regardless of whether current user already scored
  app/api/challenge/
    submit-score/route.ts       — saves score, marks COMPLETED when both scored, awards XP
  lib/services/
    diagram-generator.ts        — generates 3 Mermaid diagrams via Gemini; concept-map uses `graph TD`
    presentation-generator.ts   — generates 6-10 slides via Gemini; slide types: title/definition/bullet-points/equation/comparison/summary
  components/features/
    PracticeQuizViewer.tsx      — quiz + completion screen; links to /challenges/[id] as "View Challenge Results"
    PresentationViewer.tsx      — renders slides with gradient backgrounds; no visual icons or stat callout types
    DiagramViewer.tsx           — renders mermaid.ink SVG; already supports mindmap syntax via URL
    WhatsAppShareButton.tsx     — custom `<button>` with `rounded-lg bg-[#25D366] px-3 py-1.5`
    SaveButton.tsx              — custom `<button>` with `rounded-full border-2 indigo-600 px-4 py-2`
  components/social/
    ShareButton.tsx             — shadcn `<Button variant="outline" size="sm">` (rounded-md, 1px border)
```

### Gaps or Problems Being Addressed

1. **Challenge**: After one user submits quiz score, the challenge stays ACCEPTED → "Take Quiz Now" still shown to the user who just played; no "Waiting for opponent" state; if only one player has scored the detail page shows partial data but no guidance.
2. **Concept map**: `graph TD` flowcharts are not pedagogically ideal for concept mapping; Mermaid `mindmap` syntax creates radial maps that are far more intuitive for students.
3. **PPT**: Slide types are all text/list-based; no visual callouts (stat numbers, icon-lists, key-concept highlights), making slides feel like plain text.
4. **Buttons**: ShareButton uses shadcn outline style (`rounded-md`, `px-3 py-1.5` from shadcn size-sm), WhatsAppShareButton uses raw `<button>` with `rounded-lg`, SaveButton uses `rounded-full border-2` — three distinct shapes and border weights.

---

## Proposed Changes

### Summary of Changes

- **Challenge detail page** — hide "Take Quiz Now" when current user's score already submitted; show "Waiting for opponent" or "Results ready" states instead.
- **PracticeQuizViewer** — on challenge quiz completion, detect `bothScored` API response and show appropriate completion message ("Both done — see results!" vs "Waiting for opponent").
- **Diagram generator** — change `concept-map` type to use Mermaid `mindmap` syntax with multi-level indentation; update fallback template.
- **Presentation generator** — add three new slide types to the prompt: `stat-highlight`, `key-concept`, `icon-list`; update JSON schema comment in prompt.
- **PresentationViewer** — add renderers for the three new slide types.
- **ShareButton** — switch trigger button to a raw `<button>` matching the unified style.
- **WhatsAppShareButton** — already close; minor tweak (consistent gap/text size).
- **SaveButton** — change `rounded-full border-2 px-4 py-2` → `rounded-lg border px-3 py-1.5` to match others.

### New Files to Create

None.

### Files to Modify

| File Path | Changes |
|---|---|
| `src/app/(dashboard)/challenges/[id]/page.tsx` | Hide "Take Quiz Now" when `myScore !== null`; show waiting/results-ready state |
| `src/components/features/PracticeQuizViewer.tsx` | Use `bothScored` flag from submit-score API response to show appropriate completion message |
| `src/lib/services/diagram-generator.ts` | Change concept-map generation to use `mindmap` Mermaid syntax; update prompt + fallback |
| `src/lib/services/presentation-generator.ts` | Add `stat-highlight`, `key-concept`, `icon-list` slide types to prompt |
| `src/components/features/PresentationViewer.tsx` | Add renderers for 3 new slide types |
| `src/components/social/ShareButton.tsx` | Change trigger `<Button variant="outline" size="sm">` → raw `<button>` with unified style |
| `src/components/features/SaveButton.tsx` | Change shape: `rounded-full border-2 px-4 py-2` → `rounded-lg border px-3 py-1.5` |
| `src/components/features/WhatsAppShareButton.tsx` | Minor: ensure `gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium` (already close) |

---

## Design Decisions

### Key Decisions Made

1. **Challenge: check `myScore !== null` on detail page** — simplest server-side fix; no new API needed. The challenge object already includes `challengerScore`/`challengeeScore`.
2. **Challenge: `bothScored` in completion screen** — `submit-score` API already returns `{ bothScored: boolean, status }`. PracticeQuizViewer already calls this API; just read the response flag and show different messages.
3. **Mindmap over graph for concept-map** — Mermaid `mindmap` creates a radial hierarchy which is the correct mental model for concept maps. `mermaid.ink/svg/?theme=default` already renders mindmap blocks — no viewer change needed.
4. **New PPT slide types (stat-highlight, key-concept, icon-list)** — Additive change; existing slide types remain. Generator prompt updated to use them when appropriate (statistics, single key idea, feature lists). Viewer adds new renderers.
5. **Unified button style: `rounded-lg border px-3 py-1.5 text-sm font-medium`** — matches WhatsApp button (already best-styled). ShareButton gets custom `<button>` trigger; SaveButton loses `rounded-full`/`border-2`; all keep their brand colour.

### Alternatives Considered

- **Full redirect after quiz completion in challenge mode** — auto-redirecting after quiz would be jarring if opponent hasn't played yet. Better to show a contextual completion message with a link.
- **Fully custom PPT renderer with images** — out of scope; improvement is in slide variety and layout, not external image embedding.
- **Single shared component for all three buttons** — overkill; they have different click behaviors (modal/link/toggle). Unifying className constants is sufficient.

---

## Step-by-Step Tasks

### Step 1: Fix Challenge Detail Page — Hide "Take Quiz Now" When Already Scored

The "Take Quiz Now" link currently shows whenever `isAccepted || (isPending && isChallenger)`. It should also require that the current user has not yet submitted a score.

**Actions:**

- Read `src/app/(dashboard)/challenges/[id]/page.tsx`
- Change the "Take Quiz Now" block condition from:
  ```tsx
  {(isAccepted || (isPending && isChallenger)) && (
  ```
  to:
  ```tsx
  {(isAccepted || (isPending && isChallenger)) && myScore === null && (
  ```
- Below that block, add a "Waiting for opponent" message when the current user has scored but the challenge isn't completed yet:
  ```tsx
  {isAccepted && myScore !== null && !isCompleted && (
    <div className="px-5 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 text-center">
      ✅ You scored <strong>{myScore} pts</strong> — waiting for {opponent?.name ?? 'your opponent'} to play!
    </div>
  )}
  ```
- Also add a "View Results" link when `isCompleted` (so both have played):
  ```tsx
  {isCompleted && (
    <Link
      href={`/challenges`}
      className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
    >
      Back to Challenges
    </Link>
  )}
  ```

**Files affected:**
- `src/app/(dashboard)/challenges/[id]/page.tsx`

---

### Step 2: Update PracticeQuizViewer — Challenge Completion Message

When a user finishes a challenge quiz, PracticeQuizViewer calls `POST /api/challenge/submit-score` and stores the result in `submitResult`. The completion screen currently always shows "View Challenge Results". We need to differentiate between:
- `bothScored=true` → "Both players have finished — see the results!"
- `bothScored=false` → "Your score is in! Waiting for opponent…"

**Actions:**

- Read `src/components/features/PracticeQuizViewer.tsx`
- Find the state variable that holds the submit-score response. It's currently named `submitResult` (or similar). Ensure `bothScored` is stored:
  ```typescript
  const [challengeComplete, setChallengeComplete] = useState<{ bothScored: boolean } | null>(null);
  ```
  In `handleQuizComplete`, after calling `/api/challenge/submit-score`:
  ```typescript
  const data = await res.json();
  if (challengeId) setChallengeComplete({ bothScored: data.bothScored });
  ```
- In the completion screen JSX, replace the current "View Challenge Results" link with a conditional block:
  ```tsx
  {challengeId && challengeComplete && (
    challengeComplete.bothScored ? (
      <div className="text-center space-y-3">
        <p className="text-green-700 font-semibold text-sm">⚔️ Both players finished! Check who won.</p>
        <Link
          href={`/challenges/${challengeId}`}
          className="inline-block px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
        >
          View Challenge Results
        </Link>
      </div>
    ) : (
      <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 text-center">
        ✅ Score submitted! Waiting for your opponent to play…
        <br />
        <Link href="/challenges" className="text-purple-600 underline mt-1 inline-block">Back to Challenges</Link>
      </div>
    )
  )}
  {challengeId && !challengeComplete && (
    <Link href={`/challenges/${challengeId}`} ...>
      View Challenge Results
    </Link>
  )}
  ```
  (The last block handles the case where submit didn't return yet or errored.)

**Files affected:**
- `src/components/features/PracticeQuizViewer.tsx`

---

### Step 3: Update Diagram Generator — Mindmap Syntax for Concept Maps

Change the `concept-map` diagram type to use Mermaid `mindmap` syntax instead of `graph TD`.

**Actions:**

- Read `src/lib/services/diagram-generator.ts`
- In the AI prompt, add a section specifically for concept-map type:
  ```
  IMPORTANT: When generating a diagram of type "concept-map", use Mermaid MINDMAP syntax (not graph/flowchart):
  mindmap
    root((Main Topic))
      Category A
        Subconcept 1
        Subconcept 2
      Category B
        Subconcept 3
          Detail
      Category C
        Subconcept 4
  Rules for mindmap:
  - Start with "mindmap" keyword
  - Use root((Topic)) for the centre node
  - Indent with 2 spaces per level
  - Max 3 levels of nesting
  - Each branch should represent a key concept or category
  - Subconcepts should be brief (2-5 words)
  - Include 3-5 top-level branches
  ```
- Update the fallback template for `concept-map` type from `graph TD` to `mindmap`:
  ```typescript
  // Fallback concept-map mindmap
  {
    id: 1,
    type: 'concept-map',
    title: `${topic} — Concept Map`,
    description: 'Core concepts and their relationships',
    mermaidCode: `mindmap\n  root((${topic.substring(0, 20)}))\n    Key Concepts\n      Definition\n      Examples\n    Applications\n      Real World\n      Theory\n    Related Topics\n      Prerequisites\n      Extensions`,
  }
  ```

**Files affected:**
- `src/lib/services/diagram-generator.ts`

---

### Step 4: Update Presentation Generator — New Visual Slide Types

Add three new slide types that produce more visually engaging layouts. These are additive; existing types remain.

**New slide type schemas:**

```typescript
// stat-highlight: Shows a large statistic or key number with context
{
  type: 'stat-highlight',
  title: string,          // e.g. "Did You Know?"
  stat: string,           // e.g. "70%"
  statLabel: string,      // e.g. "of water on Earth is frozen"
  context: string,        // 1-2 sentence explanation
  icon: string,           // emoji e.g. "💧"
  background: BackgroundType
}

// key-concept: Single large centered concept with definition
{
  type: 'key-concept',
  title: string,          // e.g. "Osmosis"
  concept: string,        // Bold highlighted term or phrase
  explanation: string,    // 1-2 sentence explanation
  example: string,        // Real-world example
  icon: string,           // emoji e.g. "🔬"
  background: BackgroundType
}

// icon-list: Bullet list but each point has an emoji icon
{
  type: 'icon-list',
  title: string,
  items: Array<{ icon: string, text: string }>,  // e.g. [{icon:"⚡", text:"Faster reaction"}, ...]
  background: BackgroundType
}
```

**Actions:**

- Read `src/lib/services/presentation-generator.ts`
- Add the three new type definitions to the TypeScript interface `PresentationSlide`:
  ```typescript
  // stat-highlight
  stat?: string;
  statLabel?: string;
  context?: string;
  icon?: string;
  // key-concept
  concept?: string;
  explanation?: string;
  example?: string;
  // icon-list
  items?: Array<{ icon: string; text: string }>;
  ```
- Update the `type` union:
  ```typescript
  type: 'title' | 'definition' | 'bullet-points' | 'equation' | 'comparison' | 'summary' | 'stat-highlight' | 'key-concept' | 'icon-list';
  ```
- In the generation prompt, add descriptions of the new types with examples:
  ```
  New slide types you should use where appropriate:

  "stat-highlight": Use when topic has an interesting statistic or key number.
  Example: {"type":"stat-highlight","title":"Did You Know?","stat":"6 billion","statLabel":"base pairs in human DNA","context":"Every human cell contains 6 billion DNA base pairs packed into a nucleus smaller than 0.01mm.","icon":"🧬","background":"gradient-purple"}

  "key-concept": Use for the single most important definition in the topic.
  Example: {"type":"key-concept","title":"Core Concept","concept":"Natural Selection","explanation":"Organisms with traits better suited to their environment survive and reproduce more.","example":"Peppered moths: dark moths survived industrial pollution better than light ones.","icon":"🦋","background":"dark"}

  "icon-list": Use instead of plain bullet-points when items can be mapped to descriptive emojis.
  Example: {"type":"icon-list","title":"Benefits of Exercise","items":[{"icon":"❤️","text":"Strengthens heart muscle"},{"icon":"🧠","text":"Boosts memory & focus"},{"icon":"⚡","text":"Increases energy levels"},{"icon":"😴","text":"Improves sleep quality"}],"background":"gradient-blue"}
  ```
- Encourage the generator to use at least 1 `stat-highlight` or `key-concept` slide and at least 1 `icon-list` slide per presentation.

**Files affected:**
- `src/lib/services/presentation-generator.ts`

---

### Step 5: Update PresentationViewer — Render New Slide Types

Add renderers for `stat-highlight`, `key-concept`, and `icon-list` inside the `renderSlide` (or equivalent) function.

**Actions:**

- Read `src/components/features/PresentationViewer.tsx`
- Find the slide type switch/if-else block that renders each slide type
- Add the following new cases:

**stat-highlight renderer:**
```tsx
case 'stat-highlight': {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6">
      <div className="text-4xl md:text-6xl">{slide.icon ?? '📊'}</div>
      <h2 className={`text-sm md:text-base font-semibold uppercase tracking-widest opacity-75 ${textColor}`}>
        {slide.title}
      </h2>
      <div className={`text-5xl md:text-8xl font-extrabold leading-none ${textColor}`}>
        {slide.stat}
      </div>
      <p className={`text-base md:text-2xl font-semibold ${textColor}`}>
        {slide.statLabel}
      </p>
      {slide.context && (
        <p className={`text-xs md:text-sm max-w-md opacity-80 ${textColor}`}>
          {slide.context}
        </p>
      )}
    </div>
  );
}
```

**key-concept renderer:**
```tsx
case 'key-concept': {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 px-6 text-center">
      <div className="text-4xl">{slide.icon ?? '💡'}</div>
      <h2 className={`text-sm font-semibold uppercase tracking-widest opacity-75 ${textColor}`}>
        {slide.title}
      </h2>
      <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20 max-w-lg">
        <p className={`text-2xl md:text-4xl font-extrabold ${textColor}`}>{slide.concept}</p>
      </div>
      <p className={`text-sm md:text-base max-w-md ${textColor}`}>{slide.explanation}</p>
      {slide.example && (
        <div className="bg-white/10 rounded-xl px-4 py-2 max-w-md">
          <p className={`text-xs md:text-sm italic opacity-80 ${textColor}`}>
            📌 {slide.example}
          </p>
        </div>
      )}
    </div>
  );
}
```

**icon-list renderer:**
```tsx
case 'icon-list': {
  const items = slide.items ?? [];
  return (
    <div className="flex flex-col h-full px-6 py-4 space-y-3">
      <h2 className={`text-base md:text-xl font-bold ${textColor} mb-2`}>{slide.title}</h2>
      <ul className="space-y-2 md:space-y-3 flex-1">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2 md:py-3"
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            <span className="text-xl md:text-2xl flex-shrink-0">{item.icon}</span>
            <span className={`text-xs md:text-sm font-medium ${textColor}`}>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Files affected:**
- `src/components/features/PresentationViewer.tsx`

---

### Step 6: Unify Share/WhatsApp/Save Button Styling

Target unified style:
```
rounded-lg px-3 py-1.5 text-sm font-medium
flex items-center gap-1.5 transition-colors
border (1px, not border-2)
```
Each button keeps its own brand colour. All three should feel like siblings.

**Actions:**

**A. ShareButton.tsx:**
- Read `src/components/social/ShareButton.tsx`
- Change the `<DialogTrigger asChild>` trigger from:
  ```tsx
  <Button variant="outline" size="sm">
    <Share2 className="h-4 w-4 mr-2" />
    Share
  </Button>
  ```
  to a raw button with unified style:
  ```tsx
  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 text-purple-600 bg-white hover:bg-purple-50 text-sm font-medium transition-colors">
    <Share2 className="h-4 w-4" />
    <span>Share</span>
  </button>
  ```

**B. WhatsAppShareButton.tsx:**
- Read `src/components/features/WhatsAppShareButton.tsx`
- Verify the trigger button already uses `rounded-lg px-3 py-1.5`. It should. Confirm `gap-1.5 text-sm font-medium` are present. If any differ, align them:
  ```tsx
  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-medium transition-colors"
  ```
  Remove `font-semibold` if present (use `font-medium` to match others). Remove `shadow-sm` to reduce visual weight difference vs Share/Save.

**C. SaveButton.tsx:**
- Read `src/components/features/SaveButton.tsx`
- Change shape from `rounded-full border-2 px-4 py-2` to `rounded-lg border px-3 py-1.5`:
  - Remove: `rounded-full`, `border-2`, `px-4`, `py-2`
  - Add: `rounded-lg`, `border`, `px-3`, `py-1.5`
- Keep the indigo colour scheme (`indigo-600` saved / `gray-200` unsaved) — it remains distinct from Share (purple) and WhatsApp (green).
- Keep `active:scale-95` and `transition-all` for the press animation.

Final result — three sibling buttons in the results page header:
```
[📤 Share]   [💬 WhatsApp]   [🔖 Save / Saved]
```
All `rounded-lg`, `px-3 py-1.5`, `text-sm font-medium`, 1px border, each with brand colour.

**Files affected:**
- `src/components/social/ShareButton.tsx`
- `src/components/features/WhatsAppShareButton.tsx`
- `src/components/features/SaveButton.tsx`

---

## Connections & Dependencies

### Files That Reference This Area

- `src/app/(dashboard)/results/[id]/page.tsx` — renders all three buttons and passes `challengeId` to `InteractiveResultsView`
- `src/components/features/InteractiveResultsView.tsx` — passes `challengeId` to `PracticeQuizViewer`
- `src/app/(dashboard)/challenges/page.tsx` — lists challenges; already filters correctly (no changes needed)

### Updates Needed for Consistency

- No schema changes needed (challenge status/score fields already exist).
- `DiagramViewer.tsx` does NOT need changes — `mermaid.ink/svg/?theme=default` already renders `mindmap` blocks correctly.

### Impact on Existing Workflows

- Existing diagram content (already generated with `graph TD`) continues to render correctly in DiagramViewer — the change only affects newly generated concept maps.
- Existing presentation slides (already generated with old types) continue to render — the new type renderers are additive.
- The challenge fix is backwards-compatible — challenges already in COMPLETED state will show correct results; in-progress challenges will now properly hide "Take Quiz Now" for the player who already scored.

---

## Validation Checklist

- [ ] Challenge detail page: "Take Quiz Now" button hidden when logged-in user's score is already submitted
- [ ] Challenge detail page: "Waiting for opponent" message visible after current user scores but challenge not COMPLETED
- [ ] PracticeQuizViewer: after challenge quiz, completion screen shows "Both finished — see results" when `bothScored=true`
- [ ] PracticeQuizViewer: after challenge quiz, completion screen shows "Waiting for opponent" when `bothScored=false`
- [ ] Diagram generator: concept-map diagrams use `mindmap` syntax (test by generating a new concept map and checking DiagramViewer)
- [ ] Diagram generator fallback template uses `mindmap` syntax
- [ ] Presentation generator: new slide types (`stat-highlight`, `key-concept`, `icon-list`) defined in TypeScript interface
- [ ] PresentationViewer: `stat-highlight` slide renders large stat number + emoji + context
- [ ] PresentationViewer: `key-concept` slide renders highlighted term in rounded box + explanation
- [ ] PresentationViewer: `icon-list` slide renders emoji-prefixed rows in translucent cards
- [ ] ShareButton trigger: uses raw `<button>` with `rounded-lg border border-purple-300 px-3 py-1.5 text-sm font-medium`
- [ ] WhatsAppShareButton: consistent `rounded-lg px-3 py-1.5 text-sm font-medium` (no font-semibold, no shadow-sm)
- [ ] SaveButton: `rounded-lg border px-3 py-1.5` (no rounded-full, no border-2)
- [ ] All three buttons visually aligned in results page header
- [ ] `npm run type-check` passes with 0 errors

---

## Success Criteria

1. A user who completes a challenge quiz sees either "Waiting for opponent" or "View Challenge Results" (not a stale "Take Quiz Now" on returning to the challenge detail page).
2. Newly generated concept maps render as radial mindmaps in DiagramViewer using Mermaid `mindmap` syntax.
3. Newly generated presentations include at least one `stat-highlight`, `key-concept`, or `icon-list` slide with visible icons/callouts.
4. All three action buttons (Share, WhatsApp, Save) share the same `rounded-lg`, `px-3 py-1.5`, `text-sm font-medium`, 1px border shape with their individual brand colours.

---

---

## Implementation Notes

**Implemented:** 2026-02-28

### Summary

All 6 steps executed in order:
1. Challenge detail page — "Take Quiz Now" now hidden when `myScore !== null`; "Waiting for opponent" message added; "Back to Challenges" link shown when COMPLETED.
2. PracticeQuizViewer — `challengeComplete` state added; submit-score response captured; three distinct completion states rendered (bothScored / waiting / fallback link).
3. Diagram generator — concept-map type now uses Mermaid `mindmap` syntax in both the AI prompt and the fallback template.
4. Presentation generator — three new slide types added to interface and prompt: `stat-highlight`, `key-concept`, `icon-list`.
5. PresentationViewer — renderers added for all three new types.
6. Button styling — all three buttons unified to `rounded-lg border px-3 py-1.5 text-sm font-medium`.

### Deviations from Plan

None. `npm run type-check` passes with 0 errors.

### Issues Encountered

None.

---

## Notes

- **Pre-existing TypeScript warnings**: `challenges/[id]/page.tsx` has unused variables (`me`, `opponent`, `myTime`, `oppTime` declared at lines 36-41) and `InteractiveResultsView.tsx` has unused imports. These are pre-existing. Step 1 will use `opponent` (for the waiting message), which resolves one of those warnings. The others can optionally be cleaned up during implementation.
- **Mermaid mindmap browser rendering**: mermaid.ink supports mindmap natively. If any edge cases arise with indentation, the fallback template provides a safe baseline.
- **Presentation generator caching**: Content is cached per query. Students will need to regenerate presentations to get the new slide types. Existing cached presentations will continue to render fine (no breaking changes to existing types).
