# Plan: Group-Shared Content Full Access & Challenge Quiz Full View

**Created:** 2026-02-27
**Status:** Implemented
**Request:** Allow group members to view all generated content sections (article, quiz, flashcards, diagrams, etc.) of content shared in their group; allow challenge participants to see all content sections and take the quiz as a challenge.

---

## Overview

### What This Plan Accomplishes

This plan removes the hard ownership gate (`query.userId !== session.user.id → redirect`) from the results page and replaces it with a multi-mode access check: **owner**, **group member**, or **challenge participant**. Group members get read-only access to all existing content sections. Challenge participants get read-only access plus challenge-aware quiz submission. Content generation buttons (flashcards, diagrams, audio, etc.) remain restricted to the content owner.

### Why This Matters

Right now, sharing content to a group is broken — members click the link and are immediately redirected to `/explore`. Challenges also fail because the quiz page redirects non-owners. These are two of the app's core social features, and fixing them makes group study and competitive quizzing actually functional.

---

## Current State

### Relevant Existing Structure

| File | Role |
|------|------|
| `src/app/(dashboard)/results/[id]/page.tsx` | Results page — line 68: `if (!query \|\| query.userId !== session.user.id) redirect('/explore')` |
| `src/components/features/InteractiveResultsView.tsx` | Renders all content cards; all "Generate X" buttons have no ownership guard |
| `src/components/features/PracticeQuizViewer.tsx` | Quiz viewer; has a "New questions" regenerate button that calls `/api/content/quiz/generate` |
| `src/app/api/content/quiz/generate/route.ts` | Line 41: `if (!query \|\| query.userId !== session.user.id)` → 403 |
| `src/app/api/content/flashcards/route.ts` | Line 38: `if (query.userId !== session.user.id)` → 403 |
| `src/app/api/content/diagrams/route.ts` | Line 56: `if (query.userId !== session.user.id)` → 403 |
| `src/app/api/content/presentation/route.ts` | Line 38: `if (query.userId !== session.user.id)` → 403 |
| `src/app/api/challenge/submit-score/route.ts` | Accepts `{ challengeId, score, totalQuestions, timeSpent }` — already correct |
| `src/app/(dashboard)/challenges/[id]/page.tsx` | "Take Quiz Now" link: fixed to `/results/{id}` in last session |
| `prisma/schema.prisma` | `GroupSharedContent.contentId → Content.queryId → Query`; `Challenge.queryId`, `challengerId`, `challengeeId` |

### Gaps or Problems Being Addressed

1. **Group members are redirected on click**: `results/[id]/page.tsx` checks `query.userId !== session.user.id` unconditionally. Group members are not the owner, so they get bounced.
2. **Challenge participants are redirected**: Same issue — the challengee tries to view the quiz topic and gets bounced because it's not their query.
3. **"Generate" buttons would appear for non-owners**: Even if we fix the access check, non-owners can't generate new content (API returns 403). The buttons would show but silently fail. We must hide them.
4. **"New questions" regenerate in PracticeQuizViewer**: Would fail for non-owners. Must be hidden.
5. **Challenge score not submitted to challenge route**: Currently clicking "Take Quiz Now" just plays a regular quiz. We need the quiz completion to also call `/api/challenge/submit-score`.
6. **Comment section**: Currently auto-creates a `sharedContent` record for the viewing user. For non-owners, we should use the owner's sharedContent (so comments are on the same thread) rather than creating a new one.

---

## Proposed Changes

### Summary of Changes

- **Create access utility** — `src/lib/utils/query-access.ts`: checks owner / group member / challenge participant status in one function
- **Modify results page** — replace single-condition redirect with multi-mode access check; add access context banners; pass `isOwner` and `challengeId` to child components; handle sharedContent for non-owners
- **Modify `InteractiveResultsView`** — add `isOwner` prop; when `false`, replace all "Generate X" empty-state buttons with a "content owner only" notice
- **Modify `PracticeQuizViewer`** — add `isOwner` and `challengeId` props; hide regenerate when non-owner; submit challenge score when `challengeId` is set
- **Update challenge page link** — append `?challenge={id}` to the "Take Quiz Now" href

