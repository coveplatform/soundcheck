# Artist Endpoints

## [POST] /api/tracks

**Purpose:** Create a track in `PENDING_PAYMENT`.

**Auth:** Required

**Implementation:** `src/app/api/tracks/route.ts`

## [POST] /api/payments/checkout

**Purpose:** Create Stripe checkout session (or use free credit/bypass).

**Auth:** Required

**Implementation:** `src/app/api/payments/checkout/route.ts`

## [GET] /api/payments/checkout-status

**Purpose:** Poll checkout state and finalize if Stripe indicates paid.

**Auth:** Required

**Implementation:** `src/app/api/payments/checkout-status/route.ts`

## [POST] /api/tracks/[id]/cancel

**Purpose:** Cancel a track (artist side).

**Auth:** Required

**Implementation:** `src/app/api/tracks/[id]/cancel/route.ts`

## [POST] /api/tracks/[id]/update-source

**Purpose:** Update a track’s source URL/type.

**Auth:** Required

**Implementation:** `src/app/api/tracks/[id]/update-source/route.ts`

## [GET] /api/artist/profile

**Purpose:** Read artist profile.

**Auth:** Required

**Implementation:** `src/app/api/artist/profile/route.ts`

## [POST] /api/uploads/track

**Purpose:** Persist uploaded track metadata (after upload).

**Auth:** Required

**Implementation:** `src/app/api/uploads/track/route.ts`

## [POST] /api/uploads/track/presign

**Purpose:** Create an S3 presigned upload URL.

**Auth:** Required; email must be verified.

**Implementation:** `src/app/api/uploads/track/presign/route.ts`
