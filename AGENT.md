# AGENT.md — MixReflect (soundcheck)

> Quick reference for AI agents and developers. Read this before making changes.

## What This Is

**MixReflect** — an AI + human music feedback product. An artist submits a track URL (or upload) and gets an instant **release verdict** (not ready / needs work / almost there / release ready) backed by a measured analysis, plus a paid "room of 5" real human listeners and a deep read.

> ⚠️ **The product cut over to the Score / Verdict model on 2026-06-09 and repositioned to verdict-first on 2026-06-25.** Many sections further down describe **MixReflect Classic** (the peer-to-peer, review-to-earn-credits app) which is **decommissioned**. Treat Classic details (credits, slots, `/tracks`, `/submit`, the peer review queue, slot model) as **legacy** unless you're touching shared infra (auth, Stripe, Prisma, email). The live product is the **Score / Verdict** section immediately below. See also `docs/decision-report-migration.md`.

Live at: `https://www.mixreflect.com`

---

## Score / Verdict Product (CURRENT — this is the live product)

A track URL → instant measured read → a **verdict-first decision report**, with a paid human "room of 5" and deep read.

### Funnel / auth
- **Landing** (`src/app/page.tsx`): paste a link → `/api/score/start` kicks generation in the background → ~18s "analysis theater" → the **done modal reveals the real verdict** (ladder + score) *then* asks for an account. The full read opens only after the report is claimed (preserves the free-tier economics).
- **Auth is in-context everywhere** via the global modal — `useAuthModal()` from `@/components/providers` (`src/components/auth/auth-modal.tsx`). The hero, report subscribe, sealed paywall, and `/submit-score` all pop the panel instead of bouncing to a page. Email path creates the account then signs in; Google works too.
- After auth → `/score/finish` claims the anonymous report (single-use `claimToken`) → `/report/[slug]`.
- **`/submit-score`** = the signed-in "submit another track" surface; gated client-side by popping the auth modal (not middleware).
- **`/login` + `/signup`** (`(auth)` route group) are **fallback-only** (server redirects, deep links, password reset) — restyled to the black/`#6ee7ff` score aesthetic; they honor `callbackUrl`.

### Free-tier ladder (`src/lib/score-free-tier.ts`, `FREE_FULL_READ=true`)
1. First report **free for life** (one per email) — full AI read opens after claim.
2. Track 2+ generates but renders **sealed**; `$6.95` unlock opens it + the room.
3. `$19.95/mo` unlimited — auto-unlock; human room on **3 tracks per cycle** (`SCORE_ROOM_CAP=3`).

### The report (`src/app/(public)/report/[id]/page.tsx`)
- Renders **`VerdictReportView` for every valid report** (verdict-first). New reports carry a measured **release bar** (`buildReleaseBar`/`buildVerdictPayload` in `src/lib/score-verdict.ts`); older ones show the same layout with the bar omitted and blockers derived from stored priority fixes.
- Verdict label from score bands (`verdictForScore`), capped **down only** by measured blockers (`deriveVerdict`).

### Scoring engine (`src/lib/score-engine.ts`)
- Two-pass: findings → graded median dims, plus a **listen pass** (`src/lib/score-listen.ts`) that hears the opening and classifies genre + **track type** (song/instrumental/beat/ambient/interlude/experimental).
- **Track-type-adaptive weights** (`WEIGHTS_BY_TYPE`): an instrumental isn't judged on vocals, ambient isn't judged on a hook. Genre norms in `src/lib/genre-norms.ts` are all `estimated` until a measured corpus exists.

### Room of 5 (`src/lib/score-review.ts`)
Real human reviewers (`isScoreReviewer` users). **Claim-pool model** — paying marks the track available and reviewers pull/claim it (no push-assignment). `SCORE_ROOM_CAP=3` per unlimited cycle.

### Audio worker
`AUDIO_WORKER_URL` (Render) produces the DSP features the release bar needs. **Prod-only** — it's `http://127.0.0.1:8090` in `.env.local`, so the worker is NOT reachable/testable from a local checkout (analysis returns null locally).

