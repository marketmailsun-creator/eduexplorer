# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow

- Before making ANY changes, create a feature branch: `git checkout -b feature/<description>`
- Never commit directly to `main` or `release/*` branches
- Use descriptive branch names that indicate the change purpose (e.g. `feature/add-quiz-timer`, `feature/fix-auth-redirect`)
- Commit changes incrementally with clear, focused messages

## Commands

```bash
# Development
npm run dev              # Next.js with Turbopack
npm run dev:all          # Next.js + video worker together (concurrently)

# Build & Type checking
npm run build            # prisma generate + next build
npm run type-check       # tsc --noEmit
npm run lint             # next lint

# Testing
npm run test             # jest --watch
npm run test:ci          # jest --ci (no watch, for CI)

# Database
npm run db:migrate       # create + apply migration (USE THIS for all schema changes)
npm run db:migrate:deploy # apply pending migrations (runs automatically in vercel-build)
npm run db:push          # ⚠️  DEV ONLY: sync schema without a migration file — NEVER use for real changes
npm run db:studio        # Prisma Studio GUI

# Schema change workflow:
# 1. Edit prisma/schema.prisma
# 2. npm run db:migrate -- --name describe_your_change
# 3. Commit the generated prisma/migrations/TIMESTAMP_name/ folder alongside schema.prisma
# Vercel deployment runs `prisma migrate deploy` automatically (see vercel-build script).

# Docker (local dev infrastructure)
npm run docker:dev       # start PostgreSQL + Redis containers
npm run docker:down      # stop containers
npm run docker:logs      # tail container logs

# Video worker
npm run worker           # start Remotion video render worker
npm run worker:dev       # worker with hot reload
```

## Architecture Overview

EduExplorer is a **Next.js 16 App Router** PWA that turns learning queries into multi-format educational content. The core flow is:

1. **User submits a query** (text, image, PDF, or voice) → `POST /api/query/submit`
2. **Perplexity API** researches the topic → `src/lib/services/research.service.ts`
3. **Groq (Llama 3.1)** generates an article from the research → `src/lib/services/content.service.ts`
4. User can then generate supplemental content on-demand: flashcards, quizzes, diagrams, concept maps, audio, presentations

### Route Groups

- `src/app/(auth)/` — Public auth pages (login, signup, verify-email, forgot/reset password)
- `src/app/(dashboard)/` — Protected pages behind `auth()` check in `src/app/(dashboard)/layout.tsx`
- `src/app/api/` — All API routes; auth-protected routes call `auth()` from `src/auth.ts`
- `src/app/shared/[token]/` — Public view of shared content (no auth required)

### Key Services (`src/lib/services/`)

| File | Purpose |
|------|---------|
| `research.service.ts` | Perplexity `sonar` model for web-searched research; results cached 24h in Redis |
| `content.service.ts` | Groq `llama-3.1-8b-instant` generates the main article from research |
| `flashcard-generator.ts` | Claude API generates flashcard sets |
| `diagram-generator.ts` | Claude API generates Mermaid diagram definitions |
| `practice-questions-generator.ts` | Claude API generates quiz questions |
| `presentation-generator.ts` | Claude API generates slide content |
| `audio-summarizer.ts` | ElevenLabs TTS for narration |
| `content-moderation.service.ts` | Claude API moderates queries; runs for users under 18 or flagged keywords |
| `plan-limits.service.ts` | Enforces free/pro content generation quotas (`PLAN_LIMITS` object) |
| `email.service.ts` | Resend for transactional email (verification, password reset, reminders) |

Note: `_claude.ts`, `_google.ts`, `_clude.ts` suffix files are backup/alternative implementations, not active.

### Database (Prisma + PostgreSQL)

Schema at `prisma/schema.prisma`. Core data flow:
- `User` → `Query` → `ResearchData` (1:1) + `Content[]` (1:many by `contentType`)
- Content types stored in `Content.contentType`: `article`, `audio`, `flashcard`, `quiz`, `presentation`, `diagram`, `concept-map`
- `SavedContent` and `SavedQuery` are the library/bookmarks
- `StudyGroup` / `StudyGroupMember` / `GroupSharedContent` — social learning groups
- `SharedContent` (public share tokens) → `Comment[]` — public share + comment system
- `QuizScore` — leaderboard data
- `Subscription` + Razorpay fields on `User` — payment/plan tracking
- `PushSubscription` + `QuizReviewReminder` — Web Push notifications

### Auth (`src/auth.ts`)

NextAuth v5 (beta) with JWT strategy. Providers: Google OAuth + credentials. The JWT stores `id`, `plan`, and `age`. Session exposes these to client via `session.user`.

### Caching

Upstash Redis REST API (`src/lib/db/redis.ts`) — used for research result caching (24h TTL). Standard redis client is commented out; only `@upstash/redis` is active.

### Storage

Cloudflare R2 via AWS S3 SDK (`src/lib/storage/r2.ts`) — used for audio file storage.

### Plans & Limits

Two plans: `free` and `pro`. Limits enforced server-side in `plan-limits.service.ts`:
- Free: 1 audio, 1 presentation, 1 flashcard set, 1 quiz per topic
- Pro: 5 audio, unlimited presentations, 5 flashcard sets, unlimited quizzes; plus on-demand audio

### PWA

Service worker registered via `src/app/register-sw.tsx`. Push notifications handled through `src/components/pwa/`. Web Push VAPID keys required in env.

## Required Environment Variables

Copy `.env.example` to `.env.local`. Key vars:

```
DATABASE_URL            # PostgreSQL connection
UPSTASH_REDIS_REST_URL  # Upstash Redis (not standard redis)
UPSTASH_REDIS_REST_TOKEN

NEXTAUTH_SECRET         # Random secret (openssl rand -base64 32)
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET

PERPLEXITY_API_KEY      # For research queries
GROQ_API_KEY            # For article generation
ANTHROPIC_API_KEY       # For flashcards, diagrams, quizzes, moderation

ELEVENLABS_API_KEY      # TTS audio
RESEND_API_KEY          # Transactional email

RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET  # Payments

R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME / R2_PUBLIC_URL  # Storage

NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY  # Web Push
NEXT_PUBLIC_APP_URL     # Full URL (e.g. https://yourdomain.com)
```
