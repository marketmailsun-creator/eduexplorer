# Plan: UI Fixes, Spaced Repetition, Discovery Hub & Profile Heatmap

**Created:** 2026-02-26
**Status:** Implemented
**Request:** Fix avatar 404, Razorpay payment error, add topic discovery hub, spaced repetition flashcards, profile heatmap, inactivity banners, improve footer and groups page UI

---

## Overview

### What This Plan Accomplishes

This plan addresses 8 improvements ranging from critical bug fixes (avatar 404, Razorpay payment broken) to significant new features (spaced repetition flashcards, topic discovery hub, GitHub-style activity heatmap) and UI polish (footer cleanup, groups page redesign, inactivity notification banners). After implementation, users can pay for Pro, see personalized topic recommendations, study smarter with SM-2 spaced repetition, and enjoy a visually cohesive interface throughout.

### Why This Matters

The Razorpay bug directly blocks revenue. The avatar 404 generates server errors on every page with user lists. The topic discovery hub and spaced repetition are core product differentiators that make EduExplorer more engaging than a plain search box. The heatmap and inactivity banners drive daily retention — critical for a learning app where habit formation is the product.

---

## Current State

### Relevant Existing Structure

**Avatar 404:**
- 9 files across the codebase use `|| '/default-avatar.png'` as image fallback
- `public/default-avatar.png` does NOT exist (confirmed via Glob)
- Affected: `src/components/social/Leaderboard.tsx`, `CommentSection.tsx`, `GroupMembers.tsx`, `QuizLeaderboard.tsx`, `src/components/gamification/LeaderboardWidget.tsx`, `src/app/(dashboard)/leaderboard/page.tsx` (×2), `challenges/[id]/page.tsx`
- Existing `AvatarWithInitials` component handles initials gracefully but isn't used in these social/leaderboard components

**Razorpay error:**
- `upgrade/page.tsx:50` — `key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID` evaluates to `undefined` in production
- `CLAUDE.md` lists `RAZORPAY_KEY_ID` (server-side only, no `NEXT_PUBLIC_` prefix)
- `create-order` API returns `{ orderId, amount, currency }` but NOT the key
- Razorpay checkout fails silently when `key` is undefined

**Explore Page:**
- `src/app/(dashboard)/explore/page.tsx` renders `<SplitLayoutExplore>` — a flat search interface
- No curated sections, trending topics, or visual subject categories

**Flashcards:**
- `src/lib/services/flashcard-generator.ts` generates cards via Gemini API
- Content stored as JSON array in `Content.contentType = 'flashcards'`
- No `FlashcardProgress` table exists — no SM-2 state tracked
- Flashcard viewer likely shows cards and allows flip only (no rating UI)

**Profile Page:**
- `src/app/(dashboard)/profile/page.tsx` shows streak, topics, quiz average stats
- No activity heatmap exists
- `prisma.query.findMany({ where: { userId } })` data available for heatmap computation

**Notifications/Cron:**
- `src/app/api/cron/check-streaks/route.ts` sends push notifications for 3+ day inactivity
- No in-app inactivity banner exists
- Push notifications require browser permission — many users won't have granted it

**Footer:**
- `src/components/layout/Footer.tsx`: 3-column grid + compliance section below divider
- Problem: operator info (Usha Sree, Location: India, Email) is duplicated — appears both in the compliance block AND in the Contact column; Privacy/Terms links appear TWICE (column + copyright bar)

**Groups Page:**
- `src/app/(dashboard)/groups/page.tsx` — plain `container mx-auto` with text heading, card list
- `src/app/(dashboard)/groups/create/page.tsx` — modal overlay with `fixed inset-0 bg-black/50` — this is what creates the "different background" (black overlay on top of dashboard)
- `src/app/(dashboard)/groups/GroupsList.tsx` — renders group cards (needs to be checked for styling)

### Gaps or Problems Being Addressed

