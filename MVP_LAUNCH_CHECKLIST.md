# MixReflect MVP Launch Checklist

This checklist is the single source of truth for shipping the first MixReflect MVP.

## How to use

- Work top-to-bottom in **Priority Order**.
- Check off items only after you verify the behavior end-to-end.
- Keep production configuration in your hosting provider (Vercel) env settings.

---

## Summary

| Category | Items | Est. Hours |
|---|---:|---:|
| Code Changes | 15 | ~18 |
| Environment Setup | 12 | ~3 |
| Third-Party Services | 8 | ~2 |
| Testing | 14 | ~4 |
| Content & Copy | 8 | ~3 |
| Legal | 4 | ~2 |
| Pre-Launch | 10 | ~2 |
| Post-Launch Setup | 6 | ~2 |
| Manual Processes | 8 | Documentation |

Total: ~36 hours

---

## Status Snapshot (current repo)

- [x] Stripe checkout for artist payments
- [x] Queue assignment logic + queue expiry/reassignment helper
- [x] Reviewer audio player + listen verification (heartbeat)
- [x] Review submission flow
- [x] Stripe Connect onboarding + payouts (tested successfully)
- [x] Reviewer quality gates (3 min listen requirement, minimum word counts, low-effort text checks)
- [x] Reviewer onboarding quiz (requires db schema push + prisma generate)

---

# Priority Order

## Week 1: Launch Blockers

### 1) Password Reset Flow (Launch Blocker)

- [ ] Add pages:
  - `src/app/(auth)/forgot-password/page.tsx`
  - `src/app/(auth)/reset-password/page.tsx`
- [ ] Add API routes:
  - `src/app/api/auth/forgot-password/route.ts`
  - `src/app/api/auth/reset-password/route.ts`
- [ ] DB: store reset token + expiry
- [ ] Send email via Resend
- [ ] Add "Forgot password?" link on login

Notes:
- Use a single-use token, store hashed token in DB.
- Expiry: 1 hour.

Estimated: ~3 hours

---

### 2) Email Verification Flow (Launch Blocker)

- [ ] Pages:
  - `src/app/(auth)/verify-email/page.tsx`
- [ ] API routes:
  - `src/app/api/auth/verify-email/route.ts`
  - `src/app/api/auth/resend-verification/route.ts`
- [ ] Generate verification token on signup
- [ ] Update `User.emailVerified`
- [ ] Show signup UX: "Check your email"

Notes:
- For MVP, we can allow browsing but block key actions (submit track / submit review) until verified.

Estimated: ~4 hours

---

### 3) Error & 404 Pages (Launch Blocker)

- [ ] `src/app/error.tsx`
- [ ] `src/app/not-found.tsx`
- [ ] `src/app/global-error.tsx`
- [ ] Consistent styling + retry button
- [ ] Console logging (Sentry later)

Estimated: ~2 hours

---

### 4) Queue Expiration Cron Job (Launch Blocker)

- [ ] Create endpoint: `src/app/api/cron/expire-queue/route.ts`
- [ ] Protect with header secret: `CRON_SECRET`
- [ ] Add `vercel.json` cron schedule:

```json
{
  "crons": [
    { "path": "/api/cron/expire-queue", "schedule": "0 * * * *" }
  ]
}
```

Estimated: ~2 hours

---

### 5) Pricing Section on Landing Page

- [ ] Update `src/app/page.tsx`
- [ ] Pricing table for 4 packages
- [ ] Highlight STANDARD as "Most Popular"
- [ ] Price-per-review display
- [ ] CTA links to signup

Estimated: ~1.5 hours

---

## Week 2: High-Risk (Strongly Recommended)

### 6) Basic Admin Dashboard

- [ ] Create admin layout + pages:
  - `src/app/(admin)/layout.tsx`
  - `src/app/(admin)/admin/page.tsx`
  - `src/app/(admin)/admin/users/page.tsx`
  - `src/app/(admin)/admin/tracks/page.tsx`
  - `src/app/(admin)/admin/reviews/page.tsx`
  - `src/app/(admin)/admin/reviewers/page.tsx`
- [ ] Add `src/lib/admin.ts` with `isAdmin()` helper (hardcode email)
- [ ] Tables: users, tracks, reviews, reviewers
- [ ] Flagged reviews view
- [ ] Restrict/unrestrict reviewer

Estimated: 6–8 hours

---

### 7) Refund Capability

