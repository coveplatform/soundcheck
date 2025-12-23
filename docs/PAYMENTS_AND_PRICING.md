# Payments & Pricing Strategy (MixReflect)

## Goals

- Keep customer purchases in the **small-transaction** range while remaining profitable.
- Ensure Tier 2+ meaningfully improves quality by guaranteeing a minimum number of **PRO** reviews.
- Keep reviewer payouts in “beer money” territory while allowing top reviewers to earn more via volume and tier.

## Current Product Pricing (in code)

Pricing is defined in `src/lib/metadata.ts` as cents (minor currency units).

- `STARTER`
  - **5 reviews**
  - **$4.99** (`499`)
  - **Guaranteed PRO reviews:** `0`
- `STANDARD`
  - **10 reviews**
  - **$8.99** (`899`)
  - **Guaranteed PRO reviews:** `2`
- `PRO`
  - **20 reviews**
  - **$14.99** (`1499`)
  - **Guaranteed PRO reviews:** `5`

Only the active tiers are shown in the UI via `ACTIVE_PACKAGE_TYPES`.

## Reviewer Pay (unit economics)

Reviewer pay is per completed review and defined in `src/lib/queue.ts` as cents:

- `ROOKIE`: 15 ($0.15)
- `VERIFIED`: 30 ($0.30)
- `PRO`: 50 ($0.50)

Earnings accrue when a review is submitted:

- Route: `src/app/api/reviews/route.ts`
- Updates:
  - `Review.paidAmount` (cents)
  - `ReviewerProfile.pendingBalance` (cents)
  - `ReviewerProfile.totalEarnings` (cents)

## Stripe Payment Flow (customer -> platform)

### Checkout creation

- Route: `src/app/api/payments/checkout/route.ts`
- Uses `PACKAGES[track.packageType]` to build the Stripe Checkout session.
- Writes a `Payment` row in Postgres with:
  - `amount` (gross)
  - `stripeSessionId`
  - `status = PENDING`

### Webhook settlement

- Route: `src/app/api/webhooks/stripe/route.ts`
- On `checkout.session.completed`:
  - marks `Payment.status = COMPLETED`
  - updates `Track.status = QUEUED` and sets `paidAt`
  - increments `ArtistProfile.totalSpent` by `session.amount_total`
  - calls assignment (`assignReviewersToTrack`)

## Stripe Payout Flow (platform -> reviewer)

Reviewers withdraw via Stripe Connect transfers:

- Route: `src/app/api/reviewer/payouts/route.ts`
- Preconditions:
  - reviewer has `stripeAccountId`
  - minimum withdrawal threshold is enforced
- Implementation:
  - creates a `Payout`
  - decrements `ReviewerProfile.pendingBalance`
  - executes `stripe.transfers.create({ amount, destination })`

## Guaranteed PRO Reviews (Tier 2+)

Guarantees are enforced during assignment (not during eligibility).

- Logic: `src/lib/queue.ts` in `assignReviewersToTrack`
- For a track with a package requiring `minProReviews`:
  - the system computes how many PRO reviews already exist in statuses:
    - `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`
  - it reserves enough assignment slots for PRO reviewers to meet the guarantee
  - if there aren’t enough eligible PRO reviewers at the moment, it **does not fill those reserved slots with non‑PRO reviewers**

Operationally, this means:

- The track may be partially assigned until PRO supply exists.
- Tier 2+ packages keep their promise rather than silently downgrading.

## Stripe Fees (what we do and don’t track)

### What we track today

- Gross payment amount (`Payment.amount`) and Stripe IDs.

### What we do NOT track today

The database does not currently store:

- Stripe processing fee
- “net” amount after fees
- charge balance transaction IDs

### How to audit fees today

- Stripe Dashboard:
  - Payment -> Balance transaction -> Fee and Net

### Best practice recommendation

Add fee tracking so unit economics are measurable without manual Stripe lookups:

- Add optional fields to `Payment`, e.g.
  - `stripeFeeAmount` (cents)
  - `stripeNetAmount` (cents)
  - `stripeBalanceTransactionId`
- On `checkout.session.completed`, fetch PaymentIntent/Charge and `balance_transaction`, persist fee and net.

## Multi-currency (AU + US)

The app uses a single currency (Stripe account default or `STRIPE_CURRENCY`).
If you plan to run both AU and US pricing, best practice is to:

- define currency-aware pricing (AUD and USD price tables), or
- use separate Stripe accounts/deployments per region

## Suggested Monitoring / Metrics

- Revenue:
  - Gross: sum(`Payment.amount` where `status=COMPLETED`)
  - Net: sum(`stripeNetAmount`) when implemented
- COGS:
  - Review payouts: sum(`Review.paidAmount` where `status=COMPLETED`)
- Margin:
  - GrossMargin = NetRevenue - ReviewPayouts
- Supply health:
  - percent of Tier 2+/Tier 3 tracks waiting for PRO slots
  - average time-to-first-review and time-to-complete by package

## Practical Pricing Guardrails

- Avoid sub-$3 checkouts due to fixed Stripe fee component.
- Use bundles/tiers to amortize fixed payment fees.
- Keep Tier 2/3 upsells tied to visible quality improvements (guaranteed PRO count).