1. `GET /default-avatar.png` → 404 on every page with user avatars
2. Razorpay key undefined → payment checkout never opens
3. Explore page is just a bare search box — no discovery, no recommendations
4. Flashcards have no review scheduling — inefficient memorization
5. No activity history visualization on profile page
6. Inactivity only triggers push notifications (many users haven't opted in)
7. Footer has duplicate links and compliance text making it look cluttered
8. Groups list is visually plain; create group modal uses a different visual context

---

## Proposed Changes

### Summary of Changes

- Create `public/default-avatar.svg` as a funky colorful avatar; update all 9 fallback references
- Fix Razorpay: return `key` from `create-order` API; use it in upgrade page
- Add `TopicDiscoveryHub` component to explore page with categories and trending topics
- Add `FlashcardProgress` Prisma model; implement SM-2 algorithm; add review UI (Easy/Good/Hard/Again)
- Add activity heatmap to profile page using aggregated query data
- Add in-app `InactivityBanner` component that shows on dashboard load
- Streamline footer to single clean layout, remove duplicate links
- Redesign groups page with colored group cards; convert create-group modal to proper page

### New Files to Create

| File Path | Purpose |
|-----------|---------|
| `public/default-avatar.svg` | Fun colorful default avatar SVG for all fallback cases |
| `src/lib/services/sm2.ts` | Pure SM-2 spaced repetition algorithm |
| `src/app/api/flashcard/review/route.ts` | POST endpoint to record a flashcard review rating |
| `src/app/api/flashcard/due/route.ts` | GET endpoint to fetch due cards for a content set |
| `src/components/features/TopicDiscoveryHub.tsx` | Curated homepage with categories + trending topics |
| `src/components/features/InactivityBanner.tsx` | Client component — flashy full-width inactivity banner |
| `src/app/api/user/activity-heatmap/route.ts` | GET endpoint returning 365-day activity counts by date |
| `src/components/profile/ActivityHeatmap.tsx` | GitHub-style contribution heatmap component |
| `prisma/migrations/add-flashcard-progress/` | Migration for FlashcardProgress table |

### Files to Modify

| File Path | Changes |
|-----------|---------|
| `prisma/schema.prisma` | Add `FlashcardProgress` model; add relation on User and Content |
| `src/components/social/Leaderboard.tsx` | Replace `/default-avatar.png` with `/default-avatar.svg` |
| `src/components/social/CommentSection.tsx` | Replace 2× `/default-avatar.png` with `/default-avatar.svg` |
| `src/components/social/GroupMembers.tsx` | Replace `/default-avatar.png` with `/default-avatar.svg` |
| `src/components/social/QuizLeaderboard.tsx` | Replace `/default-avatar.png` with `/default-avatar.svg` |
| `src/components/gamification/LeaderboardWidget.tsx` | Replace `/default-avatar.png` with `/default-avatar.svg` |
| `src/app/(dashboard)/leaderboard/page.tsx` | Replace 2× `/default-avatar.png` with `/default-avatar.svg` |
| `src/app/(dashboard)/challenges/[id]/page.tsx` | Replace `/default-avatar.png` with `/default-avatar.svg` |
| `src/app/api/razorpay/create-order/route.ts` | Return `key: process.env.RAZORPAY_KEY_ID` in response |
| `src/app/(dashboard)/upgrade/page.tsx` | Use `key` from API response instead of `NEXT_PUBLIC_` env var |
| `src/app/(dashboard)/explore/page.tsx` | Add `TopicDiscoveryHub` above `SplitLayoutExplore` |
| `src/app/(dashboard)/profile/page.tsx` | Add `ActivityHeatmap` section; `InactivityBanner` on dashboard layout |
| `src/app/(dashboard)/layout.tsx` | Add `InactivityBanner` |
| `src/components/layout/Footer.tsx` | Streamline — remove duplicate links, consolidate compliance |
| `src/app/(dashboard)/groups/page.tsx` | Redesign with gradient header + colored group cards |
| `src/app/(dashboard)/groups/create/page.tsx` | Convert from modal to proper page with matching bg |
| `src/app/(dashboard)/groups/GroupsList.tsx` | Redesign group cards with colors and richer info display |

### Files to Delete

None.

---

## Design Decisions

### Key Decisions Made

1. **SVG default avatar over DiceBear API**: DiceBear requires an internet request per avatar. A single static SVG in `public/` is zero-latency, works offline, and fixes the 404 instantly. Design: colorful concentric circles with a silhouette — simple but distinctive.

2. **Return Razorpay key from API (not `NEXT_PUBLIC_`)**: Adding `NEXT_PUBLIC_RAZORPAY_KEY_ID` would require a redeployment just to add the env var. Returning it from the API endpoint is standard practice for Razorpay (the key_id is a public key by design), eliminates env var management, and works without any infrastructure changes.

3. **SM-2 algorithm for spaced repetition**: SM-2 (SuperMemo 2) is the gold standard, simple to implement, and what Anki uses. Cards are rated 0-5 (mapped to UI buttons Again/Hard/Good/Easy → 1/2/4/5). Ease factor starts at 2.5, minimum 1.3. After each review, interval is recalculated.

4. **`FlashcardProgress` stored per user+content+cardIndex**: Each card in a flashcard set gets its own row. `contentId` links to the `Content` table where flashcard JSON is stored. `cardIndex` is the position in the JSON array.

5. **Topic Discovery Hub above search (not replacing it)**: The search bar is the core action. The discovery hub provides inspiration/entry points. Stack it above the existing `SplitLayoutExplore` so the search remains prominent.

6. **Heatmap data from `Query` table**: Existing `Query.createdAt` timestamps give daily activity. Aggregate server-side via `GROUP BY DATE`. New `/api/user/activity-heatmap` returns `{ date: string, count: number }[]` for the last 365 days.

7. **Inactivity banner via dashboard layout check**: Rather than only cron-based push notifications (requires permission), check last active date server-side in the dashboard layout and pass a flag to an `InactivityBanner` client component. Show at 3, 7, and 14-day thresholds with escalating urgency and visual style.

8. **Footer: 2 columns + single compact legal row**: Remove duplicated Privacy/Terms from copyright bar (keep only in Legal column). Merge "Contact" column into the About column as a single line. Replace the compliance block with a single compact `<p>` line in the copyright row. Result: clean 2-column grid above a single copyright line.

9. **Create Group as proper page, not modal**: The current `fixed inset-0 bg-black/50` overlay is why it looks different — it overlays the groups page with a dark backdrop. Convert it to a standard page with the same `bg-gray-50` background and consistent page layout, using the existing form structure.

10. **Groups page colored cards**: Each group card gets a color class based on the group name hash (same pattern as `AvatarWithInitials`). Show member avatars row, group description truncated, role badge.

### Alternatives Considered

- **DiceBear for avatars**: Requires online API call, adds latency, could fail. Rejected for initial fix — can be added later as enhancement.
- **`NEXT_PUBLIC_RAZORPAY_KEY_ID` env var**: Valid but requires redeployment. Returning from API is simpler and already secure (Razorpay key_id is public).
- **Full Leitner box system for flashcards**: Simpler than SM-2 but less effective. SM-2 is well-tested and still simple enough to implement cleanly.
- **Recharts/Chart.js for heatmap**: Heavy library for a simple grid. Pure CSS/Tailwind grid is sufficient and much lighter.

### Open Questions

None — all approaches are clear from research.

---

## Step-by-Step Tasks

### Step 1: Create `public/default-avatar.svg` — Funky Default Avatar

Create a colorful SVG avatar for all fallback cases. Design: gradient circle background with a simple person silhouette.

**Actions:**

- Create `public/default-avatar.svg` with this content:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6"/>
      <stop offset="100%" style="stop-color:#EC4899"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="50" fill="url(#bg)"/>
  <circle cx="50" cy="35" r="18" fill="rgba(255,255,255,0.9)"/>
  <ellipse cx="50" cy="85" rx="28" ry="22" fill="rgba(255,255,255,0.9)"/>
</svg>
```

**Files affected:**
- `public/default-avatar.svg` (new)

---

### Step 2: Update All 9 Avatar Fallback References

Change every `'/default-avatar.png'` to `'/default-avatar.svg'` across 7 files.

**Actions:**

- In `src/components/social/Leaderboard.tsx`: replace `'/default-avatar.png'` → `'/default-avatar.svg'`
- In `src/components/social/CommentSection.tsx`: replace both instances of `'/default-avatar.png'` → `'/default-avatar.svg'`
- In `src/components/social/GroupMembers.tsx`: replace `'/default-avatar.png'` → `'/default-avatar.svg'`
- In `src/components/social/QuizLeaderboard.tsx`: replace `'/default-avatar.png'` → `'/default-avatar.svg'`
- In `src/components/gamification/LeaderboardWidget.tsx`: replace `'/default-avatar.png'` → `'/default-avatar.svg'`
- In `src/app/(dashboard)/leaderboard/page.tsx`: replace both instances of `'/default-avatar.png'` → `'/default-avatar.svg'`
- In `src/app/(dashboard)/challenges/[id]/page.tsx`: replace `'/default-avatar.png'` → `'/default-avatar.svg'`

Use `replace_all: true` in Edit tool for each file.

**Files affected:**
- All 7 files listed above

---

### Step 3: Fix Razorpay Payment — Return Key from API

**Actions:**

- In `src/app/api/razorpay/create-order/route.ts`, update the response to include the Razorpay key:

Change:
```typescript
return NextResponse.json({ orderId: order.id, amount, currency });
```
To:
```typescript
return NextResponse.json({
  orderId: order.id,
  amount,
  currency,
  key: process.env.RAZORPAY_KEY_ID,
});
```

- In `src/app/(dashboard)/upgrade/page.tsx`, update `handleUpgrade` to use the key from API response:

Change:
```typescript
const { orderId, amount, currency } = await response.json();

const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
```
To:
```typescript
const { orderId, amount, currency, key } = await response.json();

if (!key) {
  throw new Error('Payment configuration error. Please contact support.');
}

const options = {
  key,
```

**Files affected:**
- `src/app/api/razorpay/create-order/route.ts`
- `src/app/(dashboard)/upgrade/page.tsx`

---

### Step 4: Add `FlashcardProgress` to Prisma Schema

**Actions:**

- In `prisma/schema.prisma`, add to the User model relations:
  ```prisma
  flashcardProgress FlashcardProgress[]
  ```

- Add to the Content model relations:
  ```prisma
  flashcardProgress FlashcardProgress[]
  ```

- Add new model after the existing gamification models:
  ```prisma
  model FlashcardProgress {
    id           String    @id @default(cuid())
    userId       String
    contentId    String
    cardIndex    Int
    easeFactor   Float     @default(2.5)
    interval     Int       @default(0)
    repetitions  Int       @default(0)
    dueDate      DateTime  @default(now())
    lastReviewed DateTime?
    createdAt    DateTime  @default(now())
    updatedAt    DateTime  @updatedAt

    user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    content      Content   @relation(fields: [contentId], references: [id], onDelete: Cascade)

    @@unique([userId, contentId, cardIndex])
    @@index([userId, dueDate])
    @@map("flashcard_progress")
  }
  ```

- Run: `npx prisma db push` (dev environment — consistent with project pattern)
- Run: `npx prisma generate`

**Files affected:**
- `prisma/schema.prisma`

---

### Step 5: Create SM-2 Algorithm Service

Create a pure TypeScript implementation of the SuperMemo 2 algorithm.

**Actions:**

- Create `src/lib/services/sm2.ts`:

```typescript
/**
 * SuperMemo 2 (SM-2) spaced repetition algorithm.
 * Quality ratings: 1=Again, 2=Hard, 4=Good, 5=Easy
 * Returns updated card state and next due date.
 */

export interface SM2Card {
  easeFactor: number;   // starts at 2.5, min 1.3
  interval: number;     // days until next review; 0=new
  repetitions: number;  // number of successful reviews
}

export type SM2Quality = 1 | 2 | 4 | 5; // Again | Hard | Good | Easy

export interface SM2Result extends SM2Card {
  dueDate: Date;
}

export function calculateSM2(card: SM2Card, quality: SM2Quality): SM2Result {
  let { easeFactor, interval, repetitions } = card;

  if (quality < 3) {
    // Failed — reset repetitions, short interval
    repetitions = 0;
    interval = quality === 1 ? 0 : 1; // Again: review same session; Hard: next day
  } else {
    // Passed
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  return { easeFactor, interval, repetitions, dueDate };
}

export const SM2_LABELS: Record<SM2Quality, { label: string; color: string; description: string }> = {
  1: { label: 'Again',  color: 'bg-red-500 hover:bg-red-600',    description: 'Forgot completely' },
  2: { label: 'Hard',   color: 'bg-orange-500 hover:bg-orange-600', description: 'Remembered with difficulty' },
  4: { label: 'Good',   color: 'bg-blue-500 hover:bg-blue-600',   description: 'Remembered correctly' },
  5: { label: 'Easy',   color: 'bg-green-500 hover:bg-green-600', description: 'Remembered easily' },
};
```

**Files affected:**
- `src/lib/services/sm2.ts` (new)

---

### Step 6: Create Flashcard Review API Routes

**Actions:**

- Create `src/app/api/flashcard/review/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { calculateSM2 } from '@/lib/services/sm2';
import type { SM2Quality } from '@/lib/services/sm2';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId, cardIndex, quality } = await req.json();

    if (typeof contentId !== 'string' || typeof cardIndex !== 'number' || ![1, 2, 4, 5].includes(quality)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Get existing progress or create default
    const existing = await prisma.flashcardProgress.findUnique({
      where: { userId_contentId_cardIndex: { userId: session.user.id, contentId, cardIndex } },
    });

    const currentCard = {
      easeFactor: existing?.easeFactor ?? 2.5,
      interval: existing?.interval ?? 0,
      repetitions: existing?.repetitions ?? 0,
    };

    const result = calculateSM2(currentCard, quality as SM2Quality);

    const progress = await prisma.flashcardProgress.upsert({
      where: { userId_contentId_cardIndex: { userId: session.user.id, contentId, cardIndex } },
      create: {
        userId: session.user.id,
        contentId,
        cardIndex,
        ...result,
        lastReviewed: new Date(),
      },
      update: {
        ...result,
        lastReviewed: new Date(),
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Flashcard review error:', error);
    return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
  }
}
```

- Create `src/app/api/flashcard/due/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json({ error: 'contentId required' }, { status: 400 });
    }

    const now = new Date();
    const dueCards = await prisma.flashcardProgress.findMany({
      where: {
        userId: session.user.id,
        contentId,
        dueDate: { lte: now },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json({ dueCards, count: dueCards.length });
  } catch (error) {
    console.error('Flashcard due error:', error);
    return NextResponse.json({ error: 'Failed to fetch due cards' }, { status: 500 });
  }
}
```

**Files affected:**
- `src/app/api/flashcard/review/route.ts` (new)
- `src/app/api/flashcard/due/route.ts` (new)

---

### Step 7: Create Activity Heatmap API Route

**Actions:**

- Create `src/app/api/user/activity-heatmap/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Fetch completed queries from last 365 days
    const queries = await prisma.query.findMany({
      where: {
        userId: session.user.id,
        status: 'completed',
        createdAt: { gte: oneYearAgo },
      },
      select: { createdAt: true },
    });

    // Group by date string (YYYY-MM-DD)
    const countsByDate: Record<string, number> = {};
    for (const q of queries) {
      const dateStr = q.createdAt.toISOString().slice(0, 10);
      countsByDate[dateStr] = (countsByDate[dateStr] ?? 0) + 1;
    }

    const data = Object.entries(countsByDate).map(([date, count]) => ({ date, count }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Activity heatmap error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
```

**Files affected:**
- `src/app/api/user/activity-heatmap/route.ts` (new)

---

### Step 8: Create `ActivityHeatmap` Component

Create a GitHub-style 52-week × 7-day activity heatmap.

**Actions:**

- Create `src/components/profile/ActivityHeatmap.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';

interface DayData {
  date: string;
  count: number;
}

function getColor(count: number): string {
  if (count === 0) return 'bg-gray-100';
  if (count === 1) return 'bg-purple-200';
  if (count === 2) return 'bg-purple-400';
  if (count <= 4) return 'bg-purple-500';
  return 'bg-purple-700';
}

export function ActivityHeatmap() {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/activity-heatmap')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  // Build a map of date -> count
  const countMap = new Map<string, number>(data.map(d => [d.date, d.count]));

  // Build the 52-week grid, starting from 52 weeks ago
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  // Rewind to the start of the week (Monday)
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1);

  const weeks: { date: string; count: number }[][] = [];
  let current = new Date(startDate);

  for (let w = 0; w < 53; w++) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().slice(0, 10);
      week.push({ date: dateStr, count: countMap.get(dateStr) ?? 0 });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  const totalContributions = data.reduce((sum, d) => sum + d.count, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-gray-900 text-sm">Activity</span>
        <span className="text-xs text-gray-400">{totalContributions} topics in the last year</span>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-[3px]" style={{ minWidth: 'fit-content' }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-[10px] h-[10px] rounded-[2px] ${getColor(day.count)}`}
                  title={`${day.date}: ${day.count} topic${day.count !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-xs text-gray-400 mr-1">Less</span>
        {['bg-gray-100', 'bg-purple-200', 'bg-purple-400', 'bg-purple-500', 'bg-purple-700'].map((c, i) => (
          <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${c}`} />
        ))}
        <span className="text-xs text-gray-400 ml-1">More</span>
      </div>
    </div>
  );
}
```

**Files affected:**
- `src/components/profile/ActivityHeatmap.tsx` (new)

---

### Step 9: Add ActivityHeatmap to Profile Page

**Actions:**

- In `src/app/(dashboard)/profile/page.tsx`, add import:
  ```typescript
  import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap';
  ```

- Add `<ActivityHeatmap />` in the profile content, after the badges section and before `<NotificationPreferences />`:
  ```tsx
  {/* ── Activity Heatmap ─────────────────────────────────── */}
  <ActivityHeatmap />
  ```

**Files affected:**
- `src/app/(dashboard)/profile/page.tsx`

---

### Step 10: Create `InactivityBanner` Component

Create a flashy full-width banner shown when the user has been inactive for 3, 7, or 14 days.

**Actions:**

- Create `src/components/features/InactivityBanner.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { X, Flame, Zap } from 'lucide-react';
import Link from 'next/link';

interface InactivityBannerProps {
  daysInactive: number;
}

export function InactivityBanner({ daysInactive }: InactivityBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || daysInactive < 3) return null;

  const config = daysInactive >= 14
    ? {
        bg: 'from-red-500 to-orange-500',
        icon: <Flame className="h-5 w-5 text-white animate-pulse" />,
        message: `It's been ${daysInactive} days! Your streak is gone but your learning journey doesn't have to be.`,
        cta: 'Start Fresh Today',
      }
    : daysInactive >= 7
    ? {
        bg: 'from-orange-400 to-amber-500',
        icon: <Flame className="h-5 w-5 text-white" />,
        message: `${daysInactive} days without learning. Come back and rebuild your streak!`,
        cta: 'Pick Up Where You Left Off',
      }
    : {
        bg: 'from-purple-500 to-indigo-600',
        icon: <Zap className="h-5 w-5 text-white" />,
        message: `3 days since your last lesson. Don't let your streak slip away!`,
        cta: 'Continue Learning',
      };

  return (
    <div className={`w-full bg-gradient-to-r ${config.bg} px-4 py-3`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {config.icon}
          <p className="text-white text-sm font-medium truncate">{config.message}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/explore"
            className="text-xs font-bold bg-white/20 hover:bg-white/30 text-white
                       px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
          >
            {config.cta}
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Files affected:**
- `src/components/features/InactivityBanner.tsx` (new)

---

### Step 11: Add InactivityBanner to Dashboard Layout

The dashboard layout is a server component that already calls `auth()`. We can compute days inactive server-side and pass it as a prop. Since `InactivityBanner` is already a client component, it renders as needed.

**Actions:**

- In `src/app/(dashboard)/layout.tsx`, update to:
  1. Import `prisma` and `InactivityBanner`
  2. Fetch the user's `lastActiveDate`
  3. Compute `daysInactive`
  4. Render `<InactivityBanner daysInactive={daysInactive} />`

Updated layout:
```typescript
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CapacitorInit } from '@/components/capacitor/CapacitorInit';
import { InactivityBanner } from '@/components/features/InactivityBanner';
import { prisma } from '@/lib/db/prisma';
import '../globals.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Compute days inactive for inactivity banner
  let daysInactive = 0;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastActiveDate: true },
    });
    if (user?.lastActiveDate) {
      const diffMs = Date.now() - user.lastActiveDate.getTime();
      daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
  } catch {
    // Non-blocking — don't fail layout on error
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <CapacitorInit />
      <InactivityBanner daysInactive={daysInactive} />
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
```

**Files affected:**
- `src/app/(dashboard)/layout.tsx`

---

### Step 12: Create `TopicDiscoveryHub` Component

**Actions:**

- Create `src/components/features/TopicDiscoveryHub.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { emoji: '🔬', label: 'STEM', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100', topics: ['Quantum Physics', 'DNA Replication', 'Machine Learning', 'Calculus'] },
  { emoji: '🌍', label: 'History', color: 'bg-amber-50 border-amber-200 hover:bg-amber-100', topics: ['World War II', 'Ancient Rome', 'Indian Independence', 'The Renaissance'] },
  { emoji: '🗣️', label: 'Languages', color: 'bg-green-50 border-green-200 hover:bg-green-100', topics: ['English Grammar', 'French Basics', 'Spanish Verbs', 'Latin Roots'] },
  { emoji: '💰', label: 'Finance', color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100', topics: ['Stock Market', 'Compound Interest', 'Mutual Funds', 'GST India'] },
  { emoji: '🎨', label: 'Arts', color: 'bg-pink-50 border-pink-200 hover:bg-pink-100', topics: ['Impressionism', 'Music Theory', 'Photography', 'Film Direction'] },
  { emoji: '💻', label: 'Technology', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100', topics: ['React.js', 'System Design', 'Cybersecurity', 'Data Structures'] },
];

const TRENDING = [
  'Artificial Intelligence', 'Climate Change', 'Quantum Computing',
  'UPSC Preparation', 'JEE Chemistry', 'Personal Finance India',
  'Web Development', 'Human Psychology', 'Space Exploration',
];

interface TopicDiscoveryHubProps {
  onTopicSelect: (topic: string) => void;
}

export function TopicDiscoveryHub({ onTopicSelect }: TopicDiscoveryHubProps) {
  const [recentTopics, setRecentTopics] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/query/history')
      .then(r => r.ok ? r.json() : { queries: [] })
      .then(({ queries }) => {
        // Get unique topics from recent queries, max 6
        const topics: string[] = [];
        const seen = new Set<string>();
        for (const q of queries.slice(0, 20)) {
          const t = q.topicDetected || q.queryText;
          if (t && !seen.has(t)) {
            seen.add(t);
            topics.push(t.length > 30 ? t.slice(0, 30) + '…' : t);
            if (topics.length >= 6) break;
          }
        }
        setRecentTopics(topics);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full mb-8 space-y-6">
      {/* Trending topics */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          🔥 Trending Topics
        </h2>
        <div className="flex flex-wrap gap-2">
          {TRENDING.map(topic => (
            <button
              key={topic}
              onClick={() => onTopicSelect(topic)}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full
                         hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50
                         transition-colors text-gray-700 shadow-sm"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Recent for this user */}
      {recentTopics.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            📚 Continue Exploring
          </h2>
          <div className="flex flex-wrap gap-2">
            {recentTopics.map(topic => (
              <button
                key={topic}
                onClick={() => onTopicSelect(topic)}
                className="px-3 py-1.5 text-sm bg-indigo-50 border border-indigo-200 rounded-full
                           hover:bg-indigo-100 hover:border-indigo-400 text-indigo-700
                           transition-colors shadow-sm"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subject categories */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          🗂️ Browse by Subject
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map(cat => (
            <div key={cat.label} className={`border rounded-xl p-3 ${cat.color} transition-colors`}>
              <div className="text-2xl mb-1">{cat.emoji}</div>
              <div className="font-semibold text-gray-800 text-sm mb-2">{cat.label}</div>
              <div className="space-y-1">
                {cat.topics.slice(0, 3).map(t => (
                  <button
                    key={t}
                    onClick={() => onTopicSelect(t)}
                    className="block text-xs text-left text-gray-600 hover:text-gray-900
                               hover:underline w-full truncate"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Files affected:**
- `src/components/features/TopicDiscoveryHub.tsx` (new)

---

### Step 13: Integrate TopicDiscoveryHub into Explore Page

The explore page wraps `SplitLayoutExplore`. We need to check how the search query is set in that component, then wire up `onTopicSelect`.

**Actions:**

- Read `src/app/(dashboard)/explore/ExploreClientWrapper.tsx` to understand how queries are triggered
- In `src/app/(dashboard)/explore/page.tsx`, check if `SplitLayoutExplore` accepts a `defaultQuery` or similar prop; if not, use `ExploreClientWrapper` as intermediary
- Add `TopicDiscoveryHub` above `SplitLayoutExplore` in the explore page layout
- The `onTopicSelect` handler should pre-fill the search input — use a shared state or URL search param (`?q=topic`) approach

Implementation approach (URL params — simplest, no prop drilling):
- `TopicDiscoveryHub.onTopicSelect` calls `router.push('/explore?q=' + encodeURIComponent(topic))`
- `SplitLayoutExplore` reads `searchParams.q` to pre-fill on mount
- OR update the ExploreClientWrapper to read `?q` from URL

If `SplitLayoutExplore` already reads from URL params, just update `onTopicSelect` in `TopicDiscoveryHub` to use `router.push`. If not, the router push will at least trigger a navigation that can be intercepted.

**Files affected:**
- `src/app/(dashboard)/explore/page.tsx`
- Possibly `src/app/(dashboard)/explore/ExploreClientWrapper.tsx`

---

### Step 14: Streamline Footer Component

Remove duplication: Privacy/Terms appears twice; operator info appears twice; "Email" and "Support" are same address.

**Actions:**

- Rewrite `src/components/layout/Footer.tsx` to:

```typescript
'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">

          {/* Brand */}
          <div>
            <h3 className="text-white font-semibold mb-2">EduExplorer</h3>
            <p className="text-sm leading-relaxed mb-3">
              AI-powered learning platform. Explore any topic with instant lessons, quizzes, and flashcards.
            </p>
            <p className="text-xs">
              Email:{' '}
              <a href="mailto:admin@eduexplorer.ai" className="hover:text-white transition-colors">
                admin@eduexplorer.ai
              </a>
            </p>
          </div>

          {/* Links */}
          <div className="sm:text-right">
            <h3 className="text-white font-semibold mb-2">Legal</h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-600">
          <p>&copy; {currentYear} EduExplorer. All rights reserved. Operated by Usha Sree, India.</p>
        </div>
      </div>
    </footer>
  );
}
```

Key changes: 2 columns instead of 3; email consolidated; operator info moved to copyright bar as single line; Privacy/Terms only appears once.

**Files affected:**
- `src/components/layout/Footer.tsx`

---

### Step 15: Redesign Groups Page with Gradient Header + Colored Cards

**Actions:**

- Rewrite `src/app/(dashboard)/groups/page.tsx` with a gradient hero header (matching the profile page pattern) and richer card layout:

```typescript
// Key changes — replace the plain heading block with:
<div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600
                px-6 pt-10 pb-20 text-white relative overflow-hidden">
  <div className="absolute inset-0 opacity-10">
    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white" />
    <div className="absolute top-16 -left-4 w-20 h-20 rounded-full bg-white" />
  </div>
  <div className="max-w-6xl mx-auto relative">
    <h1 className="text-3xl sm:text-4xl font-extrabold mb-1">Study Groups</h1>
    <p className="text-purple-200 text-sm">Collaborate and learn with others</p>
  </div>
</div>

// Cards section overlaps the header (same -mt-14 pattern as profile):
<div className="max-w-6xl mx-auto px-4 -mt-10">
  <div className="flex gap-3 mb-6">
    ...buttons...
  </div>
  <GroupsList groups={groups} />
</div>
```

- Rewrite `GroupsList` component to show colored cards. Each card gets a color based on name hash:

```typescript
const GROUP_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-green-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
];

function getGroupColor(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GROUP_COLORS[hash % GROUP_COLORS.length];
}
```

Each group card: colored gradient top strip, group name, description (truncated to 2 lines), member count pill, role badge (ADMIN/MEMBER), "Open Group" button.

**Files affected:**
- `src/app/(dashboard)/groups/page.tsx`
- `src/app/(dashboard)/groups/GroupsList.tsx`

---

### Step 16: Fix Create Group Page — Convert Modal to Proper Page

The create group page uses `fixed inset-0 bg-black/50` overlay. Replace with a standard page layout matching the rest of the app.

**Actions:**

- Rewrite `src/app/(dashboard)/groups/create/page.tsx`:
  - Remove the `fixed inset-0 bg-black/50` wrapping div
  - Add a proper page header matching the groups page style (simpler gradient or plain white)
  - Keep the form and logic identical — just the wrapper changes
  - Add back a prominent "← Back to Groups" link

```typescript
// Replace the modal wrapper:
return (
  <div className="max-w-2xl mx-auto px-4 py-8">
    <div className="flex items-center gap-3 mb-6">
      <Link href="/groups" className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
        <ArrowLeft className="h-4 w-4" />
        Back to Groups
      </Link>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Users className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Study Group</h1>
          <p className="text-xs text-gray-500">Set up a collaborative learning space</p>
        </div>
      </div>
      {/* form stays the same */}
    </div>
  </div>
);
```

Remove the `handleBackgroundClick` and Escape key handler since it's no longer a modal.

**Files affected:**
- `src/app/(dashboard)/groups/create/page.tsx`

---

### Step 17: Run Type-Check and Fix Any Errors

**Actions:**

- Run `npm run type-check`
- Fix any TypeScript errors introduced by new types (SM2Quality, FlashcardProgress relations, etc.)

---

## Connections & Dependencies

### Files That Reference This Area

- `src/app/(dashboard)/layout.tsx` — now imports `prisma` (adds a DB call to every dashboard page load — lightweight: single user field lookup with index)
- `prisma/schema.prisma` — `FlashcardProgress` requires `Content` to have `flashcardProgress FlashcardProgress[]` relation added
- Flashcard viewer component (wherever it lives) will need to call `/api/flashcard/review` — this is a follow-up since the viewer UI update is not explicitly in this plan scope but the APIs are ready
- `TopicDiscoveryHub` calls `/api/query/history` — this is the same endpoint already used by the history tab; no auth issues

### Updates Needed for Consistency

- `MEMORY.md` — add notes about new services, components, and the Razorpay fix
- `next.config.js` — no changes needed (SVG in public/ doesn't need configuration)

### Impact on Existing Workflows

- Research/explore flow: `TopicDiscoveryHub` adds a click path to pre-fill search; existing search still works unchanged
- Flashcard flow: new `FlashcardProgress` table; existing flashcard generation unchanged; review API is additive
- Profile page: new `ActivityHeatmap` section appended; existing sections unchanged
- Dashboard layout: adds single Prisma call per page load for inactivity check — use `.catch(() => {})` to prevent any layout failures

---

## Validation Checklist

- [ ] `GET /default-avatar.svg` returns 200 (no more 404)
- [ ] All 9 avatar fallback references changed to `.svg` — verify with `grep -r "default-avatar.png" src/`
- [ ] Razorpay checkout modal opens when clicking Subscribe (key returned from API)
- [ ] `npm run type-check` passes with zero errors
- [ ] `npx prisma db push` succeeds with `FlashcardProgress` table created
- [ ] `POST /api/flashcard/review` returns 200 with updated card state
- [ ] `GET /api/user/activity-heatmap` returns `{ data: [...] }` array
- [ ] Activity heatmap renders in profile page (purple cells for active days)
- [ ] Inactivity banner shows on dashboard when `lastActiveDate` is 3+ days ago
- [ ] TopicDiscoveryHub shows trending chips and category grid on explore page
- [ ] Footer no longer has duplicate Privacy/Terms links
- [ ] Groups page has colored header gradient
- [ ] Create Group page has white background (not black modal overlay)

---

## Success Criteria

1. Zero `GET /default-avatar.png 404` errors in server logs
2. Clicking "Subscribe Monthly" on upgrade page successfully opens Razorpay checkout
3. Profile page shows a scrollable activity heatmap with 52 weeks of data
4. Explore page shows trending topics, personal history chips, and subject category grid above the search box
5. `FlashcardProgress` table exists in DB; `POST /api/flashcard/review` accepts ratings and returns SM-2 computed next date
6. Dashboard shows inactivity banner for users inactive 3+ days (dismissable)
7. Footer renders cleanly with no duplicate links
8. Groups page has gradient header; Create Group is a proper page with white background

---

## Notes

### Spaced Repetition — Future Flashcard Viewer Update
This plan adds the SM-2 backend (algorithm + API routes + DB table). A follow-up plan should update the actual flashcard viewer UI component to:
- Show cards one at a time
- Show Again/Hard/Good/Easy buttons after card flip
- Prioritize due cards (those with `dueDate <= now`) over new cards
- Show a "Session complete" state when no more due cards remain

### Razorpay Subscription vs One-Time Payment
Currently the Razorpay integration uses one-time order payments, not recurring subscriptions. This means Pro access won't auto-renew. A future improvement is to use Razorpay Subscriptions API for recurring billing. For now, the fix just makes the one-time payment work.

### TopicDiscoveryHub — Trending Algorithm
The current implementation uses hardcoded trending topics. A future improvement is to compute real trending topics from recent `Query.queryText` aggregated across all users (excluding PII). This would require a background job that refreshes trending topics periodically.

### Activity Heatmap — Timezone
The current implementation uses UTC dates. For Indian users (IST = UTC+5:30), dates may shift. A future improvement is to accept a `timezone` query param and use it for date grouping.

---

## Implementation Notes

**Implemented:** 2026-02-26

### Summary

- Created `public/default-avatar.svg` (purple-to-pink gradient silhouette) and updated 9 files that referenced the missing `/default-avatar.png`
- Fixed Razorpay upgrade flow: `RAZORPAY_KEY_ID` returned from `create-order` API and consumed on the client from the response (was trying to use non-existent `NEXT_PUBLIC_RAZORPAY_KEY_ID`)
- Added `FlashcardProgress` Prisma model with SM-2 fields; ran `npx prisma db push`; created `src/lib/services/sm2.ts` and API routes `/api/flashcard/review` and `/api/flashcard/due`
- Created `src/app/api/user/activity-heatmap/route.ts` aggregating completed queries by UTC date; built `src/components/profile/ActivityHeatmap.tsx` (53-week grid, purple color scale) and mounted it in the profile page
- Created `src/components/features/InactivityBanner.tsx` (dismissable, 3/7/14-day escalating gradient banners); updated `src/app/(dashboard)/layout.tsx` to fetch `lastActiveDate` server-side and pass `daysInactive` prop
- Created `src/components/features/TopicDiscoveryHub.tsx` (trending chips, continue-exploring history, 6 subject category cards); mounted above `SplitLayoutExplore` in explore page
- Streamlined `src/components/layout/Footer.tsx` to two columns (Brand + Legal), removed clutter
- Redesigned `src/app/(dashboard)/groups/page.tsx` with gradient hero header (violet-to-indigo) and overlapping content card
- Rewrote `src/app/(dashboard)/groups/GroupsList.tsx` with colored gradient top strips, group initial avatars, chevron, and admin badge
- Converted `src/app/(dashboard)/groups/create/page.tsx` from modal overlay to proper page with consistent `min-h-screen bg-gray-50` background

### Deviations from Plan

- Flashcard viewer UI (Again/Hard/Good/Easy buttons in the viewer component) was explicitly deferred to a follow-up; backend SM-2 API is fully ready
- `TopicDiscoveryHub` "Continue Exploring" section fetches from existing `/api/query/history` which already filters to `status: 'completed'`

### Issues Encountered

- None — `npm run type-check` passed with zero errors on first run
