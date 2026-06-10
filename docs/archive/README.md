# MixReflect Developer Documentation

> Two-sided music feedback SaaS. Artists submit tracks, genre-matched reviewers give structured feedback.
> Live at: https://www.mixreflect.com

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run db:push
npm run db:seed
npm run dev          # http://localhost:3000
```

Minimum required env vars: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`

For payments: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

## Documentation

| File | What it covers |
|---|---|
| `AGENT.md` (root) | Quick reference for AI agents — patterns, gotchas, schema notes |
| `docs/ARCHITECTURE.md` | System design, data flow diagrams |
| `docs/DATA_MODELS.md` | Prisma schema walkthrough |
| `docs/DEVELOPMENT.md` | Local dev setup, testing, DB commands |
| `docs/DEPLOYMENT.md` | Vercel deployment, env vars, Sentry |
| `docs/COMPONENTS.md` | UI component library |
| `docs/FEATURES/track-submission.md` | Track submission flow |
| `docs/FEATURES/review-system.md` | Review assignment, tiers, schema versions |
| `docs/FEATURES/payments.md` | Stripe integration, credit system |
| `docs/FEATURES/support.md` | Support ticket system |
| `docs/FEATURES/admin.md` | Admin panel capabilities |
| `docs/API/overview.md` | API conventions |
| `docs/API/artist-endpoints.md` | Artist-facing API routes |
| `docs/API/reviewer-endpoints.md` | Reviewer-facing API routes |
| `docs/API/admin-endpoints.md` | Admin API routes |
| `docs/API/public-endpoints.md` | Public/unauthenticated routes |

## Roles

- **Artist** — `User.isArtist = true` + `ArtistProfile`. Submits tracks, spends/earns credits.
- **Reviewer** — `User.isReviewer = true` + `ReviewerProfile`. Tier: `NORMAL` or `PRO`.
- **Admin** — email allowlist in `src/lib/admin.ts`.
- Users can hold both roles simultaneously.

## Key Entry Points

| Concern | File |
|---|---|
| Auth config | `src/lib/auth.ts` |
| DB client | `src/lib/prisma.ts` |
| Queue & assignment | `src/lib/queue.ts` |
| Email | `src/lib/email.ts` |
| Payments / Stripe | `src/lib/stripe.ts`, `src/lib/payments.ts` |
| URL metadata | `src/lib/metadata.ts` |
| Stripe webhooks | `src/app/api/webhooks/stripe/route.ts` |
| Route protection | `middleware.ts` |

## Active Package Types

| Type | Model | Price |
|---|---|---|
| `PEER` | Freemium — 1 credit per review | Free (credits earned by reviewing) |
| `RELEASE_DECISION` | Expert panel — 10-12 PRO reviewers | $9.95 cash |

Legacy packages (`STARTER`, `STANDARD`, `PRO`, `DEEP_DIVE`) exist in the DB for old orders — do not remove from schema.

## Review Schema Versions

- **v1** — legacy, DB only, no active UI
- **v2** — active peer review form (technical analysis + structured feedback)
- **v3** — Release Decision form (adds verdict, readiness score, top fixes)

See `AGENT.md` for derived field rules used in inject scripts.

## Last Updated

2026-02-21
