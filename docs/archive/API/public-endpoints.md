# Public Endpoints

## [POST] /api/auth/signup

**Purpose:** Create a new user (credentials) and send email verification.

**Auth:** Public

**Implementation:** `src/app/api/auth/signup/route.ts`

## [POST] /api/auth/check-email

**Purpose:** Check whether an email is already registered.

**Auth:** Public

**Implementation:** `src/app/api/auth/check-email/route.ts`

## [POST] /api/auth/forgot-password

**Purpose:** Start password reset flow.

**Auth:** Public

**Implementation:** `src/app/api/auth/forgot-password/route.ts`

## [POST] /api/auth/reset-password

**Purpose:** Complete password reset.

**Auth:** Public

**Implementation:** `src/app/api/auth/reset-password/route.ts`

## [GET/POST] /api/auth/verify-email

**Purpose:** Verify email using a verification token.

**Auth:** Public

**Implementation:** `src/app/api/auth/verify-email/route.ts`

## [POST] /api/auth/resend-verification

**Purpose:** Resend email verification.

**Auth:** Public

**Implementation:** `src/app/api/auth/resend-verification/route.ts`

## [GET] /api/genres

**Purpose:** List available genres.

**Auth:** Public

**Implementation:** `src/app/api/genres/route.ts`

## [POST] /api/metadata

**Purpose:** Resolve track metadata via oEmbed-like logic.

**Auth:** Public

**Implementation:** `src/app/api/metadata/route.ts`

## [POST] /api/lead-capture

**Purpose:** Capture leads who are not ready to submit.

**Auth:** Public

**Implementation:** `src/app/api/lead-capture/route.ts`

## [POST] /api/get-feedback/create-account

**Purpose:** Create an account for the get-feedback funnel.

**Auth:** Public

**Implementation:** `src/app/api/get-feedback/create-account/route.ts`

## [POST] /api/get-feedback/submit

**Purpose:** Submit a track from the get-feedback funnel (can create profile and queue without Stripe).

**Auth:** Optional (supports logged-in and new user flows)

**Implementation:** `src/app/api/get-feedback/submit/route.ts`

## [POST] /api/get-feedback/upload-presign

**Purpose:** Presign an upload for get-feedback funnel uploads.

**Auth:** Public

**Implementation:** `src/app/api/get-feedback/upload-presign/route.ts`

## [GET] /api/queue

**Purpose:** Queue info (used for client polling/refresh in some flows).

**Auth:** Varies (inspect handler)

**Implementation:** `src/app/api/queue/route.ts`
