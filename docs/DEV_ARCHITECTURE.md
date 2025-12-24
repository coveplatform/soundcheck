# MixReflect Developer Architecture

## Overview

MixReflect is a two-sided marketplace:

- **Artists** submit tracks and purchase review packages.
- **Reviewers** complete onboarding, receive assigned reviews, and get paid per completed review.

The codebase is a **Next.js App Router** application with:

- **Auth**: NextAuth (sessions + role flags on the user)
- **DB**: PostgreSQL via Prisma
- **Payments**: Stripe Checkout (artist payments) + Stripe Connect (reviewer payouts)
- **Email**: Resend
- **Uploads**: S3-compatible presigned upload (optional) with local fallback
- **Cron**: Vercel cron hitting internal API routes

---

## Key Domains & Data Model

### Users
- `User`
  - flags: `isArtist`, `isReviewer`
  - `emailVerified` gates sensitive actions

### Artist side
- `ArtistProfile`
- `Track`
  - lifecycle: `PENDING_PAYMENT` -> `QUEUED` -> `IN_PROGRESS` -> `COMPLETED`
  - includes `packageType`, `reviewsRequested`, `reviewsCompleted`

### Reviewer side
- `ReviewerProfile`
  - `tier`: `NORMAL` | `PRO`
  - quality signals: `averageRating`, `totalReviews`, `gemCount`, `flagCount`
  - payout balances: `pendingBalance`, `totalEarnings`

### Reviews
- `Review`
  - lifecycle: `ASSIGNED` -> `IN_PROGRESS` -> `COMPLETED` (or `EXPIRED`/`SKIPPED`)
  - stores structured feedback fields + `paidAmount`

### Payments
- `Payment`
  - `stripeSessionId` (Checkout session)
  - status: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`

### Payouts
- `Payout`
  - created when a reviewer withdraws funds via Stripe Connect

---

## Core Runtime Flows

## 1) Artist Submit + Pay + Queue

1. **Track creation**
   - UI: `src/app/(dashboard)/artist/submit/page.tsx`
   - API: `src/app/api/tracks/route.ts`
   - Creates `Track` in `PENDING_PAYMENT`

2. **Stripe Checkout session**
   - UI: `src/app/(dashboard)/artist/submit/checkout/page.tsx`
   - API: `src/app/api/payments/checkout/route.ts`
   - Creates `Payment(status=PENDING)` + redirects to Stripe

3. **Payment settlement**
   - Webhook: `src/app/api/webhooks/stripe/route.ts`
   - On `checkout.session.completed`:
     - `Payment.status=COMPLETED`
     - `Track.status=QUEUED`, set `paidAt`
     - increment artist stats
     - assign reviewers

4. **Success page verification (UX hardening)**
   - UI: `src/app/(dashboard)/artist/submit/success/page.tsx`
   - API: `src/app/api/payments/checkout-status/route.ts`
   - The page polls until payment is confirmed.
   - If webhook is delayed, the status endpoint can idempotently finalize the track once Stripe reports `payment_status=paid`.

---

## 2) Reviewer Onboarding + Queue + Review

1. **Onboarding**
   - UI: `src/app/(dashboard)/reviewer/onboarding/page.tsx`
   - API: `src/app/api/reviewer/profile/route.ts`

2. **Queue**
   - UI: `src/app/(dashboard)/reviewer/queue/page.tsx`
   - Server-side fetches assigned reviews

3. **Complete review**
   - UI: `src/app/(dashboard)/reviewer/review/[id]/page.tsx`
   - API: `src/app/api/reviews/route.ts`
   - Validations:
     - 3+ minute listen requirement
     - minimum word count + anti-filler checks
     - required next actions

4. **Payout accrual**
   - On completion:
     - `Review.paidAmount` set from tier rate
     - reviewer balances increment

---

## 3) Assignment & Tiering

### Assignment
- Core logic: `src/lib/queue.ts`
- Guarantees:
  - Package specifies PRO slots (Starter 0, Standard 2, Pro 5)
  - Assignment reserves PRO slots and does not backfill them with NORMAL if PRO supply is missing

### Reviewer tiers
- `NORMAL` -> `PRO` if:
  - (`totalReviews >= 50` AND `averageRating >= 4.7`) OR `gemCount >= 10`

---

## Cron / Background Jobs

### Queue expiration
- Route: `src/app/api/cron/expire-queue/route.ts`
- Trigger: `vercel.json` cron
- Auth: `x-vercel-cron: 1` or secret header / bearer

---

## Environment Variables (high-level)

### Core
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

### Stripe
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Optional: `STRIPE_CURRENCY`

### Email (Resend)
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (or `RESEND_FROM`)

### Cron
- `CRON_SECRET`

### Uploads (optional)
- `UPLOADS_S3_REGION`
- `UPLOADS_S3_ACCESS_KEY_ID`
- `UPLOADS_S3_SECRET_ACCESS_KEY`
- `UPLOADS_S3_BUCKET`
- `UPLOADS_PUBLIC_BASE_URL`
- `UPLOADS_S3_ENDPOINT` (optional)

---

## Project Structure (where to look)

- `src/app/…` App Router pages + API routes
- `src/lib/…` core services (auth, prisma, stripe, queue, email)
- `prisma/schema.prisma` authoritative data model
- `docs/…` operational and product documentation
