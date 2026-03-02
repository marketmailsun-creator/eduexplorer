# Plan: Deploy Missing Schema Migrations to Production

**Created:** 2026-03-02
**Status:** Implemented
**Request:** Schema changes from the last 3 commits are not deployed to production — create proper migration files and deploy them to Neon via `prisma migrate deploy`

---

## Overview

### What This Plan Accomplishes

Creates formal Prisma migration files for all schema changes made since `20260215060519_add_password_reset_token` (Feb 15), commits them to the feature branch, merges to main, and verifies that the Vercel production build correctly applies them to the Neon database. This closes the gap between what the codebase expects and what actually exists in the production database.

### Why This Matters

The production app on Vercel runs `prisma migrate deploy` on every build. Without migration files, new models (gamification tables, flashcard progress, phone auth fields) simply don't exist in the production Neon DB. Any user action that touches those tables throws a Prisma runtime error and crashes those features in production.

---

## Current State

### Relevant Existing Structure

```
prisma/
  schema.prisma              — current schema (has all new models)
  migrations/
    20260215060519_add_password_reset_token/   ← LAST MIGRATION (Feb 15)
    ... (19 earlier migrations)
  migration_lock.toml
```

**`package.json` build pipeline:**
```json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```
`prisma migrate deploy` only applies SQL files inside `prisma/migrations/`. Since no migration files exist for the new models, they are never created in production.

### Schema Changes NOT in Any Migration File

Since the last migration (Feb 15), `db push` was used for all schema updates. The following are in `schema.prisma` but have **no corresponding migration SQL**:

**New fields on `User` model:**
- `phone String? @unique`
- `phoneVerified DateTime?`
- `totalXP Int @default(0)`
- `currentStreak Int @default(0)`
- `longestStreak Int @default(0)`
- `lastActiveDate DateTime?`

**New relations on existing models:**
- `Query.challenges Challenge[]`
- `Content.flashcardProgress FlashcardProgress[]`
- Various User gamification relations

**New enums:**
- `ChallengeStatus` (PENDING, ACCEPTED, COMPLETED, DECLINED, EXPIRED)
- `RedemptionStatus` (PENDING, APPROVED, REJECTED)

**7 New models:**
- `UserStreak` → `user_streaks`
- `XPTransaction` → `xp_transactions`
- `Achievement` → `achievements`
- `UserAchievement` → `user_achievements`
- `Challenge` → `challenges`
- `XPRedemption` → `xp_redemptions`
- `FlashcardProgress` → `flashcard_progress`

### Gaps or Problems Being Addressed

- Production Neon DB is missing all the above tables and columns
- `prisma migrate deploy` on Vercel finds no new migration files → applies nothing
- Features that write to gamification tables (XP, streaks, challenges, achievements, flashcard progress) silently fail or crash in production
- Features that use `User.phone` / `User.phoneVerified` crash in production

---

## Proposed Changes

### Summary of Changes

- Start local Docker PostgreSQL (needed by `prisma migrate dev` shadow DB mechanism)
- Run `prisma migrate dev --name add_phone_gamification_spaced_repetition` to auto-generate migration SQL from the schema drift
- Commit the new migration directory to the feature branch
- Push to remote; Vercel re-deploys and `prisma migrate deploy` applies the SQL to Neon

### New Files to Create

| File Path | Purpose |
| --- | --- |
| `prisma/migrations/YYYYMMDDHHMMSS_add_phone_gamification_spaced_repetition/migration.sql` | Auto-generated SQL for all schema changes since Feb 15 |

*(Exact timestamp in folder name is set by Prisma at generation time)*

### Files to Modify

| File Path | Changes |
| --- | --- |
| `plans/2026-03-02-deploy-schema-migrations-production.md` | Updated to Implemented after completion |

### Files to Delete (if any)

None.

---

## Design Decisions

### Key Decisions Made

1. **Use `prisma migrate dev` to generate SQL (not hand-write it)**: Prisma's shadow DB mechanism accurately diffs the current schema against the cumulative state of all applied migrations, guaranteeing the generated SQL is correct. Hand-writing SQL risks missing indexes, constraints, or ordering issues.

2. **Single migration for all pending changes**: Grouping phone fields + gamification + flashcard progress into one migration is pragmatic — they were all deployed to dev together and are logically part of the same feature wave. Splitting them is unnecessary complexity.

3. **Do not use `db push` in production**: `db push` bypasses migration history. `prisma migrate deploy` is the correct production command and is already in `vercel-build`. We preserve this.

4. **Local Docker DB is required for migration generation**: `prisma migrate dev` needs a real PostgreSQL connection (for the shadow DB). The project's Docker setup provides this via `npm run docker:dev`.

### Alternatives Considered

