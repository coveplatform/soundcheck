# Feature: Review System

## Overview

Reviewers receive assigned tracks, listen, and submit structured feedback. The platform enforces minimum listen time and text quality checks.

## User Flow

1. Reviewer completes onboarding
   - UI: `src/app/(dashboard)/reviewer/onboarding/page.tsx`
   - API: `POST /api/reviewer/profile` (`src/app/api/reviewer/profile/route.ts`)
2. Reviewer opens queue
   - UI: `src/app/(dashboard)/reviewer/queue/page.tsx`
   - Data is read from `ReviewQueue` via `src/lib/queue.ts`.
3. Reviewer opens an assigned review
   - UI: `src/app/(dashboard)/reviewer/review/[id]/page.tsx`
4. Client sends heartbeats while listening
   - API: `POST /api/reviews/[id]/heartbeat`
   - File: `src/app/api/reviews/[id]/heartbeat/route.ts`
   - Updates `Review.listenDuration` and can transition status to `IN_PROGRESS`.
5. Reviewer submits the review
   - API: `POST /api/reviews`
   - File: `src/app/api/reviews/route.ts`

## Database Tables Involved

- `Review`
- `ReviewQueue`
- `Track` (review counts + completion)
- `ReviewerProfile` (earnings, tier, restrictions)

## Business Rules

Verified by `src/app/api/reviews/route.ts`:

- Requires authentication.
- Requires `User.emailVerified`.
- Requires reviewer onboarding completion.
- Enforces minimum listen duration (`MIN_LISTEN_SECONDS = 180`).
- Enforces minimum text quality for some sections (word count + uniqueness + “specific signals”).

## Completion mechanics

When reviews are submitted, the system updates:

- `Review.status = COMPLETED`
- reviewer earnings + tiering (`src/lib/queue.ts`)
- track progress (`Track.reviewsCompleted` and `Track.status` transitions)

## Related documentation

- Queue/assignment details: `src/lib/queue.ts`
- Payouts: `docs/FEATURES/payments.md`