### Key Score files
- `src/app/page.tsx` — landing + reveal/auth funnel
- `src/app/(public)/report/[id]/page.tsx` — report render gate
- `src/components/score/verdict-report-view.tsx` — verdict report UI
- `src/components/score/sealed-paywall.tsx` — the hard pay wall
- `src/lib/{score-engine,score-listen,score-verdict,genre-norms,score-free-cap,score-review}.ts`
- `src/app/api/score/{start,submit,sealed-checkout,subscribe,claim,[id]/unlock,[id]/status,[id]/generate}/route.ts`
- `src/lib/track-url.ts` — URL gating, incl. `isPrivateSoundcloudUrl` (private SC links rejected at all 3 ingestion routes)
- `scripts/_check-latest-report.ts` — read-only report/room health monitor (`npx tsx scripts/_check-latest-report.ts 10`)

### Known open issues (Score) — as of 2026-06-26
- **The room of 5 doesn't deliver.** Claim-pool: paying marks a track available but reviewers must claim it, and they aren't — recent *paid* reports show 0 seats despite ~11 real reviewers. Paying customers get the AI read and **zero human reactions**. Decide: push-assignment (`assignScoreReviewers` exists) vs. fixing the claim surface. Respect `SCORE_ROOM_CAP=3`.
- **Old reports lack a measured release bar** (predate the 2026-06-25 feature). They render the verdict layout without the bar; a prod regen would backfill it (worker is prod-only).
- **Subscription back-unlock leaves sealed backlog ungenerated** — `paidAt` is set on all of a subscriber's reports but only the `fromReport` generates, so sealed backlog tracks can sit `PENDING`.

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
/account                Settings
/pro                    Pro subscription pricing + upgrade
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
  slots.ts             # Slot constants (FREE_MAX_SLOTS=1, PRO_MAX_SLOTS=3), helpers
  email/               # Modular email system (split from monolithic email.ts)
    index.ts           # Re-exports all email functions
    templates.ts       # Shared HTML helpers, sendEmail(), brand constants
    auth.ts            # Password reset email
    reviews.ts         # Track queued, progress, intent, tier change, invalid link
    payments.ts        # Purchase confirmation email
    admin.ts           # Admin new track notification
    announcements.ts   # Blast/announcement emails
  metadata.ts          # URL detection, oEmbed, package definitions
  payments.ts          # Stripe helpers
  stripe.ts            # Stripe client
  dashboard-helpers.ts # Dashboard stats, "what's next" guidance
  analytics-helpers.ts # Feedback word analysis

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

## Slot Model (monetisation)

Free users get **1 concurrent review slot**, Pro subscribers get **3**. A slot is occupied when a track has status `QUEUED`, `IN_PROGRESS`, or `PENDING_PAYMENT`. Slot enforcement lives in `src/lib/slots.ts` and is checked in `/api/tracks` POST and `/api/tracks/[id]/request-reviews` POST.

**Credits** still work: 1 credit = 1 review. Earn by reviewing others. No more buying credit packs.

**Pro subscription** ($9.99/month or $79.99/year):
- 3 concurrent review slots
- Priority queue placement (Pro tracks appear first in review queue)
- Pro badge
- Early access to new features

Stripe Price IDs configured via env vars (see below). Subscription lifecycle handled by webhook (`customer.subscription.created/updated/deleted`).

### Package Types

| Type | Model | Notes |
|---|---|---|
| `PEER` | Freemium — 1 credit per review | Active |
| `STARTER`, `STANDARD`, `PRO`, `DEEP_DIVE` | Legacy paid packages | Deprecated — keep in schema, old DB rows reference them |

### Removed Features (do not re-add)

- Credit pack purchases (`/api/review-credits/checkout` — deleted)
- PRO reviewer add-on (`requestedProReviewers` — deprecated field)
- Rush delivery (`rushDelivery`, `rushDeliveryDeadline` — deprecated fields)
- Checkout add-ons (`/api/tracks/[id]/checkout-addons` — deleted)
- Rush delivery cron (`/api/cron/check-rush-delivery` — deleted)

---

## Review Schema Versions

| Version | Used for | Key fields |
|---|---|---|
| v1 | Legacy only (no active UI) | `bestPart`, `weakestPart`, `productionScore` |
| v2 | Active peer reviews | + technical checks, `qualityLevel`, `biggestWeaknessSpecific` |
| v3 | Extended peer reviews | + `topFixRank1/2/3`, `strongestElement`, `biggestRisk` |

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

## Env Vars (subscription-specific)

```
STRIPE_PRO_MONTHLY_PRICE_ID   # Stripe Price ID for Pro monthly ($9.99)
STRIPE_PRO_YEARLY_PRICE_ID    # Stripe Price ID for Pro yearly ($79.99)
```

Also needs existing `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

Stripe webhook must listen for: `checkout.session.completed`, `checkout.session.expired`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.

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
