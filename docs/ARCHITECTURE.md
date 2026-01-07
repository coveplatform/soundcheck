# Architecture

## Overview

MixReflect is a two-sided marketplace:

- **Artists** submit tracks for feedback and pay for review packages.
- **Reviewers** complete onboarding, receive assigned tracks, and submit structured reviews for payout.

The app is a **Next.js App Router** application:

- **Framework**: Next.js (see `package.json`)
- **DB**: PostgreSQL via Prisma (`prisma/schema.prisma`, `src/lib/prisma.ts`)
- **Auth**: NextAuth (`src/lib/auth.ts`) with JWT sessions
- **Payments**: Stripe Checkout + Stripe webhooks
- **Email**: Resend via HTTP (`src/lib/email.ts`)
- **Uploads**: Optional S3-compatible presigned uploads (`src/app/api/uploads/track/presign/route.ts`)
- **Cron**: Vercel cron -> internal API route (`vercel.json`, `src/app/api/cron/expire-queue/route.ts`)

## Request / Routing Model

### App Router pages

UI lives in `src/app/**/page.tsx`.

Key groupings:

- Public:
  - `src/app/page.tsx`
  - `src/app/(public)/get-feedback/page.tsx`
- Auth:
  - `src/app/(auth)/login/page.tsx`
  - `src/app/(auth)/signup/page.tsx`
  - `src/app/(auth)/verify-email/page.tsx`
- Dashboard:
  - Artist: `src/app/(dashboard)/artist/*`
  - Reviewer: `src/app/(dashboard)/reviewer/*`
- Admin:
  - `src/app/(admin)/admin/*`

### API routes

Server endpoints live in `src/app/api/**/route.ts`.

## Authentication & Authorization

### NextAuth

- Config: `src/lib/auth.ts`
- Session strategy: JWT (`session.strategy = "jwt"`)

The JWT/session includes:

- `session.user.id`
- `session.user.isArtist`
- `session.user.isReviewer`
- `session.user.artistProfileId`
- `session.user.reviewerProfileId`
- `session.user.emailVerified`

### Middleware protection

Route access enforcement is in `middleware.ts`:

- Protects:
  - `/artist/*`
  - `/reviewer/*`
  - `/account/*`
  - `/admin/*`
  - `/api/admin/*`
- Admin access: email allowlist via `src/lib/admin.ts` (`ADMIN_EMAILS` / `ADMIN_EMAIL`)
- Artist/reviewer dashboard access is gated by the presence of the corresponding profile id in the JWT token (with a special-case allowance for checkout success flow).

### Email verification

Email verification is not required to log in, but is required for sensitive actions.

Examples (verified in code):

- Review submission requires verified email: `src/app/api/reviews/route.ts` (403)
- Upload presign requires verified email: `src/app/api/uploads/track/presign/route.ts` (403)
- Payout request requires verified email: `src/app/api/reviewer/payouts/route.ts` (403)

## Core Domain Flows

### Artist submit -> pay -> queue

Primary paid path:

1. Track created in `PENDING_PAYMENT`
   - API: `src/app/api/tracks/route.ts`
2. Checkout session created
   - API: `src/app/api/payments/checkout/route.ts`
   - Payment row written: `Payment(status=PENDING)`
3. Payment settled
   - Webhook: `src/app/api/webhooks/stripe/route.ts` handles `checkout.session.completed`
   - Finalizes payment and queues track (`Track.status = QUEUED`) via `finalizePaidCheckoutSession` in `src/lib/payments.ts`
4. Reviewer assignment
   - `assignReviewersToTrack(trackId)` in `src/lib/queue.ts`
5. UX hardening: success page polling
   - API: `src/app/api/payments/checkout-status/route.ts`
   - If webhook delay occurs, this endpoint can finalize if Stripe session shows paid.

Free paths:

- **Get-feedback (public)** flow can create an account + submit a track and immediately queue it without a Stripe checkout:
  - `src/app/api/get-feedback/submit/route.ts`

### Reviewer onboarding -> queue -> review submission

- Queue page (server-side) is `src/app/(dashboard)/reviewer/queue/page.tsx`.
- Queue assignment entries are stored in `ReviewQueue`.

Review work lifecycle is tracked on `Review.status`:

- `ASSIGNED` -> `IN_PROGRESS` -> `COMPLETED`
- terminal/escape statuses: `EXPIRED`, `SKIPPED`

Listen tracking is tracked on `Review.listenDuration` and `Review.lastHeartbeat`.

### Queue expiration + reassignment

- Cron route: `src/app/api/cron/expire-queue/route.ts`
- Implementation: `expireAndReassignExpiredQueueEntries()` in `src/lib/queue.ts`
- Scheduler: `vercel.json` triggers `/api/cron/expire-queue` daily.

### Payouts

- Endpoint: `src/app/api/reviewer/payouts/route.ts`
- Funds are moved using Stripe transfers to the reviewer’s `stripeAccountId`.
- The endpoint uses a DB transaction to reserve funds by decrementing `ReviewerProfile.pendingBalance`.

## External Integrations

### Stripe

- Server SDK: `stripe`
- Config helper: `src/lib/stripe.ts`
- Webhook handler: `src/app/api/webhooks/stripe/route.ts`

Required env vars:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Optional: `STRIPE_CURRENCY`

### Resend (Email)

- Sending implemented via HTTP `fetch` to Resend API in `src/lib/email.ts`.

Required env vars:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (or `RESEND_FROM`)

### Uploads (S3-compatible)

- Presign endpoint: `src/app/api/uploads/track/presign/route.ts`

Required env vars:

- `UPLOADS_S3_REGION`
- `UPLOADS_S3_ACCESS_KEY_ID`
- `UPLOADS_S3_SECRET_ACCESS_KEY`
- `UPLOADS_S3_BUCKET`
- `UPLOADS_PUBLIC_BASE_URL`
- Optional: `UPLOADS_S3_ENDPOINT`

## Analytics / Observability

- PostHog rewrite config in `next.config.ts`
- Vercel Analytics provider in `src/app/layout.tsx`
- Sentry is configured via `next.config.ts` (wrapped with `withSentryConfig` when `NEXT_PUBLIC_SENTRY_DSN` is set)
