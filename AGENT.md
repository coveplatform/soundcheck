# AGENT.md — MixReflect (soundcheck)

> Quick reference for AI agents and developers. Read this before making changes.

## What This Is

**MixReflect** — music feedback SaaS. Every user both submits tracks for feedback AND reviews other tracks. Credits tie the two sides together: earn by reviewing, spend to get reviews on your own tracks.

Live at: `https://www.mixreflect.com`

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL via Prisma 7 |
| Auth | NextAuth.js 4 (credentials + Google OAuth) |
| Payments | Stripe (checkout + Connect + webhooks) |
| Storage | AWS S3 (track uploads, artwork) |
| Email | Resend + React Email |
| Error tracking | Sentry |
| Analytics | PostHog, Vercel Analytics, TikTok/Reddit pixels |
| AI | Anthropic SDK (available, integrated) |

---

## User Model

Every user is unified — they submit tracks and review others from the same account. There is no separate "artist" or "reviewer" signup. Under the hood the DB still has two profile tables (`ArtistProfile`, `ReviewerProfile`) that are both created on signup, but the UX treats them as one.

- **Admin**: email allowlist in `src/lib/admin.ts`
- Route protection in `middleware.ts`

---

## Live Navigation (what users actually see)

```
/dashboard              Main dashboard (tracks + review queue summary)
/tracks                 My tracks list
/tracks/[id]            Track detail + reviews
/tracks/[id]/request-reviews  Request reviews for a track
/tracks?view=insights   Analytics/insights
/submit                 Submit a track
/submit/checkout        Stripe checkout redirect
/submit/success         Post-payment success page
/review                 Review queue (claim tracks to review)
/review/[id]            Review form
/review/history         Past reviews submitted
/reviewers              Browse reviewers
/reviewers/[id]         Reviewer profile
/account                Settings, credit purchase
/support                Support tickets
```

---

## Route Quirks

- `/reviewer/review/[id]` → legacy redirect to `/review/[id]`. The review form now lives at `/review/[id]`.
- `/reviewer/` directory only contains the redirect — earnings page was removed.
- `/artist/` directory was removed entirely. All pages moved to clean paths (`/tracks/[id]`, `/reviewers/`, `/submit/*`).
- Business/earnings/sales pages and payout APIs were removed. DB fields preserved for historical data.
- API routes: `/api/profile` (artist), `/api/profile/reviewer`, `/api/welcome-seen`.

---

## Key Files

```
src/lib/
  auth.ts              # NextAuth config, JWT caching, role sync
  prisma.ts            # Prisma singleton
  queue.ts             # Core assignment logic, reviewer tier rules, genre matching
  email/               # Modular email system (split from monolithic email.ts)
    index.ts           # Re-exports all email functions
    templates.ts       # Shared HTML helpers, sendEmail(), brand constants
    auth.ts            # Password reset email
    reviews.ts         # Track queued, progress, intent, tier change, invalid link, release decision
    payments.ts        # Purchase confirmation email
    admin.ts           # Admin new track notification
    announcements.ts   # Blast/announcement emails
  metadata.ts          # URL detection, oEmbed, package definitions
  payments.ts          # Stripe helpers
  stripe.ts            # Stripe client
  dashboard-helpers.ts # Dashboard stats, "what's next" guidance
  analytics-helpers.ts # Feedback word analysis
  release-decision-report.ts # Report compilation

src/app/api/           # All API routes
src/app/(dashboard)/   # All protected pages (unified — no role split)
src/app/(admin)/       # Admin panel
middleware.ts          # Route protection, role checks
prisma/schema.prisma   # Source of truth for DB models
```

---

## Database — Key Models

- **User** — auth identity; `isArtist`/`isReviewer` booleans (both are true for all users)
- **ArtistProfile** — credits, earnings, genre prefs (one per user)
- **ReviewerProfile** — tier (NORMAL/PRO), earnings, flag count, daily limit (one per user)
- **Track** — submission; status: `UPLOADED → QUEUED → IN_PROGRESS → COMPLETED`
- **Review** — feedback record; has `reviewSchemaVersion` (1, 2, or 3)
- **ReviewQueue** — assignment rows linking reviewer ↔ track
- **Genre** — flat list with slug; hierarchy matching is in `queue.ts`

---

## Package Types (monetisation)

| Type | Model | Notes |
|---|---|---|
| `PEER` | Freemium — 1 credit per review | Active |
| `RELEASE_DECISION` | Expert panel — $9.95 cash | Active |
| `STARTER`, `STANDARD`, `PRO`, `DEEP_DIVE` | Legacy paid packages | Deprecated — keep in schema, old DB rows reference them |

---

## Review Schema Versions

| Version | Used for | Key fields |
|---|---|---|
| v1 | Legacy only (no active UI) | `bestPart`, `weakestPart`, `productionScore` |
| v2 | Active peer reviews | + technical checks, `qualityLevel`, `biggestWeaknessSpecific` |
| v3 | Release Decision | + `releaseVerdict`, `releaseReadinessScore`, `topFixRank1/2/3` |

**Derived fields** — inject scripts must match the form logic (see MEMORY.md):
- `productionScore` from `qualityLevel` enum
- `vocalScore`: 2 if vocals-buried, 4 otherwise, null if instrumental
- `originalityScore` = `firstImpressionScore`
- `quickWin` is **removed** — merged into `biggestWeaknessSpecific`

---

## Reviewer Tiering

- **NORMAL**: fewer than 100 reviews OR below 4.5 avg rating
- **PRO**: 100+ reviews AND 4.5+ avg rating
- Daily peer review limit: **2/day** (bypassed for admin emails)

---

## Inject Scripts Pattern

Scripts in `/scripts/` use Prisma directly. Always:
- Use `prisma.$transaction([...])` for create + update + deleteQueue
- Seed reviewers are `@seed.mixreflect.com` accounts
- Skip offsets per script to avoid overlap (check existing scripts first)
- Set `countsTowardCompletion: true`, `countsTowardAnalytics: true`, `reviewSchemaVersion: 3`
- Set track `status: COMPLETED` if `reviewsCompleted >= reviewsRequested`

---

## Common Gotchas

- **SoundCloud short URLs** (`on.soundcloud.com`) — resolved server-side at submission via `resolveShortUrl()` in `metadata.ts`
- **Bandcamp oEmbed** — unreliable; falls back to page scraping in `/api/metadata/route.ts`
- **Daily review limit** — enforced in `/api/reviews/claim` AND the queue page — keep both in sync
- **Legacy packages** — `STARTER`, `STANDARD`, `PRO`, `DEEP_DIVE` exist in `metadata.ts` `PACKAGES` object and Prisma enum; do not remove
- **email/** — modular email system; import from `@/lib/email` (resolves to index.ts re-exports)

---

## Running Locally

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, NEXTAUTH_*, STRIPE_*, etc.
npm run db:push
npm run dev                  # http://localhost:3000
```

## Testing

```bash
npm run test        # Vitest unit tests (watch)
npm run test:run    # Once
npm run test:e2e    # Playwright E2E
```

## Deployment

Push to `main` → Vercel auto-deploys.

```bash
npm run build   # prisma generate + next build
```