### New Files to Create

| File Path | Purpose |
|-----------|---------|
| `src/lib/utils/query-access.ts` | Determines access type (owner/group/challenge/denied) for any `(userId, queryId)` pair |

### Files to Modify

| File Path | Changes |
|-----------|---------|
| `src/app/(dashboard)/results/[id]/page.tsx` | Replace ownership redirect; add banners; pass isOwner/challengeId; handle shared comments |
| `src/components/features/InteractiveResultsView.tsx` | Add `isOwner` prop; hide generate buttons for non-owners |
| `src/components/features/PracticeQuizViewer.tsx` | Add `isOwner`/`challengeId` props; hide regenerate; submit challenge score |
| `src/app/(dashboard)/challenges/[id]/page.tsx` | Update href to include `?challenge={challenge.id}` |

---

## Design Decisions

### Key Decisions Made

1. **URL param for challenge mode (`?challenge=id`)**: The challenge ID is passed as a search param so it's visible when the challenge participant arrives at `/results/{queryId}?challenge={challengeId}`. The server reads it from `searchParams`, validates that the user is actually a participant, and passes it to the client components. This avoids complex state management or separate routes.

2. **Read-only for non-owners — no content generation**: Group members and challenge participants can VIEW all existing content but cannot trigger new AI generation. This is correct behavior: generation uses plan limits that belong to the content owner. The API routes already enforce this with 403 — we just hide the buttons so the user gets a clear message rather than a silent failure.

3. **Owner's `sharedContent` for comments**: Instead of creating a new `sharedContent` record for each non-owner viewer (which would fragment comments), non-owner views use the query OWNER's `sharedContent` record. This means all group members see the same comment thread under the shared article.

4. **`SaveButton` shown to all authorized users**: Bookmarking is a per-user action, not an ownership-restricted one. Group members should be able to save content to their library.

5. **`ShareButton` and `WhatsAppShareButton` hidden for non-owners**: Only the content owner should be able to share their content further. Non-owners should not be able to re-share someone else's query.

6. **Challenge banner shown for `challengeId` access; group banner for group access**: Distinct visual banners help users understand why they're viewing someone else's content and what mode they're in.

7. **Quiz score always submitted to `/api/quiz/submit-score`**: Even in challenge mode, the regular quiz score submission still happens (for XP and achievements). Additionally, in challenge mode, `POST /api/challenge/submit-score` is called with the `challengeId`.

### Alternatives Considered

- **Separate `/view/{queryId}` route for shared viewing**: Would require duplicating all the results page logic. Using the same `/results/[id]` page with access modes is DRY and consistent.
- **Pass `isOwner` via prop drilling from page → InteractiveResultsView → each Generate button**: Chosen approach — clean and explicit, avoids Context for a simple boolean.

### Open Questions (if any)

None. All decisions are made; implementation can proceed.

---

## Step-by-Step Tasks

### Step 1: Create query-access utility

Create `src/lib/utils/query-access.ts` that exports `getQueryAccess(userId, queryId)`.

**Logic:**
1. Fetch the query with `userId` field
2. If `query.userId === userId` → return `{ type: 'owner' }`
3. Check `GroupSharedContent`: find a record where `content.queryId === queryId` AND the group has the user as a member. If found, return group access info.
4. Check `Challenge`: find a record where `queryId === queryId` AND (`challengerId === userId` OR `challengeeId === userId`) AND status is `PENDING` or `ACCEPTED`. If found, return challenge info.
5. Otherwise → return `{ type: 'denied' }`

**Full file content:**

