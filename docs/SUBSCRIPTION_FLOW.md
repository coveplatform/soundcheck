# Subscription & Payment Flow Documentation

This document provides a comprehensive overview of how authentication, payments, and subscription/pro features work in the MixReflect platform.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Authentication Flow](#authentication-flow)
3. [Database Models for Subscriptions](#database-models-for-subscriptions)
4. [Pro vs Free Tier Features](#pro-vs-free-tier-features)
5. [Subscription Payment Flow](#subscription-payment-flow)
6. [Review Credits System](#review-credits-system)
7. [Webhook Processing](#webhook-processing)
8. [Admin Pro Activation](#admin-pro-activation)
9. [Key Files Reference](#key-files-reference)

---

## Project Overview

**MixReflect** is a two-sided music feedback marketplace:
- **Artists** submit tracks for structured reviews and pay for review packages
- **Reviewers** complete onboarding, receive assigned tracks, and submit structured reviews for payout

The platform uses a **freemium model** where artists can use basic features for free but pay for a Pro subscription to unlock unlimited capabilities.

---

## Authentication Flow

### Tech Stack
- **NextAuth.js** with JWT session strategy
- **Prisma Adapter** for database integration
- **bcryptjs** for password hashing
- Rate limiting on login attempts

### Providers
1. **Credentials Provider**: Email/password authentication
2. **Google Provider**: OAuth login (optional, configured via env vars)

### Key Authentication Behaviors

**Email Verification**:
- **NOT required at login** - allows users to sign in and use free features without friction
- Enforced at specific actions that require it (e.g., uploading tracks, paid checkout)

**JWT Token Structure** (enriched from database on each request):
```typescript
token.id = user.id
token.isArtist = boolean        // User has artist role
token.isReviewer = boolean      // User has reviewer role
token.artistProfileId = string  // Artist profile ID if exists
token.listenerProfileId = string // Reviewer profile ID if exists
token.emailVerified = ISO date string or null
```

**Session Object** (exposed to client):
```typescript
session.user.id
session.user.isArtist
session.user.isReviewer
session.user.artistProfileId
session.user.listenerProfileId
session.user.emailVerified
```

### User Roles
Users can have multiple roles simultaneously:
- `User.isArtist = true` → Can submit tracks for review
- `User.isReviewer = true` → Can review tracks and earn payouts

Each role has an associated profile:
- `ArtistProfile` - Stats, subscription status, Stripe customer ID
- `ListenerProfile` - Reviewer tier, earnings, quality metrics

**File**: `src/lib/auth.ts`

---

## Database Models for Subscriptions

### ArtistProfile Model

The `ArtistProfile` table stores all subscription-related data:

```prisma
model ArtistProfile {
  // Stripe Integration
  stripeCustomerId        String?   // Stripe customer ID
  subscriptionId          String?   // Stripe subscription ID

  // Subscription Status
  subscriptionStatus      String?   // "active", "canceled", "past_due", etc.
  subscriptionTier        String?   // "pro" (currently only tier)
  subscriptionCurrentPeriodEnd DateTime? // When current billing period ends
  subscriptionCanceledAt  DateTime? // When user canceled (still active until period end)

  // Review Credits
  freeReviewCredits       Int @default(1)  // Credits available for requesting reviews

  // Stats
  totalTracks   Int @default(0)  // Tracks submitted
  totalSpent    Int @default(0)  // Total spent in cents
}
```

### Key Status Values

| Field | Values | Description |
|-------|--------|-------------|
| `subscriptionStatus` | `null`, `"active"`, `"canceled"`, `"past_due"` | Current subscription state |
| `subscriptionTier` | `null`, `"pro"` | Subscription tier (only "pro" currently) |

**File**: `prisma/schema.prisma` (lines 116-153)

---

## Pro vs Free Tier Features

### Feature Comparison

| Feature | Free Tier | Pro ($9.95 AUD/month) |
|---------|-----------|----------------------|
| Track uploads | **3 tracks maximum** | **Unlimited** |
| Reviews per track | Max 5 | Max 20 |
| Starting review credits | 5 | 20 (replenished monthly) |
| Platform fee (track sales) | 20% | 15% |
| Analytics dashboard | No | Yes |
| Sales hub | No | Yes |
| Priority support | No | Yes |

### How Pro Status is Checked

The system checks `subscriptionStatus === "active"` to determine pro access:

**Track Upload Limit** (`src/app/(dashboard)/artist/submit/page.tsx:84`):
```typescript
const canUploadNow = data.subscriptionStatus === "active" || (data.totalTracks || 0) < 3;
```

**Review Request Limit** (`src/app/(dashboard)/artist/tracks/[id]/request-reviews/page.tsx`):
```typescript
setDesiredReviews(data?.subscriptionStatus === "active" ? 20 : 5);
```

**Platform Fee for Track Sales** (`src/app/api/t/[trackShareId]/checkout/route.ts`):
```typescript
const platformFeePercent = track.artist.subscriptionStatus === "active" ? 0.15 : 0.20;
```

---

## Subscription Payment Flow

### Step 1: User Initiates Checkout

**Endpoint**: `POST /api/subscriptions/checkout`

**File**: `src/app/api/subscriptions/checkout/route.ts`

**Process**:
1. Verify user is authenticated
2. Fetch artist profile
3. Check if already subscribed (return error if active)
4. Create Stripe customer if doesn't exist
5. Store `stripeCustomerId` in ArtistProfile
6. Create Stripe checkout session:
   - Mode: `subscription`
   - Product: "MixReflect Pro"
   - Price: **$9.95 AUD/month** (995 cents)
   - Success URL: `/artist/account?subscription=success`
   - Cancel URL: `/artist/submit?canceled=true`

**Response**: `{ url: "https://checkout.stripe.com/..." }`

### Step 2: User Completes Payment on Stripe

User is redirected to Stripe's hosted checkout page where they enter payment details.

### Step 3: Webhook Receives Confirmation

**Endpoint**: `POST /api/webhooks/stripe`

**File**: `src/app/api/webhooks/stripe/route.ts`

Multiple webhook events are handled:

#### Event: `checkout.session.completed` (mode: subscription)

**Handler**: `handleSubscriptionCheckoutComplete()`

**Process**:
1. Extract `artistProfileId` from session metadata
2. Retrieve full subscription data from Stripe
3. Update ArtistProfile:
   ```typescript
   {
     subscriptionId: subscription.id,
     subscriptionStatus: subscription.status,  // "active"
     subscriptionTier: "pro",
     subscriptionCurrentPeriodEnd: new Date(current_period_end * 1000)
   }
   ```
4. Grant 20 review credits if user has less than 20

#### Event: `invoice.payment_succeeded`

**Handler**: `handleInvoicePaymentSucceeded()`

Handles both initial and renewal payments:
- `billing_reason: "subscription_create"` → Initial payment
- `billing_reason: "subscription_cycle"` → Monthly renewal

**Process**:
1. Find artist profile by `subscriptionId` (or `stripeCustomerId` as fallback)
2. On initial payment: Set `subscriptionStatus = "active"`
3. On renewal: Confirm subscription is still active
4. Grant 20 review credits if user has less than 20

#### Event: `customer.subscription.updated`

**Handler**: `handleSubscriptionUpdated()`

Updates subscription status when user:
- Cancels subscription (status remains "active" until period end)
- Reactivates subscription
- Payment method issues

**Data Updated**:
```typescript
{
  subscriptionStatus: subscription.status,
  subscriptionCurrentPeriodEnd: new Date(current_period_end * 1000),
  subscriptionCanceledAt: canceled_at ? new Date(canceled_at * 1000) : null
}
```

#### Event: `customer.subscription.deleted`

**Handler**: `handleSubscriptionDeleted()`

Called when subscription actually ends (after period expires):
```typescript
{
  subscriptionStatus: "canceled",
  subscriptionCanceledAt: new Date()
}
```

### Step 4: User Redirected Back

User is redirected to success URL with subscription confirmed.

---

## Review Credits System

Artists use review credits to request reviews on their tracks. Credits are consumed when reviews are requested.

### Credit Pricing

**File**: `src/app/api/review-credits/checkout/route.ts`

| Pack | Price (AUD) | Credits | Price per Credit |
|------|-------------|---------|------------------|
| Small | $5.00 | 5 | $1.00 |
| Medium | $18.00 | 20 | $0.90 |
| Large | $40.00 | 50 | $0.80 |
| Custom | $1.00 each | 1-200 | $1.00 |

### Credit Purchase Flow

1. User clicks buy credits on account page
2. `POST /api/review-credits/checkout` creates Stripe checkout session
3. Session metadata includes:
   ```typescript
   {
     type: "review_credits_topup",
     artistProfileId: string,
     creditsToAdd: string
   }
   ```
4. On `checkout.session.completed`, webhook calls `handleReviewCreditsTopup()`
5. Credits are added to `ArtistProfile.freeReviewCredits`

### Credit Granting on Subscription

- **Initial subscription**: 20 credits granted if user has < 20
- **Monthly renewal**: 20 credits granted if user has < 20 (replenishment)

---

## Webhook Processing

### Security

**File**: `src/app/api/webhooks/stripe/route.ts`

1. **Signature Verification**: All webhooks verified using `STRIPE_WEBHOOK_SECRET`
   ```typescript
   event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
   ```

2. **Deduplication**: Events stored in `StripeWebhookEvent` table with 24-hour TTL
   ```sql
   INSERT INTO "StripeWebhookEvent" (id, type, expiresAt)
   VALUES ($event_id, $event_type, $expires)
   ON CONFLICT (id) DO NOTHING
   ```
   If insert returns 0 rows, event was already processed.

### Event Flow Diagram

```
User clicks "Subscribe"
         │
         ▼
POST /api/subscriptions/checkout
         │
         ▼
Stripe Checkout Session created
         │
         ▼
User completes payment on Stripe
         │
         ▼
Stripe sends webhooks ─────────────────────────────────┐
         │                                              │
         ▼                                              ▼
checkout.session.completed              invoice.payment_succeeded
         │                                              │
         ▼                                              ▼
handleSubscriptionCheckoutComplete()   handleInvoicePaymentSucceeded()
         │                                              │
         ├──────────────────────────────────────────────┘
         ▼
ArtistProfile updated:
  - subscriptionStatus = "active"
  - subscriptionTier = "pro"
  - freeReviewCredits = 20 (if < 20)
         │
         ▼
User redirected to success page
```

---

## Admin Pro Activation

Admins can manually activate Pro for users (e.g., for partners, promotions).

**Endpoint**: `POST /api/admin/users/[id]/activate-pro`

**File**: `src/app/api/admin/users/[id]/activate-pro/route.ts`

**Authorization**: Requires admin email (checked against `ADMIN_EMAILS` env var)

**Process**:
1. Verify admin status via `isAdminEmail(session.user.email)`
2. Find user and artist profile
3. Update artist profile:
   ```typescript
   {
     subscriptionStatus: "active",
     subscriptionTier: "pro",
     freeReviewCredits: Math.max(currentCredits, 20)
   }
   ```

**Note**: This does NOT create a Stripe subscription - it's a manual override.

---

## Key Files Reference

### Authentication
| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth configuration, JWT callbacks |
| `src/types/next-auth.d.ts` | Session/token type extensions |
| `middleware.ts` | Route protection |

### Subscription & Payments
| File | Purpose |
|------|---------|
| `src/app/api/subscriptions/checkout/route.ts` | Create subscription checkout |
| `src/app/api/subscriptions/verify/route.ts` | Verify subscription status (handles race condition) |
| `src/app/api/subscriptions/portal/route.ts` | Stripe billing portal access |
| `src/app/api/webhooks/stripe/route.ts` | All Stripe webhook handling |
| `src/app/api/review-credits/checkout/route.ts` | Review credits purchase |
| `src/lib/payments.ts` | Payment finalization logic |
| `src/lib/stripe.ts` | Stripe SDK initialization |

### Pro Feature Gating
| File | Purpose |
|------|---------|
| `src/app/(dashboard)/artist/submit/page.tsx` | Track upload limit check |
| `src/app/(dashboard)/artist/tracks/[id]/request-reviews/page.tsx` | Review limit check |
| `src/components/account/account-settings-client.tsx` | Subscription UI |

### Admin
| File | Purpose |
|------|---------|
| `src/app/api/admin/users/[id]/activate-pro/route.ts` | Manual pro activation |
| `src/lib/admin.ts` | Admin email allowlist check |

### Database
| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | All data models including ArtistProfile |

---

## Environment Variables

Required for subscription functionality:

```env
# Stripe
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (for checkout redirects)
NEXT_PUBLIC_APP_URL=https://mixreflect.com

# Admin emails (comma-separated)
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

---

## Common Scenarios

### New User Signs Up and Subscribes

1. User creates account (email/password or Google)
2. User completes artist onboarding (creates ArtistProfile with 5 free credits)
3. User submits first 3 tracks (free tier limit)
4. On 4th track attempt, shown upgrade prompt
5. User clicks "Subscribe" → Stripe checkout
6. Payment completes → webhooks update ArtistProfile
7. User now has `subscriptionStatus: "active"` and 20 credits

### Existing Subscriber Cancels

1. User clicks "Manage Subscription" → Stripe billing portal
2. User cancels in portal
3. Webhook `customer.subscription.updated` fires
4. ArtistProfile updated with `subscriptionCanceledAt`
5. `subscriptionStatus` remains "active" until period end
6. At period end, `customer.subscription.deleted` webhook fires
7. `subscriptionStatus` set to "canceled"
8. User reverts to free tier limits

### Monthly Renewal

1. Stripe charges card automatically
2. `invoice.payment_succeeded` webhook fires with `billing_reason: "subscription_cycle"`
3. Credits replenished to 20 if user has < 20
4. No user action required

---

## Race Condition Handling

### The Problem

When a user completes Stripe checkout, they are redirected back to the app with `?subscription=success`. However, the Stripe webhook may not have processed yet (webhooks can be delayed by seconds to minutes), causing the user to see "Not subscribed" even though they just paid.

### The Solution

We handle this with a multi-layered approach:

#### 1. Subscription Verification Endpoint

**Endpoint**: `POST /api/subscriptions/verify`

**File**: `src/app/api/subscriptions/verify/route.ts`

This endpoint:
1. Checks local database for `subscriptionStatus === "active"`
2. If not active but `stripeCustomerId` exists, queries Stripe directly for active subscriptions
3. If Stripe shows an active subscription, syncs it to the local database
4. Returns the verified subscription status

```typescript
// Response format
{
  status: "active" | "canceled" | "none",
  tier: "pro" | null,
  currentPeriodEnd: Date | null,
  credits: number,
  source: "database" | "stripe_sync" | "stripe_verified" | "database_fallback"
}
```

#### 2. Client-Side Polling

**File**: `src/components/account/account-settings-client.tsx`

When the account page loads with `?subscription=success`:

1. Shows "Activating your subscription..." loading state
2. Polls `/api/subscriptions/verify` every 2 seconds
3. Maximum 10 attempts (20 seconds total)
4. On success: Shows success message, refreshes page data
5. On timeout: Stops polling (webhook will eventually activate)

```typescript
// Polling logic
const poll = async () => {
  const activated = await verifySubscription();
  if (activated) {
    setSubscriptionJustActivated(true);
    router.refresh();
  } else if (attempts < maxAttempts) {
    setTimeout(poll, 2000);
  }
};
```

#### 3. Dual Webhook Handling

Both `checkout.session.completed` and `invoice.payment_succeeded` can activate subscriptions, providing redundancy:

- `checkout.session.completed` → Immediate activation
- `invoice.payment_succeeded` → Backup activation (with `stripeCustomerId` fallback)

#### 4. User Feedback

- **Loading state**: Purple spinner with "Activating your subscription..."
- **Success state**: Green checkmark with "Your Pro subscription is now active!"
- **Credits display**: Shows the 20 review credits they received

### Flow Diagram

```
User completes Stripe checkout
         │
         ▼
Redirected to /artist/account?subscription=success
         │
         ├─────────────────────────────────────┐
         ▼                                      ▼
Client detects ?subscription=success      Stripe sends webhook
         │                                      │
         ▼                                      ▼
Shows "Activating..." spinner           Webhook updates DB
         │                                      │
         ▼                                      │
Polls /api/subscriptions/verify ◄───────────────┘
         │
         ▼
Verify endpoint checks DB (or Stripe if needed)
         │
         ▼
Returns status: "active"
         │
         ▼
Client shows success message
         │
         ▼
Page refreshes with Pro features enabled
```

### Edge Cases Handled

| Scenario | Handling |
|----------|----------|
| Webhook arrives before redirect | DB already active, verify returns immediately |
| Webhook delayed by seconds | Polling catches it within 20 seconds |
| Webhook delayed by minutes | Verify endpoint queries Stripe directly |
| Webhook completely fails | Verify endpoint syncs from Stripe |
| Network error during verify | Falls back to database state |
| User refreshes during activation | Polling restarts if still `?subscription=success` |
