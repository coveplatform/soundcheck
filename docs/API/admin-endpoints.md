# Admin Endpoints

Admin endpoints are under `/api/admin/*`.

Access is gated by:

- `middleware.ts` for `/api/admin/*`
- `isAdminEmail` checks inside handlers (`src/lib/admin.ts`)

## [POST] /api/admin/refund

**Purpose:** Refund a track payment and cancel the track.

**Auth:** Admin-only

**Implementation:** `src/app/api/admin/refund/route.ts`

## [POST] /api/admin/reviewers/[id]/restrict

**Purpose:** Restrict a reviewer account.

**Auth:** Admin-only

**Implementation:** `src/app/api/admin/reviewers/[id]/restrict/route.ts`

## [POST] /api/admin/tracks/[id]/cancel

**Purpose:** Cancel a track (admin).

**Auth:** Admin-only

**Implementation:** `src/app/api/admin/tracks/[id]/cancel/route.ts`

## [POST] /api/admin/tracks/[id]/notify-invalid-link

**Purpose:** Notify artist about invalid link.

**Auth:** Admin-only

**Implementation:** `src/app/api/admin/tracks/[id]/notify-invalid-link/route.ts`

## [POST] /api/admin/tracks/[id]/grant-free

**Purpose:** Grant free credit / adjust track/payment state.

**Auth:** Admin-only

**Implementation:** `src/app/api/admin/tracks/[id]/grant-free/route.ts`

## [POST] /api/admin/users/[id]/verify-email

**Purpose:** Mark a user as email verified.

**Auth:** Admin-only

**Implementation:** `src/app/api/admin/users/[id]/verify-email/route.ts`

## [POST] /api/admin/users/[id]/enable-reviewer

**Purpose:** Enable reviewer access for a user.

**Auth:** Admin-only

**Implementation:** `src/app/api/admin/users/[id]/enable-reviewer/route.ts`

## [POST] /api/admin/backfill-share-ids

**Purpose:** Backfill missing review share IDs.

**Auth:** Admin-only

**Implementation:** `src/app/api/admin/backfill-share-ids/route.ts`

## Admin support endpoints

- `src/app/api/admin/support/tickets/route.ts`
- `src/app/api/admin/support/tickets/[id]/route.ts`
- `src/app/api/admin/support/tickets/[id]/messages/route.ts`