```typescript
import { prisma } from '@/lib/db/prisma';

export type AccessType = 'owner' | 'group' | 'challenge' | 'denied';

export interface QueryAccessResult {
  type: AccessType;
  // For group access
  sharedByUser?: { name: string | null; image: string | null };
  groupName?: string;
  // For challenge access
  challengeId?: string;
  challengerName?: string | null;
  challengeeName?: string | null;
}

export async function getQueryAccess(
  userId: string,
  queryId: string
): Promise<QueryAccessResult> {
  const query = await prisma.query.findUnique({
    where: { id: queryId },
    select: { userId: true },
  });

  if (!query) return { type: 'denied' };
  if (query.userId === userId) return { type: 'owner' };

  // Check group membership: is this query's content shared in a group the user belongs to?
  const groupAccess = await prisma.groupSharedContent.findFirst({
    where: {
      content: { queryId },
      group: { members: { some: { userId } } },
    },
    include: {
      user: { select: { name: true, image: true } },
      group: { select: { name: true } },
    },
  });

  if (groupAccess) {
    return {
      type: 'group',
      sharedByUser: { name: groupAccess.user.name, image: groupAccess.user.image },
      groupName: groupAccess.group.name,
    };
  }

  // Check challenge access: is this user a challenger or challengee for a challenge on this query?
  const challengeAccess = await prisma.challenge.findFirst({
    where: {
      queryId,
      OR: [{ challengerId: userId }, { challengeeId: userId }],
      status: { in: ['PENDING', 'ACCEPTED'] },
    },
    include: {
      challenger: { select: { name: true } },
      challengee: { select: { name: true } },
    },
  });

  if (challengeAccess) {
    return {
      type: 'challenge',
      challengeId: challengeAccess.id,
      challengerName: challengeAccess.challenger.name,
      challengeeName: challengeAccess.challengee.name,
    };
  }

  return { type: 'denied' };
}
```

**Files affected:**
- `src/lib/utils/query-access.ts` (new)

---

### Step 2: Modify results page to support multi-mode access

Read the full current file at `src/app/(dashboard)/results/[id]/page.tsx`, then apply changes.

**Changes:**

1. Add `searchParams` to the page props type:
   ```typescript
   export default async function ResultsPage({
     params,
     searchParams,
   }: {
     params: Promise<{ id: string }>;
     searchParams: Promise<{ challenge?: string }>;
   })
   ```

2. Read `challengeParam` from searchParams:
   ```typescript
   const { id } = await params;
   const { challenge: challengeParam } = await searchParams;
   ```

3. Import the access utility:
   ```typescript
   import { getQueryAccess } from '@/lib/utils/query-access';
   ```

4. Replace the ownership redirect (lines 68-71) with:
   ```typescript
   if (!query) redirect('/explore');

   const accessResult = await getQueryAccess(session.user.id, id);

   if (accessResult.type === 'denied') {
     redirect('/explore');
   }

   const isOwner = accessResult.type === 'owner';

   // For challenge mode, prefer URL param if validated, else use DB result
   const challengeId =
     accessResult.type === 'challenge' ? accessResult.challengeId
     : challengeParam ?? undefined;
   ```

5. Fix sharedContent handling for non-owners:
   ```typescript
   // For the owner: create sharedContent as before
   // For non-owners: find the owner's sharedContent (shared comment thread)
   let sharedContent = await prisma.sharedContent.findFirst({
     where: {
       queryId: id,
       userId: isOwner ? session.user.id : query.userId,
     },
   });

   if (isOwner && !sharedContent) {
     sharedContent = await prisma.sharedContent.create({
       data: {
         queryId: id,
         userId: session.user.id,
         shareType: 'public',
         shareToken: nanoid(10),
       },
     });
   }
   ```

