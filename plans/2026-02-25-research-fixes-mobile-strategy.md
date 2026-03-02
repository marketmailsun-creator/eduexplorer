# Plan: Research Error Handling, History Cleanup & Mobile Strategy

**Created:** 2026-02-25
**Status:** Draft
**Request:** Fix Perplexity 401 error with model fallback, stop storing failed queries in history, clarify Twilio vs Facebook for production SMS, and evaluate Capacitor vs alternatives for iOS/Android deployment

---

## Overview

### What This Plan Accomplishes

1. **Research error fix (code changes):** Replace the raw Perplexity `sonar` single-model call with a model-cascade fallback chain (`sonar` → `sonar-pro` → `llama-3.1-sonar-large-128k-online`). Wrap API errors into user-friendly messages instead of propagating raw HTML `<head><title>401</title></head>` to the frontend. Delete the `processing`-status query record on failure so it never appears in history.

2. **History cleanup (code change):** Filter the history API to return only `status = 'completed'` queries, so failed/processing records are never visible in the history tab.

3. **Twilio advisory (no code):** Document whether Facebook Business Verification is required for Twilio production SMS/WhatsApp.

4. **Mobile strategy advisory (no code):** Evaluate Capacitor Remote URL mode vs alternatives (Capacitor + Next.js PWA, Expo/React Native, React Native bare, Ionic) for iOS/Android deployment and recommend the best approach for EduExplorer.

### Why This Matters

Users currently see a cryptic `<head><title>401</title></head>` error when the Perplexity API key is invalid or rate-limited, and the failed search still clutters their history tab. These two bugs together create a broken experience that erodes trust.

---

## Current State

### Relevant Existing Structure

- `src/lib/services/research.service.ts` — Perplexity `sonar` model, single-model, no fallback
  - Creates `Query` with `status: 'processing'` BEFORE calling Perplexity
  - On error: updates query to `status: 'failed'`, rethrows `Research failed: ${error.message}`
  - On success: updates query to `status: 'completed'`
- `src/app/api/query/submit/route.ts` — calls `processResearchQuery`, catches error, returns 500 with `error.message`
- `src/app/api/query/history/route.ts` — fetches all queries regardless of status (line 16), returns `processing` + `failed` + `completed`
- No user-facing error message formatting exists anywhere in the error path

### Gaps or Problems Being Addressed

1. **Raw HTML error in production**: Perplexity returns HTTP 401 with HTML body when API key is wrong/expired. OpenAI SDK wraps this as `error.message = "<head><title>401 Authorization Required</title></head>"`. This raw HTML is shown to the user.
2. **No model fallback**: If `sonar` fails (quota, outage, 401), there is no retry with another model.
3. **Query record leaks**: `Query` rows are created with `status: 'processing'` even when the API call ultimately fails. Failed rows persist in the DB and surface in history.
4. **History shows all statuses**: `history/route.ts` has no `status` filter, so users see failed searches.

---

## Proposed Changes

### Summary of Changes

- Add `PERPLEXITY_MODELS` fallback chain in `research.service.ts`
- Add user-friendly error message mapping (401 → "API key issue", 429 → "Rate limited", etc.)
- **Delete** the `Query` record (instead of marking `failed`) when all models fail, so it never appears in history
- Filter `history/route.ts` to `status: 'completed'` only
- No schema changes required

### New Files to Create

None.

### Files to Modify

| File Path | Changes |
|-----------|---------|
| `src/lib/services/research.service.ts` | Multi-model fallback, friendly error messages, delete query on total failure |
| `src/app/api/query/history/route.ts` | Add `status: 'completed'` filter to Prisma query |

### Files to Delete

None.

---

## Design Decisions

### Key Decisions Made

1. **Delete query on failure vs mark as `failed`**: Marking as `failed` was the original design but it causes the history pollution bug. Deleting the record on total failure is cleaner — the user never submitted a valid query, so no record should exist. If we need failure analytics later, we can add a separate `ResearchError` log table.

