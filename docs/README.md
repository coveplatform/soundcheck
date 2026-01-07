# MixReflect Developer Documentation

> MixReflect is a two-sided music feedback marketplace where artists submit tracks for structured reviews from genre-matched reviewers.

## Quick Start

### Prerequisites

- Node.js (project uses Next.js `16.x`, see `package.json`)
- PostgreSQL (Prisma datasource is `postgresql`, see `prisma/schema.prisma`)

### Install

```bash
npm install
```

### Configure environment

Copy the example env file:

```bash
cp .env.example .env
```

At minimum you’ll need:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

For payments/webhooks:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Database

```bash
npm run db:push
npm run db:seed
```

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Documentation Index

- `docs/ARCHITECTURE.md`
- `docs/DATA_MODELS.md`
- `docs/DEVELOPMENT.md`
- `docs/DEPLOYMENT.md`
- `docs/COMPONENTS.md`

### Features

- `docs/FEATURES/track-submission.md`
- `docs/FEATURES/review-system.md`
- `docs/FEATURES/payments.md`
- `docs/FEATURES/support.md`
- `docs/FEATURES/admin.md`

### API Reference

- `docs/API/overview.md`
- `docs/API/artist-endpoints.md`
- `docs/API/reviewer-endpoints.md`
- `docs/API/admin-endpoints.md`
- `docs/API/public-endpoints.md`

## Roles & Access Model

MixReflect stores roles as boolean flags on `User` (see `prisma/schema.prisma`):

- **Artist**: `User.isArtist = true` and has an `ArtistProfile`
- **Reviewer**: `User.isReviewer = true` and has a `ReviewerProfile`
- **Admin**: determined by email allowlist (`ADMIN_EMAILS` / `ADMIN_EMAIL`) in `src/lib/admin.ts`

Route protection is implemented in `middleware.ts` using a NextAuth JWT token.

## Key Entry Points

- **Auth config**: `src/lib/auth.ts`
- **DB client**: `src/lib/prisma.ts`
- **Queue/assignment**: `src/lib/queue.ts`
- **Stripe**: `src/lib/stripe.ts`, `src/app/api/webhooks/stripe/route.ts`

## Documentation Maintenance

**Last Updated:** 2026-01-07

**How to Update:**

- When adding a new API route, update `docs/API/*`.
- When changing Prisma models/enums, update `docs/DATA_MODELS.md`.
- When changing core flows (submission/assignment/reviews/payments), update `docs/FEATURES/*` and `docs/ARCHITECTURE.md`.