6. Update header section to conditionally show ShareButton/WhatsApp (owner only) and access banners:

   **Remove duplicate `if (!query) redirect('/explore')` at line 71.**

   **Header section changes:**
   - Keep `<SaveButton>` for all users (bookmarking is universal)
   - Only show `<ShareButton>` and `<WhatsAppShareButton>` when `isOwner`

   ```tsx
   {/* Access context banners */}
   {accessResult.type === 'group' && (
     <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
       <Users className="h-4 w-4 flex-shrink-0" />
       <span>
         Shared by <strong>{accessResult.sharedByUser?.name ?? 'a group member'}</strong>{' '}
         in <strong>{accessResult.groupName}</strong>
       </span>
     </div>
   )}
   {accessResult.type === 'challenge' && (
     <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-700">
       <Swords className="h-4 w-4 flex-shrink-0" />
       <span>
         ⚔️ Challenge: <strong>{accessResult.challengerName}</strong> vs{' '}
         <strong>{accessResult.challengeeName}</strong> — take the quiz to compete!
       </span>
     </div>
   )}
   ```

7. Add `Users` and `Swords` to the imports from lucide-react.

8. Pass `isOwner` and `challengeId` to `InteractiveResultsView`:
   ```tsx
   <InteractiveResultsView
     ...existing props...
     isOwner={isOwner}
     challengeId={challengeId}
   />
   ```

**Files affected:**
- `src/app/(dashboard)/results/[id]/page.tsx`

---

### Step 3: Update InteractiveResultsView to hide generate buttons for non-owners

Add `isOwner?: boolean` (default `true`) and `challengeId?: string` (default `undefined`) to the `InteractiveResultsViewProps` interface and function signature.

For each of the 6 "empty state with Generate button" sections, change the pattern:

**Current pattern (example — Presentation):**
```tsx
<div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
  <Presentation className="h-16 w-16 mx-auto mb-4 text-gray-400" />
  <p className="text-gray-600 mb-6">Generate presentation slides</p>
  <GeneratePresentationButton queryId={queryId} />
</div>
```

**New pattern:**
```tsx
<div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
  <Presentation className="h-16 w-16 mx-auto mb-4 text-gray-400" />
  <p className="text-gray-600 mb-6">Generate presentation slides</p>
  {isOwner !== false ? (
    <GeneratePresentationButton queryId={queryId} />
  ) : (
    <p className="text-xs text-gray-400 italic">Only the content owner can generate materials</p>
  )}
</div>
```

Apply this pattern to all 6 sections:
1. **Presentation** (line ~304): wrap `<GeneratePresentationButton>`
2. **Visual Diagrams** (line ~355): wrap `<GenerateDiagramsButton>`
3. **Concept Map** (line ~410): wrap `<GenerateConceptMapButton>`
4. **Audio Playback** (line ~475): wrap `<GenerateAudioButton>`
5. **Practice Quiz** (line ~526): wrap `<GenerateQuizButton>`
6. **Flashcards** (line ~577): wrap `<GenerateFlashcardsButton>`

Pass `isOwner` and `challengeId` to `<PracticeQuizViewer>`:
```tsx
<PracticeQuizViewer
  quiz={quiz}
  queryId={query.id}
  totalSets={quizSets.length}
  isOwner={isOwner !== false}
  challengeId={challengeId}
/>
```

**Files affected:**
- `src/components/features/InteractiveResultsView.tsx`

---

### Step 4: Update PracticeQuizViewer to support challenge mode and hide regenerate for non-owners

**Props to add:**
```typescript
interface PracticeQuizViewerProps {
  quiz: PracticeQuiz;
  queryId: string;
  totalSets?: number;
  isOwner?: boolean;   // default true — when false, hides regenerate button
  challengeId?: string; // when set, submits challenge score on completion
}
```

**Changes:**

1. **Hide "New questions" regenerate button in the quiz header** when `isOwner === false`:
   ```tsx
   {(isOwner !== false) && (
     <button onClick={handleRegenerate} disabled={regenerating} ...>
       {regenerating ? <Loader2 .../> : <RefreshCw .../>}
       New questions
     </button>
   )}
   ```