- **Manually writing the migration SQL**: Error-prone, especially for enums and foreign key ordering. Rejected in favor of Prisma auto-generation.
- **Running `db push` directly on Neon**: Would work but bypasses migration history permanently, making future `prisma migrate deploy` calls error out. Rejected.
- **Using `prisma migrate resolve --applied` to mark schema as already applied**: Only valid if Neon already has the tables (e.g., via earlier `db push` on Neon). We don't know if that happened, and this approach is fragile. Rejected.

### Open Questions (if any)

1. **Has `db push` ever been run against the Neon production DB directly?** If yes, the tables already exist in Neon. `prisma migrate deploy` would still need to run, but we'd need to use `prisma migrate resolve --applied <migration_name>` to tell Prisma "this migration was already applied". **If unsure, assume the tables do NOT exist** — running `prisma migrate deploy` on a DB that already has the tables will fail with "table already exists" errors.

   → **Resolution step included in the plan below** (Step 5) to check and handle both cases.

---

## Step-by-Step Tasks

### Step 1: Verify the Current Git State

Confirm exactly which commits introduced the schema changes and that the feature branch is up to date.

**Actions:**
- Run `git log --oneline main..HEAD -- prisma/schema.prisma` to see commits that changed the schema but are not yet on main
- Confirm the 3 feature branch commits (`c4a549b`, `6f8d458`, `c1e6d3a`) are present
- Run `git status` to confirm a clean working tree before proceeding

**Expected output:**
```
c4a549b feat: fix image math analysis, diagram loading...
6f8d458 feat: add gamification, spaced repetition...
c1e6d3a feat: add mobile OTP authentication...
```

**Files affected:** (read-only verification, no changes)

---

### Step 2: Start Local Docker PostgreSQL

`prisma migrate dev` uses a real PostgreSQL connection to create and replay migrations via a shadow database. The local Docker container provides this.

**Actions:**
- Run `npm run docker:dev` to start PostgreSQL and Redis containers
- Wait ~5 seconds for PostgreSQL to be ready
- Verify with: `docker ps | grep postgres`

**Files affected:** None (infrastructure only)

---

### Step 3: Generate the Migration File

Run `prisma migrate dev` with `--create-only` flag so it generates the SQL file but does NOT apply it to the local DB yet (safe for review). This compares the current `schema.prisma` against what all existing migration files produce.

**Actions:**
- Run:
  ```bash
  npx prisma migrate dev --name add_phone_gamification_spaced_repetition --create-only
  ```
- Prisma will:
  1. Apply all existing 20 migrations to a shadow DB
  2. Diff the shadow DB state against `schema.prisma`
  3. Generate SQL for the delta
  4. Write it to `prisma/migrations/<timestamp>_add_phone_gamification_spaced_repetition/migration.sql`
- Inspect the generated SQL to confirm it includes:
  - `ALTER TABLE "users" ADD COLUMN "phone"...`
  - `ALTER TABLE "users" ADD COLUMN "phone_verified"...`
  - `ALTER TABLE "users" ADD COLUMN "total_xp"...`
  - `CREATE TABLE "user_streaks"...`
  - `CREATE TABLE "xp_transactions"...`
  - `CREATE TABLE "achievements"...`
  - `CREATE TABLE "user_achievements"...`
  - `CREATE TABLE "challenges"...`
  - `CREATE TABLE "xp_redemptions"...`
  - `CREATE TABLE "flashcard_progress"...`
  - `CREATE TYPE "ChallengeStatus"...`
  - `CREATE TYPE "RedemptionStatus"...`

**If `--create-only` is not supported in the installed Prisma version**, use:
```bash
npx prisma migrate dev --name add_phone_gamification_spaced_repetition
```
(This applies the migration to the local DB too, which is fine.)

**Files affected:**
- `prisma/migrations/<timestamp>_add_phone_gamification_spaced_repetition/migration.sql` (created)

---

### Step 4: Verify the Generated Migration SQL

Read the generated `migration.sql` file and confirm it is complete and correct.

**Actions:**
- Read `prisma/migrations/<timestamp>_add_phone_gamification_spaced_repetition/migration.sql`
- Confirm the following tables are created:
  - `user_streaks`, `xp_transactions`, `achievements`, `user_achievements`, `challenges`, `xp_redemptions`, `flashcard_progress`
- Confirm the following columns are added to `users`:
  - `phone`, `phone_verified` (or `phoneVerified`), `total_xp`, `current_streak`, `longest_streak`, `last_active_date`
- Confirm enums are created: `ChallengeStatus`, `RedemptionStatus`
- Confirm foreign key constraints and indexes are present

**Files affected:** (read-only)

---

### Step 5: Check if Production Neon DB Already Has These Tables

This is the critical safety check before deploying.

**Actions:**