- [ ] Create admin route: `src/app/api/admin/refund/route.ts`
- [ ] Admin-only auth check
- [ ] Call Stripe refund API
- [ ] Update DB:
  - Payment status `REFUNDED`
  - Track status `CANCELLED`
  - Remove from queues

Estimated: ~2 hours

---

### 8) Tier Change Notifications

- [ ] Update `src/lib/queue.ts` tier update logic to detect change
- [ ] Add email template in `src/lib/email.ts`: `sendTierChangeEmail`

Estimated: ~1.5 hours

---

### 9) Track Cancellation (Artist)

- [ ] API: `src/app/api/tracks/[id]/cancel/route.ts`
- [ ] UI: cancel button on artist track page
- [ ] Only allow cancel if no reviews started
- [ ] If paid: trigger refund

Estimated: ~2 hours

---

### 10) FAQ Section

- [ ] Add FAQ accordion to `src/app/page.tsx`

Estimated: ~1.5 hours

---

## Nice-to-have (Post-MVP)

### 11) Minimum Character Validation

- [ ] Add 50+ char checks for best/weakest

Estimated: ~0.5 hours

### 12) Submission Cooldown (time since first heartbeat)

- [ ] Add `firstHeartbeatAt` (or similar) field OR derive from first heartbeat
- [ ] Enforce 3 minutes elapsed, server-side

Estimated: ~0.5 hours

### 13) Generic Phrase Detection

- [ ] Add `src/lib/quality.ts` and integrate with review submission

Estimated: ~1 hour

### 14) SEO Meta Tags + OG image

- [ ] Add `metadata` in `src/app/layout.tsx`
- [ ] Add `/public/og-image.png` (1200x630)

Estimated: ~1 hour

### 15) Loading Skeletons

- [ ] `src/components/ui/skeleton.tsx`

Estimated: ~2 hours

---

# Environment Setup

## Production env var checklist

Create `.env.production` locally for reference (do not commit), and set these in Vercel:

- [ ] `DATABASE_URL=...`
- [ ] `NEXTAUTH_URL=https://yourdomain.com`
- [ ] `NEXTAUTH_SECRET=...`
- [ ] `STRIPE_SECRET_KEY=sk_live_...`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_...`
- [ ] `RESEND_API_KEY=re_...`
- [ ] `RESEND_FROM_EMAIL=noreply@yourdomain.com`
- [ ] `CRON_SECRET=...`
- [ ] `ADMIN_EMAILS=you@example.com` (comma-separated list)
- [ ] (Alternative) `ADMIN_EMAIL=you@example.com`
- [ ] Optional:
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`

---

# Third-Party Services

## Stripe

- [ ] Enable Connect
- [ ] Configure Connect branding
- [ ] Configure webhooks:
  - [ ] `checkout.session.completed`
  - [ ] `checkout.session.expired`
  - [ ] `account.updated`
  - [ ] `transfer.created`
  - [ ] `transfer.failed`

## Resend

- [ ] Verify domain + DNS
- [ ] Set sender email
- [ ] Test sending

## Vercel

- [ ] Connect repo
- [ ] Set env vars
- [ ] Set up cron
- [ ] Set custom domain

---

# Testing Checklist (manual)

## Artist flow

- [ ] Sign up
- [ ] Onboard
- [ ] Submit track (SoundCloud)
- [ ] Submit track (YouTube)
- [ ] Submit track (Bandcamp)
- [ ] Complete checkout
- [ ] Track appears in dashboard
- [ ] Email: track queued

## Reviewer flow

- [ ] Sign up
- [ ] Pass onboarding quiz
- [ ] Select genres
- [ ] See queue
- [ ] Play audio
- [ ] Submit review after requirements met
- [ ] Earnings update
- [ ] Skip track (limit)

## Feedback flow

- [ ] Artist views review
- [ ] Rate review
- [ ] Flag review
- [ ] Aggregate analytics visible

## Payout flow

- [ ] Connect Stripe
- [ ] Request payout

---

# Legal

- [ ] `src/app/(legal)/terms/page.tsx`
- [ ] `src/app/(legal)/privacy/page.tsx`
- [ ] Footer links
- [ ] Signup checkbox (ToS + Privacy)

---

# Manual Processes (document)

- [ ] Refund (Stripe + DB)
- [ ] Restrict/unrestrict reviewer
- [ ] Manual password reset
- [ ] Force expire queue via cron endpoint
- [ ] Stuck track queries
- [ ] Flagged review queries