2. **In `handleQuizComplete`**, add challenge score submission when `challengeId` is set:
   ```typescript
   const handleQuizComplete = async () => {
     setQuizComplete(true);
     const correct = quiz.questions.filter(...).length;
     const timeSpent = Math.floor((Date.now() - startTime) / 1000);

     // Always submit to regular quiz leaderboard (XP, achievements)
     try {
       await fetch('/api/quiz/submit-score', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ queryId, score: correct, totalQuestions: quiz.totalQuestions, timeSpent }),
       });
     } catch { /* silent */ }

     // Also submit to challenge if in challenge mode
     if (challengeId) {
       try {
         await fetch('/api/challenge/submit-score', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ challengeId, score: correct, totalQuestions: quiz.totalQuestions, timeSpent }),
         });
       } catch { /* silent */ }
     }
   };
   ```

3. **In the quiz header**, add a "Challenge Mode" badge when `challengeId` is set:
   ```tsx
   {challengeId && (
     <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold flex items-center gap-1">
       ⚔️ Challenge
     </span>
   )}
   ```

4. **On the complete screen**, when `challengeId` is set, show a redirect link to the challenge page instead of the "Retry This Set" button as the primary CTA:
   ```tsx
   {challengeId ? (
     <Link
       href={`/challenges/${challengeId}`}
       className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                  border-2 border-purple-300 text-purple-700 font-semibold text-sm
                  hover:bg-purple-50 transition-colors"
     >
       View Challenge Results →
     </Link>
   ) : (
     <button onClick={() => { setCurrentIndex(0); setAnswers({}); ... }} ...>
       <RotateCcw className="h-4 w-4" /> Retry This Set
     </button>
   )}
   ```

   Import `Link` from `next/link` (add to imports).

**Files affected:**
- `src/components/features/PracticeQuizViewer.tsx`

---

### Step 5: Update challenge page "Take Quiz Now" link to include challenge ID

In `src/app/(dashboard)/challenges/[id]/page.tsx`, the "Take Quiz Now" link was already fixed to `/results/{id}` in the previous session. Now append the challenge ID as a search param.

**Change line 134:**
```tsx
href={`/results/${challenge.query.id}?challenge=${challenge.id}`}
```

**Files affected:**
- `src/app/(dashboard)/challenges/[id]/page.tsx`

---

### Step 6: Run type check to validate all changes

After all code changes, run `npx tsc --noEmit`.

**Actions:**
- Fix any TypeScript errors found
- Ensure all prop types align (especially the new optional props)

**Files affected:**
- Any file with errors

---

## Connections & Dependencies

### Files That Reference This Area

- `src/app/(dashboard)/groups/[id]/page.tsx` — already fixed last session to link to `/results/{id}`; links will now work
- `src/app/(dashboard)/challenges/[id]/page.tsx` — "Take Quiz Now" link updated in Step 5
- `src/app/api/content/quiz/generate/route.ts` — still blocks non-owners from regenerating (correct, unchanged)
- `src/app/api/content/flashcards/route.ts` — still blocks non-owners from generating (correct, unchanged)
- `src/app/api/quiz/submit-score/route.ts` — does NOT check ownership, works for all authenticated users
- `src/app/api/challenge/submit-score/route.ts` — validates participation, works correctly

### Updates Needed for Consistency

- None beyond what is listed above; no CLAUDE.md updates needed (no new files to document there).

### Impact on Existing Workflows

- **Owner viewing their own content**: No change — `isOwner = true`, all buttons visible, behavior unchanged.
- **Group member viewing shared content**: They now see the full page instead of being redirected. Generate buttons show a "owner only" message. Quiz works, saves work.
- **Challenge participant**: They now see full content. Quiz auto-submits challenge score. After completion, they see a link back to challenge details.

---

## Validation Checklist

