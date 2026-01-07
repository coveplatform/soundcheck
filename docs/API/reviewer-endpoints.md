# Reviewer Endpoints

## [GET/POST] /api/reviewer/profile

**Purpose:** Create/update reviewer profile (onboarding).

**Auth:** Required

**Implementation:** `src/app/api/reviewer/profile/route.ts`

## [POST] /api/reviews

**Purpose:** Submit a review.

**Auth:** Required; email must be verified; reviewer must be onboarded.

**Implementation:** `src/app/api/reviews/route.ts`

## [POST] /api/reviews/[id]/heartbeat

**Purpose:** Track listening time and update `listenDuration`.

**Auth:** Required

**Implementation:** `src/app/api/reviews/[id]/heartbeat/route.ts`

## [POST] /api/reviews/[id]/skip

**Purpose:** Skip a review assignment.

**Auth:** Required

**Implementation:** `src/app/api/reviews/[id]/skip/route.ts`

## [POST] /api/reviews/[id]/unplayable

**Purpose:** Mark a track as unplayable and trigger reassignment.

**Auth:** Required

**Implementation:** `src/app/api/reviews/[id]/unplayable/route.ts`

## [POST] /api/reviews/[id]/flag

**Purpose:** Flag a review.

**Auth:** Required

**Implementation:** `src/app/api/reviews/[id]/flag/route.ts`

## [POST] /api/reviews/[id]/gem

**Purpose:** Mark a review as a “gem” (quality signal).

**Auth:** Required

**Implementation:** `src/app/api/reviews/[id]/gem/route.ts`

## [POST] /api/reviewer/payouts

**Purpose:** Request a payout.

**Auth:** Required; email must be verified.

**Implementation:** `src/app/api/reviewer/payouts/route.ts`

## [POST] /api/reviewer/stripe/connect

**Purpose:** Start Stripe Connect onboarding.

**Auth:** Required

**Implementation:** `src/app/api/reviewer/stripe/connect/route.ts`

## [GET] /api/reviewer/stripe/dashboard

**Purpose:** Get Stripe Express dashboard link.

**Auth:** Required

**Implementation:** `src/app/api/reviewer/stripe/dashboard/route.ts`
