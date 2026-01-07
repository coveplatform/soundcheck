# Deployment

## Overview

This project is designed to run on Vercel (cron + Next.js App Router). See `vercel.json` for scheduled jobs.

## Environment Variables

This list is derived from `.env.example` plus code references in `src/`.

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | Postgres connection string |
| NEXTAUTH_URL | Yes | Public app URL (used by NextAuth and links) |
| NEXTAUTH_SECRET | Yes | Secret used by NextAuth JWT |
| ADMIN_EMAILS / ADMIN_EMAIL | Yes (for admin access) | Comma-separated allowlist for admin routes (`src/lib/admin.ts`) |
| STRIPE_SECRET_KEY | Yes (if payments enabled) | Stripe secret key (`src/lib/stripe.ts`) |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Yes (if payments enabled) | Stripe publishable key for client |
| STRIPE_WEBHOOK_SECRET | Yes (if webhooks enabled) | Stripe webhook signing secret |
| STRIPE_CURRENCY | No | Overrides Stripe currency (defaults to platform currency) |
| RESEND_API_KEY | Yes (if email enabled) | Resend API key (`src/lib/email.ts`) |
| RESEND_FROM_EMAIL / RESEND_FROM | Yes (if email enabled) | Email sender identity |
| ADMIN_NOTIFICATION_EMAIL | No | Destination for admin notifications (`src/lib/email.ts`) |
| CRON_SECRET | Recommended | Secret for cron route auth (`src/app/api/cron/expire-queue/route.ts`) |
| NEXT_PUBLIC_POSTHOG_KEY | No | PostHog client key |
| NEXT_PUBLIC_POSTHOG_HOST | No | PostHog host |
| NEXT_PUBLIC_CLARITY_PROJECT_ID | No | MS Clarity project id |
| NEXT_PUBLIC_TIKTOK_PIXEL_ID | No | TikTok pixel id |
| NEXT_PUBLIC_SENTRY_DSN | No | Enables Sentry wrapping (`next.config.ts`) |
| SENTRY_ORG | No | Sentry org (`next.config.ts`) |
| SENTRY_PROJECT | No | Sentry project (`next.config.ts`) |
| NEXT_PUBLIC_SITE_URL | No | Used for metadata base + OG tags (`src/app/layout.tsx`) |
| UPLOADS_S3_REGION | No (required for cloud uploads) | Upload region (`src/app/api/uploads/track/presign/route.ts`) |
| UPLOADS_S3_ACCESS_KEY_ID | No (required for cloud uploads) | Upload access key |
| UPLOADS_S3_SECRET_ACCESS_KEY | No (required for cloud uploads) | Upload secret |
| UPLOADS_S3_BUCKET | No (required for cloud uploads) | Bucket for uploads |
| UPLOADS_PUBLIC_BASE_URL | No (required for cloud uploads) | Public base for uploaded file URLs |
| UPLOADS_S3_ENDPOINT | No | Optional custom S3 endpoint (S3-compatible providers) |
| GOOGLE_CLIENT_ID | No | Enables Google OAuth provider (`src/lib/auth.ts`) |
| GOOGLE_CLIENT_SECRET | No | Enables Google OAuth provider (`src/lib/auth.ts`) |

## Webhooks

Stripe webhook endpoint:

- `POST /api/webhooks/stripe`
- File: `src/app/api/webhooks/stripe/route.ts`

## Cron

Scheduled job in `vercel.json`:

- `/api/cron/expire-queue` daily

Auth options (see `src/app/api/cron/expire-queue/route.ts`):

- `x-cron-secret: $CRON_SECRET`
- or `Authorization: Bearer $CRON_SECRET`

If `CRON_SECRET` is not set, the route only allows access when `NODE_ENV !== "production"`.