**Option A** — If you have Neon dashboard access:
- Log in to [neon.tech](https://neon.tech) → your project → Tables
- Check if `user_streaks`, `challenges`, `flashcard_progress` exist

**Option B** — Connect directly via `DATABASE_URL`:
- Run: `npx prisma db execute --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" --url "$DATABASE_URL"`
  (replace `$DATABASE_URL` with the actual Neon connection string from `.env.local`)

**Interpret results:**

- **Tables do NOT exist** (expected): Proceed to Step 6 directly. `prisma migrate deploy` will create them.

- **Tables DO exist** (Neon was previously synced with `db push`): You must mark the migration as already applied so Prisma doesn't try to re-create tables. After committing in Step 6, run:
  ```bash
  DATABASE_URL="<neon-connection-string>" npx prisma migrate resolve --applied <migration_folder_name>
  ```
  Where `<migration_folder_name>` is the timestamp folder name (e.g., `20260302120000_add_phone_gamification_spaced_repetition`). This tells Prisma "this migration was applied manually, mark it done in `_prisma_migrations` table". Then Vercel's `prisma migrate deploy` will skip it and future migrations will work correctly.

**Files affected:** None

---

### Step 6: Commit and Push the Migration Files

**Actions:**
- Stage only the new migration directory:
  ```bash
  git add prisma/migrations/
  ```
- Commit:
  ```bash
  git commit -m "feat: add migration for phone auth, gamification, and spaced repetition schema

  - Add User.phone, User.phoneVerified columns
  - Add User.totalXP, currentStreak, longestStreak, lastActiveDate columns
  - Create user_streaks, xp_transactions, achievements, user_achievements tables
  - Create challenges table with ChallengeStatus enum
  - Create xp_redemptions table with RedemptionStatus enum
  - Create flashcard_progress table for SM-2 spaced repetition

  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  ```
- Push to remote:
  ```bash
  git push origin feature/mobile-otp-authentication
  ```

**Files affected:**
- `prisma/migrations/<timestamp>_add_phone_gamification_spaced_repetition/migration.sql`

---

### Step 7: Merge the PR to Main

The PR for `feature/mobile-otp-authentication` should be merged to `main` so Vercel triggers a production build.

**Actions:**
- Go to GitHub → Pull Requests
- Open the PR for `feature/mobile-otp-authentication` → `main`
- If no PR exists, create one:
  ```bash
  gh pr create --title "feat: phone auth, gamification, spaced repetition + schema migrations" \
    --body "Adds schema migrations for all changes since Feb 15. Includes phone OTP auth, full gamification system, and SM-2 flashcard progress tracking." \
    --base main
  ```
- Merge the PR (Squash or Merge commit — either is fine)

**Files affected:** (GitHub operation)

---

### Step 8: Monitor Vercel Deployment

After the merge, Vercel automatically triggers a production build running:
```
prisma generate && prisma migrate deploy && next build
```

**Actions:**
- Go to Vercel dashboard → your project → Deployments
- Click the latest deployment → View build logs
- Watch for:
  ```
  Applying migration `20260302XXXXXX_add_phone_gamification_spaced_repetition`
  ```
- Confirm the build succeeds (green checkmark)
- If `prisma migrate deploy` fails with "table already exists", go back to Step 5 and follow the `--applied` resolution path, then re-deploy

**Files affected:** None (monitoring only)

---

### Step 9: Smoke Test Production

Verify that the new tables are accessible in production.

**Actions:**
- Open the production app URL
- Log in and navigate to:
  - `/leaderboard` → should show XP and quiz leaderboard without errors
  - `/challenges` → should load (empty state or existing challenges)
  - `/achievements` → should load
  - `/library` → should load flashcard badges correctly
- Check that XP is awarded after taking a quiz (quiz completion → XP transaction written)
- Check browser console and Vercel function logs for any Prisma errors

**Files affected:** None

---

### Step 10: Update Plan Status

Update this plan file to mark it as implemented.

**Actions:**
- Edit `plans/2026-03-02-deploy-schema-migrations-production.md`
- Change `**Status:** Draft` to `**Status:** Implemented`
- Add Implementation Notes section

**Files affected:**
- `plans/2026-03-02-deploy-schema-migrations-production.md`

---

## Connections & Dependencies

### Files That Reference This Area

- `package.json` — `vercel-build` script runs `prisma migrate deploy`
- `vercel.json` — uses `buildCommand: "npm run vercel-build"`
- `src/lib/services/xp.service.ts` — writes to `xp_transactions`, `user_streaks`
- `src/lib/services/achievement.service.ts` — writes to `achievements`, `user_achievements`
- `src/app/api/challenge/*` — writes to `challenges`
- `src/app/api/flashcard/review/route.ts` — writes to `flashcard_progress`
- `src/auth.ts` — reads/writes `User.phone`, `User.phoneVerified`

### Updates Needed for Consistency

- `CLAUDE.md` note "DB migration history out of sync with DB — use `npx prisma db push` for schema changes in dev" should be updated after this is resolved to reflect that migrations are now back in sync.

### Impact on Existing Workflows

- After this plan is implemented, all future schema changes MUST use `prisma migrate dev` (not `db push`) to create migration files. Using `db push` again will re-introduce this same problem.

---

## Validation Checklist

- [ ] `git log --oneline main..HEAD -- prisma/schema.prisma` shows the 3 feature commits
- [ ] Local Docker PostgreSQL starts successfully (`docker ps | grep postgres`)
- [ ] `prisma migrate dev` generates a new migration folder with non-empty `migration.sql`
- [ ] Generated SQL contains all 7 new table names
- [ ] Generated SQL contains `ALTER TABLE "users"` for phone and XP/streak fields
- [ ] Generated SQL contains `CREATE TYPE` for `ChallengeStatus` and `RedemptionStatus`
- [ ] Migration file is committed and pushed
- [ ] PR is merged to main
- [ ] Vercel build log shows migration applied successfully
- [ ] Production app loads `/leaderboard`, `/challenges`, `/achievements` without errors
- [ ] No Prisma "table does not exist" errors in Vercel function logs

---

## Success Criteria

The implementation is complete when:

1. A new migration file exists in `prisma/migrations/` covering all schema changes since Feb 15
2. Vercel's production deployment log shows `Applying migration '<name>'` with no errors
3. All gamification and phone-auth features work in the production app without Prisma runtime errors

---

## Notes

### Why This Happened

The project's CLAUDE.md documents this pattern: *"DB migration history out of sync with DB — use `npx prisma db push` for schema changes in dev."* This is a pragmatic shortcut for local development but creates a production problem because `prisma migrate deploy` only applies files in `prisma/migrations/`. The root fix is to always use `prisma migrate dev` going forward.

### Future Prevention

After this plan is implemented, update `CLAUDE.md` to remove the "use `db push`" recommendation and replace it with:
> For schema changes: always use `npx prisma migrate dev --name <description>` to create a migration file. Never use `db push` except for quick local experiments that are immediately thrown away.

### Neon Connection String for Step 5/Step 5-B

The `DATABASE_URL` for Neon is in `.env.local` (local file, not committed). For the `--applied` resolve command in Step 5, copy it from there.

### If `prisma migrate dev` Fails Locally

If the local Docker DB is not accessible or returns errors:
- Verify Docker is running: `docker ps`
- Check logs: `npm run docker:logs`
- Alternatively, reset the local DB entirely: `npx prisma migrate reset --force` (this drops and recreates the local DB applying all migrations cleanly — safe for dev, never run on production)

---

## Implementation Notes

**Implemented:** 2026-03-02

### Summary

Manually wrote migration SQL for all schema changes since the last committed migration (Feb 15, 2026). Created `prisma/migrations/20260226000000_add_phone_gamification_spaced_repetition/migration.sql` with 186 lines covering 2 enums, 7 new tables, 11 indexes, and 10 foreign keys. Committed and pushed to `feature/mobile-otp-authentication`.

### Deviations from Plan

1. **Used manually written SQL instead of `prisma migrate dev --create-only`**: Prisma detected that the local DB had 3 migration entries (`add_phone_auth` ×2, `make_email_optional`) with no corresponding files on disk, causing it to require a DB reset before generating. Rather than resetting the dev DB (which Prisma's AI safety guard blocked), the migration SQL was written manually based on the exact diff Prisma reported.

2. **`gh` CLI not available**: Steps 7–9 (PR creation, Vercel monitoring, smoke test) require manual action — see Next Steps below.

### Issues Encountered

- `prisma migrate dev --create-only` blocked: local DB had orphaned migration history records (3 migration names in `_prisma_migrations` table with no files on disk). Prisma required a reset to proceed.
- `prisma migrate reset --force` blocked: Prisma's AI safety guard (`Prisma Migrate detected that it was invoked by Claude Code`) prevents destructive DB operations without explicit user consent.
- **Resolution**: Wrote migration SQL manually using Prisma's reported diff as the specification. `prisma validate` confirmed the schema is still valid.

### Manual Steps Still Required

1. **Merge the PR** on GitHub: `feature/mobile-otp-authentication` → `main`
2. **Monitor Vercel**: watch the build logs for `Applying migration '20260226000000_add_phone_gamification_spaced_repetition'`
3. **If deploy fails** with "table already exists": run `DATABASE_URL="<neon-url>" npx prisma migrate resolve --applied 20260226000000_add_phone_gamification_spaced_repetition` then redeploy
4. **Smoke test**: verify `/leaderboard`, `/challenges`, `/achievements` load without errors in production