2. **Fallback model order**: `sonar` (default, cheapest) → `sonar-pro` (higher quality, costs more) → `llama-3.1-sonar-large-128k-online` (open-weights fallback via Perplexity's hosted endpoint). All three share the same Perplexity base URL and API key, so no new credentials needed.

3. **Error message mapping**: Map HTTP status codes to friendly strings rather than showing raw error messages. Keep technical detail in server logs only.

4. **History filter at API level**: Filter in `history/route.ts` rather than in the frontend component. This is the correct separation of concerns — the API should not expose internal state (`processing`/`failed`) to the client history view.

5. **`sonar-pro` as the fallback**: Perplexity's `sonar-pro` has higher context and better accuracy. If `sonar` has an outage or per-model quota, `sonar-pro` likely still works. The third fallback (`llama-3.1-sonar-large-128k-online`) covers the case where both Perplexity-branded models are down.

### Alternatives Considered

- **Keep failed query, filter in frontend**: Rejected — server-side filtering is correct and avoids sending unnecessary data to the client.
- **Only use `sonar-pro`**: Rejected — `sonar` is cheaper and sufficient for most queries; use `sonar-pro` only as fallback.
- **Use a separate error logging table**: Valid for production analytics but out of scope for this fix; can be added later.

### Open Questions

None — all decisions are clear.

---

## Advisory: Twilio Production SMS/WhatsApp (No Code Changes)

### Facebook Business Verification — Is It Required?

**For SMS (Twilio):**
- No Facebook verification required whatsoever.
- For India, Twilio uses DLT (Distributed Ledger Technology) registration via TRAI. You must register your sender ID and message templates with a DLT provider (Airtel, Vodafone, BSNL, etc.) before sending transactional SMS. This is separate from Facebook.
- Twilio's SMS works in production once your account is funded and DLT registration is complete.
- Fast2SMS (alternative for Indian SMS) has its own approval process — no DLT required for OTP category but requires entity/template registration.

**For WhatsApp (Twilio):**
- Yes, Facebook Business Verification IS required to move beyond the WhatsApp sandbox.
- The sandbox (for dev/testing) works without verification — users must opt-in by sending a join message.
- To send WhatsApp messages to any number in production (not just opted-in sandbox users), you must:
  1. Create a Facebook Business Manager account
  2. Submit for Facebook Business Verification (business documents, domain verification)
  3. Get a WhatsApp Business API account approved via Meta
  4. Connect it to Twilio's WhatsApp sender

**Recommendation for EduExplorer:**
- Use **SMS only for OTP** (no Facebook verification needed). Register with DLT for India compliance.
- Defer WhatsApp to a later phase when the business is established and can complete Meta verification.
- For development: continue using Twilio sandbox or Fast2SMS.
- For production OTP (SMS): Twilio with DLT registration OR Fast2SMS (cheaper at ₹0.15/SMS, individual-friendly signup).

---

## Advisory: Capacitor vs Alternatives for iOS/Android (No Code Changes)

### EduExplorer's Tech Stack Context
- Next.js 16 App Router, server-side rendering, API routes
- PWA already configured (service worker, `register-sw.tsx`)
- No React Native codebase exists

### Options Evaluated

| Option | Effort | Native Features | Store Deployment | Recommended? |
|--------|--------|----------------|-----------------|--------------|
| **Capacitor (Remote URL mode)** | Low | Moderate | Yes (both stores) | ✅ Best fit |
| **Capacitor (local build/SSG)** | High | Moderate | Yes | ❌ Incompatible with App Router |
| **React Native (Expo)** | Very High | Full native | Yes | ❌ Full rewrite |
| **React Native bare** | Very High | Full native | Yes | ❌ Full rewrite |
| **PWA only** | None | Limited | Limited (no App Store) | ❌ Apple rejects pure PWAs |
| **Ionic + Angular/React** | High | Good | Yes | ❌ Different framework |

### Why Capacitor Remote URL Mode Is the Best Choice

**Capacitor Remote URL mode** loads your deployed Next.js URL inside a native WebView, wrapping it in a thin iOS/Android shell. This means:

- **No code changes** to your Next.js app — it continues to run as a web app
- Push notifications, camera, file system, biometrics via Capacitor plugins
- Submit to App Store and Google Play Store as a real native app
- You maintain one codebase (Next.js) — no duplication

**Limitations to be aware of:**
1. Requires live internet connection (no offline-first without extra work)
2. App Store review may reject apps that are purely web wrappers — you need at least one native Capacitor plugin (e.g., push notifications, camera, or biometric auth) to demonstrate native value
3. WebView performance is slightly lower than true native, but acceptable for an educational app
4. Apple's App Store guidelines (section 4.2) require apps to have enough unique native functionality — using Capacitor Push Notifications + Camera (for image uploads) + Biometric Auth satisfies this

**Implementation approach (not in this plan's code steps):**
1. `npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android`
2. `npx cap init EduExplorer com.yourdomain.eduexplorer`
3. Set `server.url` in `capacitor.config.ts` to your production URL
4. Add `@capacitor/push-notifications`, `@capacitor/camera`, `@capacitor/biometric` plugins
5. `npx cap add ios && npx cap add android`
6. Build and submit via Xcode / Android Studio

**Better alternative to consider: Capacitor + PWA hybrid**
Since EduExplorer already has a PWA, you can use Capacitor for the App Store shell while the PWA handles the web experience. This gives you:
- App Store presence (via Capacitor shell)
- Web browser access (via PWA)
- Single Next.js codebase for both

---

## Step-by-Step Tasks (Code Changes Only)

### Step 1: Update `research.service.ts` — Model Fallback + Friendly Errors + Delete on Failure

Add a fallback model list and wrap the API call in a loop that tries each model. Map error status codes to friendly messages. On total failure, delete the query record instead of marking it failed.

**Actions:**

- Define `PERPLEXITY_MODELS` array: `['sonar', 'sonar-pro', 'llama-3.1-sonar-large-128k-online']`
- Replace single `perplexity.chat.completions.create()` call with a `for` loop over models
- Catch per-model error: log it, try next model
- If all models fail: delete the `query` record (`prisma.query.delete`) and throw a user-friendly error
- Add `getFriendlyErrorMessage(error)` helper that maps HTTP status codes to readable strings:
  - 401: "Research service authentication failed. Please try again later."
  - 429: "Research service is busy. Please wait a moment and try again."
  - 503 / 500: "Research service is temporarily unavailable. Please try again."
  - Default: "Research failed. Please try again."

**Files affected:**

- `src/lib/services/research.service.ts`

---

### Step 2: Update `history/route.ts` — Filter to Completed Only

Add `status: 'completed'` to the `prisma.query.findMany` where clause.

**Actions:**

- In `src/app/api/query/history/route.ts`, change the `where` clause from `{ userId: session.user.id }` to `{ userId: session.user.id, status: 'completed' }`

**Files affected:**

- `src/app/api/query/history/route.ts`

---

### Step 3: Type-Check Validation

Run `npm run type-check` to confirm no TypeScript errors are introduced.

**Actions:**

- Run `npm run type-check`
- Fix any type errors

---

## Connections & Dependencies

### Files That Reference This Area

- `src/app/api/query/submit/route.ts` — calls `processResearchQuery`, handles thrown errors, already returns `error.message` to client as JSON `{ error: ... }` (this already works correctly once `research.service.ts` throws a friendly message)
- Any frontend component that calls `/api/query/history` — will now only see completed queries (desired behavior)

### Updates Needed for Consistency

- `MEMORY.md` — update to note the fallback model chain and history filter

### Impact on Existing Workflows

- The query submit flow is unchanged from the user's perspective; they get a friendly error toast instead of raw HTML
- The history tab will be cleaner — no more ghost entries from failed searches
- The cache key in Redis remains unchanged (only caches completed research anyway)

---

## Validation Checklist

- [ ] `npm run type-check` passes with zero errors
- [ ] Perplexity 401 error produces a friendly JSON error message (not raw HTML)
- [ ] Failed research query is NOT saved to DB (query record deleted on total failure)
- [ ] History API returns only `status: 'completed'` queries
- [ ] Model fallback chain is logged (can verify via server console)
- [ ] Existing successful research flow still works end-to-end

---

## Success Criteria

1. When Perplexity returns 401, the user sees a friendly error toast (e.g., "Research service authentication failed. Please try again later.") — not raw HTML
2. After a failed research attempt, the history tab shows zero new entries (the failed query is deleted)
3. `npm run type-check` passes with no new errors

---

## Notes

### Twilio for Production (Summary)
- **SMS OTP**: No Facebook verification needed. Requires DLT registration for India (TRAI compliance). Fast2SMS is a cheaper Indian alternative (₹0.15/OTP).
- **WhatsApp**: Facebook Business Verification IS required to exit sandbox. Defer to later phase.

### Mobile App (Summary)
- **Capacitor Remote URL mode** is the correct choice for EduExplorer's Next.js architecture.
- Add at least one native plugin (Push Notifications, Camera, or Biometrics) to satisfy App Store review requirements.
- The existing PWA handles web browsers; Capacitor handles App Store / Play Store distribution.
- No React Native rewrite is recommended — it would be a complete rebuild of all UI.

### Future Considerations
- Add a `ResearchError` table for analytics on which queries fail and why
- Consider a `sonar-deep-research` model for Pro users (more thorough, slower)
- Once WhatsApp Business is approved, update OTP service to send via WhatsApp as primary channel (higher open rates in India)
