# Feature: Track Submission

## Overview

Artists submit a track and select a review package. Tracks are stored in Postgres and move through a lifecycle from payment to completion.

## User Flow

1. Artist visits submission page
   - UI: `src/app/(dashboard)/artist/submit/page.tsx`
2. Track is created in DB
   - API: `POST /api/tracks`
   - File: `src/app/api/tracks/route.ts`
   - Track created with `Track.status = PENDING_PAYMENT`
3. Artist completes payment (Stripe) or uses a free path
   - Paid checkout: `POST /api/payments/checkout` (`src/app/api/payments/checkout/route.ts`)
   - Free credit / dev bypass: handled inside checkout route
   - Get-feedback funnel (public): `POST /api/get-feedback/submit` (`src/app/api/get-feedback/submit/route.ts`)
4. Track enters review queue
   - When paid: webhook `POST /api/webhooks/stripe` finalizes payment and sets `Track.status = QUEUED`
   - Assignment runs: `assignReviewersToTrack(trackId)` (`src/lib/queue.ts`)

## Database Tables Involved

- `Track`
- `Payment` (paid checkouts)
- `Review` (created when reviewers are assigned)
- `ReviewQueue` (active assignments)

## Business Rules

- Track lifecycle enum is `TrackStatus` in `prisma/schema.prisma`:
  - `PENDING_PAYMENT` -> `QUEUED` -> `IN_PROGRESS` -> `COMPLETED` (or `CANCELLED`)
- Packages are defined in `src/lib/metadata.ts` (`PACKAGES`).
- Some flows can bypass Stripe in non-production by setting `BYPASS_PAYMENTS=true`.

## Related documentation

- Payments: `docs/FEATURES/payments.md`
- Review system: `docs/FEATURES/review-system.md`
