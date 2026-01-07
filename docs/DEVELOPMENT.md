# Development

## Local setup

### Install

```bash
npm install
```

### Environment variables

Copy:

```bash
cp .env.example .env
```

See `docs/DEPLOYMENT.md` for a full env var list.

### Database

This repo uses Prisma with Postgres (`prisma/schema.prisma`).

```bash
npm run db:push
npm run db:seed
```

### Run the dev server

```bash
npm run dev
```

## Useful scripts

From `package.json`:

- `npm run dev` - Next.js dev server (webpack)
- `npm run dev:turbo` - Next.js dev server (turbopack)
- `npm run build` - Prisma generate + Next build
- `npm run lint` - ESLint
- `npm run test` - Vitest (watch)
- `npm run test:run` - Vitest (CI)
- `npm run db:studio` - Prisma Studio

## Seeding

Seed script: `prisma/seed.ts`

It upserts a curated list of `Genre` rows.

## Dev-only toggles

- `BYPASS_PAYMENTS=true` (non-production only)
  - Used in queue assignment / payouts / checkout to allow local testing without Stripe.
  - References:
    - `src/app/api/payments/checkout/route.ts`
    - `src/lib/queue.ts`
    - `src/app/api/reviewer/payouts/route.ts`

## Working with email

Email is sent using Resend in `src/lib/email.ts`.

- In production, missing email config can hard-fail some routes (e.g. signup requires email).
- In dev, some flows print verification links to console when email is not configured.

## Common debugging tips

- DB connection issues:
  - Check `DATABASE_URL` (or `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` / `POSTGRES_URL`) referenced by `src/lib/prisma.ts`.
- Auth issues:
  - Confirm `NEXTAUTH_URL` and `NEXTAUTH_SECRET`.
  - `middleware.ts` enforces dashboard/admin access.
