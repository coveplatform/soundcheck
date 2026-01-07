# Feature: Payments & Payouts

## Overview

MixReflect uses Stripe for:

- **Artist payments** (Stripe Checkout)
- **Reviewer payouts** (Stripe transfers to connected accounts)

## Artist payments

### Checkout creation

- Endpoint: `POST /api/payments/checkout`
- File: `src/app/api/payments/checkout/route.ts`

Behavior:

- Requires authentication.
- Validates track ownership.
- Creates a Stripe Checkout session.
- Upserts a `Payment(status=PENDING)` row.

### Webhook finalization

- Endpoint: `POST /api/webhooks/stripe`
- File: `src/app/api/webhooks/stripe/route.ts`

Behavior:

- Verifies signature using `STRIPE_WEBHOOK_SECRET`.
- Deduplicates events via `StripeWebhookEvent` table.
- On `checkout.session.completed`:
  - calls `finalizePaidCheckoutSession` (`src/lib/payments.ts`)
  - queues the track and assigns reviewers.

### Success page polling

- Endpoint: `GET /api/payments/checkout-status?session_id=...`
- File: `src/app/api/payments/checkout-status/route.ts`

This endpoint can finalize the payment if Stripe shows the session is paid but the webhook is delayed.

## Reviewer payouts

- Endpoint: `POST /api/reviewer/payouts`
- File: `src/app/api/reviewer/payouts/route.ts`

Key rules:

- Requires verified email.
- Requires onboarding completion and not restricted.
- Has minimum payout threshold (`MIN_PAYOUT_CENTS = 1000`).
- Enforces payout delay after Stripe connection (`PAYOUT_DELAY_DAYS = 7`).

## Admin refunds

- Endpoint: `POST /api/admin/refund`
- File: `src/app/api/admin/refund/route.ts`

Rules:

- Admin-only (email allowlist).
- Prevents refund once reviews have started.
- Cancels track, clears queue entries, expires active reviews.

## Existing pricing doc

See `docs/PAYMENTS_AND_PRICING.md` for product strategy + pricing notes.