- [ ] Owner visiting their own `/results/{id}` — all content sections visible, all generate buttons visible, Share/WhatsApp visible
- [ ] Owner: quiz regenerate button visible in quiz header
- [ ] Group member visiting `/results/{id}` for content shared in their group — no redirect, all existing content visible
- [ ] Group member: "Shared by [Name] in [Group]" banner shows in page header
- [ ] Group member: "Generate X" empty-state buttons show "Only the content owner can generate materials" instead
- [ ] Group member: quiz generate button shows "owner only" notice (when quiz not yet generated)
- [ ] Group member: existing quiz IS visible and takable (when already generated)
- [ ] Group member: "New questions" regenerate button is hidden in quiz header
- [ ] Group member: SaveButton works (saves to their library)
- [ ] Group member: Share/WhatsApp buttons NOT shown
- [ ] Challenge participant visiting `/results/{queryId}?challenge={id}` — no redirect, all existing content visible
- [ ] Challenge participant: "⚔️ Challenge" banner shows with challenger vs challengee names
- [ ] Challenge participant: "⚔️ Challenge" badge shows in quiz card header
- [ ] Challenge participant: completing quiz submits to both `/api/quiz/submit-score` AND `/api/challenge/submit-score`
- [ ] Challenge participant: complete screen shows "View Challenge Results →" link to `/challenges/{id}`
- [ ] `challenges/[id]/page.tsx` "Take Quiz Now" link includes `?challenge={id}` param
- [ ] Comments section: group member/challenge participant sees owner's comment thread (not a blank new one)
- [ ] `npx tsc --noEmit` passes with 0 errors

---

## Success Criteria

The implementation is complete when:

1. A group member can click a shared content link, see the full article + all generated sections (quiz, flashcards, diagrams if already generated), and take the quiz — without being redirected
2. A challenge participant can click "Take Quiz Now" from the challenge page, see the full content, take the quiz, and have their score recorded in the challenge
3. All 18 validation checklist items pass
4. TypeScript type check passes with 0 errors

---

## Notes

- **Quiz-not-yet-generated case for group members/challenge participants**: If the query owner hasn't generated a quiz yet, the group member will see the quiz empty-state card with the "owner only" message. This is correct — they can't generate a quiz on someone else's content. The challenge "Take Quiz Now" flow works best when the challenger has already generated a quiz. If not, the challengee sees the notice. Consider advising users to generate content before sending challenges.
- **Multiple groups**: If a query's content is shared in multiple groups the user belongs to, `getQueryAccess` returns info from the FIRST match (using `findFirst`). This is fine — only the group name in the banner changes; the access level is the same.
- **Completed challenges**: The `getQueryAccess` function only grants challenge access for status `PENDING` or `ACCEPTED`. For `COMPLETED` challenges, users are denied access (they can view results on the challenge details page instead). This prevents re-taking completed challenges.

---

## Implementation Notes

**Implemented:** 2026-02-27

### Summary

- Created `src/lib/utils/query-access.ts` with `getQueryAccess()` that checks owner/group/challenge/denied access via Prisma queries
- Rewrote `results/[id]/page.tsx`: moved access check before content fetch, added `searchParams` for `?challenge=` param, added group/challenge context banners, hid Share/WhatsApp for non-owners, passed `isOwner` and `challengeId` to `InteractiveResultsView`, non-owners use owner's `sharedContent` for comments
- Updated `InteractiveResultsView.tsx`: added `isOwner` and `challengeId` props; all 6 "Generate X" empty-state buttons conditionally show "Only the content owner can generate materials" for non-owners; passed new props to `PracticeQuizViewer`
- Updated `PracticeQuizViewer.tsx`: added `isOwner` and `challengeId` props; "New questions" button hidden when `!isOwner`; quiz complete screen hides regenerate CTA for non-owners; challenge mode submits to both `/api/quiz/submit-score` AND `/api/challenge/submit-score`; shows "⚔️ Challenge" badge in header and "View Challenge Results" link on completion
- Updated `challenges/[id]/page.tsx`: "Take Quiz Now" href includes `?challenge={id}` param
- `npx tsc --noEmit` passes with 0 errors

### Deviations from Plan

None. All steps executed as specified.

### Issues Encountered

None.
