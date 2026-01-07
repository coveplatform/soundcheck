# Feature: Admin

## Overview

Admin pages and endpoints provide operational tools for managing users, tracks, reviewers, reviews, and support.

## Access control

Admin access is gated by email allowlist:

- Helper: `src/lib/admin.ts` (`isAdminEmail`)
- Env: `ADMIN_EMAILS` (comma-separated) or `ADMIN_EMAIL`

Additionally, `middleware.ts` enforces auth and blocks non-admin access to `/admin/*` and `/api/admin/*`.

## Key admin pages

Pages under `src/app/(admin)/admin/` include:

- Leads: `src/app/(admin)/admin/leads/page.tsx`
- Tracks: `src/app/(admin)/admin/tracks/page.tsx`
- Track detail: `src/app/(admin)/admin/tracks/[id]/page.tsx`
- Reviews: `src/app/(admin)/admin/reviews/page.tsx`
- Review detail: `src/app/(admin)/admin/reviews/[id]/page.tsx`
- Reviewers: `src/app/(admin)/admin/reviewers/page.tsx`
- Users: `src/app/(admin)/admin/users/page.tsx`
- Support: `src/app/(admin)/admin/support/page.tsx`

## Key admin endpoints

Examples:

- Refund a track:
  - `POST /api/admin/refund`
  - `src/app/api/admin/refund/route.ts`
- Restrict reviewer:
  - `POST /api/admin/reviewers/[id]/restrict`
  - `src/app/api/admin/reviewers/[id]/restrict/route.ts`
- Support ticket admin management:
  - `src/app/api/admin/support/tickets/*`

## Business rules

- Refunds are blocked once reviews have started (`IN_PROGRESS`/`COMPLETED`).
- Admin actions use Stripe server SDK for refunds where applicable.
