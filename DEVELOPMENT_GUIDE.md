# SoundCheck Development Guide

## Current Status

### Completed (Phases 0-3)
- [x] Project setup (Next.js, Prisma, Tailwind)
- [x] Authentication (NextAuth with credentials)
- [x] Artist onboarding and profile
- [x] Track submission with URL parsing
- [x] Stripe checkout integration
- [x] Artist dashboard
- [x] Reviewer onboarding and profile
- [x] Queue assignment system (logic only)
- [x] Reviewer dashboard
- [x] Audio player with listen tracking
- [x] Review form and submission
- [x] Basic feedback display

### Remaining Work
- [ ] Phase 4: Enhanced Feedback Display
- [ ] Phase 5: Quality & Tier System
- [ ] Phase 6: Automated Payouts (Stripe Connect)
- [ ] Phase 7: Polish & Launch
- [ ] Phase 8: Growth Features

---

## Phase 4: Enhanced Feedback Display

### 4.1 Aggregate Analytics Component

Create `src/components/feedback/aggregate-analytics.tsx`:

```typescript
// Features to implement:
// - Score distribution charts (bar charts for each metric)
// - Genre consensus (what genres reviewers think the track is)
// - Similar artists word cloud
// - First impression breakdown (pie chart)
// - Listen-again percentage with trend

interface AggregateAnalyticsProps {
  reviews: Review[];
  trackId: string;
}

// Use a lightweight chart library like recharts or chart.js
// npm install recharts

// Display:
// 1. Average scores with visual bars
// 2. Score distribution (how many 1s, 2s, 3s, etc.)
// 3. Common themes in feedback (basic keyword extraction)
// 4. Consensus on genre
```

### 4.2 Artist Rating System for Reviews

Create `src/app/api/reviews/[id]/rate/route.ts`:

```typescript
// POST /api/reviews/[id]/rate
// Body: { rating: 1-5 }

// Steps:
// 1. Verify artist owns the track
// 2. Update review.artistRating
// 3. Recalculate reviewer's averageRating
// 4. Check if tier should change
// 5. Return updated review

// Add rating UI to feedback display page
// src/app/(dashboard)/artist/tracks/[id]/page.tsx
```

### 4.3 Review Flagging System

Create `src/app/api/reviews/[id]/flag/route.ts`:

```typescript
// POST /api/reviews/[id]/flag
// Body: { reason: string }

// Reasons: "low_effort" | "spam" | "offensive" | "irrelevant"

// Steps:
// 1. Set review.wasFlagged = true
// 2. Set review.flagReason
// 3. Increment reviewer.flagCount
// 4. If flagCount > 3, set reviewer.isRestricted = true
// 5. Send notification to admin (future: admin dashboard)
```

### 4.4 Email Notifications

Install email package:
```bash
npm install @react-email/components resend
```

Create `src/lib/email.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReviewCompleteEmail(
  artistEmail: string,
  trackTitle: string,
  reviewCount: number,
  totalReviews: number
) {
  // Send when 50% complete and 100% complete
}

export async function sendTrackQueuedEmail(artistEmail: string, trackTitle: string) {
  // Confirmation after payment
}

export async function sendNewTrackAssignedEmail(reviewerEmail: string, trackTitle: string) {
  // Notify reviewer of new assignment
}
```

Add to `.env`:
```
RESEND_API_KEY=your_resend_api_key
```

---

## Phase 5: Quality & Tier System

### 5.1 Automatic Tier Updates

Update `src/lib/queue.ts` - already has `updateReviewerTier()`:

```typescript
// Enhance to include:
// 1. Check genre specialization for PRO tier
// 2. Send notification on tier change
// 3. Log tier history for analytics

// Add tier history model to schema:
model TierHistory {
  id         String   @id @default(cuid())
  reviewerId String
  reviewer   ReviewerProfile @relation(fields: [reviewerId], references: [id])
  fromTier   ReviewerTier
  toTier     ReviewerTier
  reason     String
  createdAt  DateTime @default(now())
}
```

### 5.2 Level-Up Notifications

Create `src/components/dashboard/level-up-modal.tsx`:

```typescript
// Show modal when reviewer reaches new tier
// Include:
// - Congratulations message
// - New earning rate
// - What unlocked (pro packages, higher priority)
// - Share on social (optional)

// Store in localStorage which tier user has seen
// Check on dashboard load
```

### 5.3 Low-Quality Review Detection

Create `src/lib/quality.ts`:

```typescript
export function detectLowQualityReview(review: ReviewInput): {
  isLowQuality: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Check 1: Minimum character counts
  if (review.bestPart.length < 20) {
    reasons.push("Best part description too short");
  }
  if (review.weakestPart.length < 20) {
    reasons.push("Weakest part description too short");
  }

  // Check 2: Generic phrases
  const genericPhrases = ["good", "nice", "cool", "bad", "okay"];
  if (genericPhrases.some(p => review.bestPart.toLowerCase() === p)) {
    reasons.push("Best part is too generic");
  }

  // Check 3: Same text for best/weakest
  if (review.bestPart.toLowerCase() === review.weakestPart.toLowerCase()) {
    reasons.push("Best and weakest parts are identical");
  }

  // Check 4: Suspiciously fast review time
  if (review.listenDuration < 95) { // Allow 5 sec margin
    reasons.push("Listen time suspiciously close to minimum");
  }

  return {
    isLowQuality: reasons.length > 0,
    reasons,
  };
}

// Use in review submission API to:
// 1. Warn reviewer before submit
// 2. Flag for manual review if too many issues
```

### 5.4 Reviewer Restrictions

Create `src/app/api/admin/reviewers/[id]/restrict/route.ts`:

```typescript
// POST /api/admin/reviewers/[id]/restrict
// Body: { reason: string, duration?: number } // duration in days

// Steps:
// 1. Set reviewer.isRestricted = true
// 2. Remove from all queues
// 3. Send email notification
// 4. Log action

// Add admin check middleware
export function isAdmin(userId: string): Promise<boolean> {
  // Check against admin user list or role
}
```

### 5.5 Package-Based Reviewer Matching

Update `src/lib/queue.ts`:

```typescript
export async function assignReviewersToTrack(trackId: string) {
  const track = await prisma.track.findUnique({...});

  // Different allocation based on package
  const allocation = {
    STARTER: { ROOKIE: 3, VERIFIED: 2, PRO: 0 },
    STANDARD: { ROOKIE: 2, VERIFIED: 6, PRO: 2 },
    PRO: { ROOKIE: 0, VERIFIED: 0, PRO: 10 },
    DEEP_DIVE: { ROOKIE: 8, VERIFIED: 14, PRO: 3 },
  };

  const target = allocation[track.packageType];

  // Assign reviewers respecting tier quotas
  for (const tier of ['PRO', 'VERIFIED', 'ROOKIE']) {
    const needed = target[tier];
    const reviewers = await getEligibleReviewersByTier(trackId, tier, needed);
    await assignReviewers(trackId, reviewers);
  }
}
```

---

## Phase 6: Automated Payouts (Stripe Connect)

### 6.1 Stripe Connect Setup

Update `src/lib/stripe.ts`:

```typescript
// Create connected account for reviewer
export async function createConnectedAccount(reviewerId: string, email: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      transfers: { requested: true },
    },
    metadata: {
      reviewerId,
    },
  });

  return account;
}

// Generate onboarding link
export async function createAccountLink(accountId: string, reviewerId: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXTAUTH_URL}/reviewer/earnings?refresh=true`,
    return_url: `${process.env.NEXTAUTH_URL}/reviewer/earnings?success=true`,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

// Transfer funds to reviewer
export async function transferToReviewer(
  reviewerId: string,
  amount: number, // cents
  stripeAccountId: string
) {
  const transfer = await stripe.transfers.create({
    amount,
    currency: 'usd',
    destination: stripeAccountId,
    metadata: {
      reviewerId,
    },
  });

  return transfer;
}
```

### 6.2 Update Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
model ReviewerProfile {
  // ... existing fields ...

  // Stripe Connect
  stripeAccountId     String?
  stripeAccountStatus String? // "pending" | "active" | "restricted"
  stripeOnboardedAt   DateTime?
}
```

### 6.3 Payout Request Flow

Create `src/app/api/payouts/request/route.ts`:

```typescript
// POST /api/payouts/request
// Body: { amount?: number } // optional, default is full balance

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const reviewer = await getReviewerProfile(session.user.id);

  // Validations
  if (!reviewer.stripeAccountId) {
    return error("Please connect your Stripe account first");
  }

  if (reviewer.pendingBalance < 1000) { // $10 minimum
    return error("Minimum payout is $10");
  }

  // For new accounts, enforce delay
  const daysSinceOnboard = daysSince(reviewer.stripeOnboardedAt);
  if (daysSinceOnboard < 7) {
    return error("Payouts available 7 days after connecting Stripe");
  }

  // Create payout record
  const payout = await prisma.payout.create({
    data: {
      reviewerId: reviewer.id,
      amount: reviewer.pendingBalance,
      method: "STRIPE_CONNECT",
      status: "PROCESSING",
    },
  });

  // Execute transfer
  try {
    const transfer = await transferToReviewer(
      reviewer.id,
      reviewer.pendingBalance,
      reviewer.stripeAccountId
    );

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: "COMPLETED",
        externalId: transfer.id,
        processedAt: new Date(),
      },
    });

    await prisma.reviewerProfile.update({
      where: { id: reviewer.id },
      data: { pendingBalance: 0 },
    });

    return success({ payout, transfer });
  } catch (error) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: "FAILED" },
    });
    throw error;
  }
}
```

### 6.4 Stripe Connect Onboarding Page

Create `src/app/(dashboard)/reviewer/connect/page.tsx`:

```typescript
// Page to:
// 1. Explain Stripe Connect
// 2. Show current connection status
// 3. Button to start onboarding
// 4. Handle return from Stripe

export default async function ConnectPage() {
  const reviewer = await getReviewerProfile();

  if (reviewer.stripeAccountId) {
    // Check account status
    const account = await stripe.accounts.retrieve(reviewer.stripeAccountId);

    if (account.details_submitted) {
      return <ConnectedStatus account={account} />;
    } else {
      return <CompleteOnboarding accountId={reviewer.stripeAccountId} />;
    }
  }

  return <StartOnboarding />;
}
```

### 6.5 Webhook for Connect Events

Update `src/app/api/webhooks/stripe/route.ts`:

```typescript
// Add handlers for:
case "account.updated": {
  const account = event.data.object as Stripe.Account;
  await handleAccountUpdated(account);
  break;
}

case "transfer.created": {
  const transfer = event.data.object as Stripe.Transfer;
  await handleTransferCreated(transfer);
  break;
}

case "transfer.failed": {
  const transfer = event.data.object as Stripe.Transfer;
  await handleTransferFailed(transfer);
  break;
}

async function handleAccountUpdated(account: Stripe.Account) {
  await prisma.reviewerProfile.updateMany({
    where: { stripeAccountId: account.id },
    data: {
      stripeAccountStatus: account.details_submitted ? "active" : "pending",
    },
  });
}
```

---

## Phase 7: Polish & Launch

### 7.1 Enhanced Landing Page

Update `src/app/page.tsx`:

```typescript
// Add:
// - Testimonials section (static for now)
// - Pricing table with package comparison
// - FAQ section
// - How it works animation/diagram
// - Social proof (review count, artist count)

// Add stats API
// GET /api/stats/public
// Returns: { totalReviews, totalArtists, avgRating }
```

### 7.2 Onboarding Tutorial

Create `src/components/onboarding/tutorial.tsx`:

```typescript
// Multi-step tutorial modal for new users
// For Artists:
// 1. Welcome to SoundCheck
// 2. How to submit a track
// 3. Understanding feedback
// 4. Rating reviewers

// For Reviewers:
// 1. Welcome to reviewing
// 2. How the tier system works
// 3. Writing quality feedback
// 4. Getting paid

// Store completion in localStorage or user preferences
```

### 7.3 Mobile Responsiveness Audit

Check and fix:
- [ ] Landing page hero on mobile
- [ ] Navigation hamburger menu
- [ ] Track submission form on mobile
- [ ] Audio player touch controls
- [ ] Review form on mobile
- [ ] Dashboard cards stacking
- [ ] Tables scrolling horizontally

Create `src/components/layout/mobile-nav.tsx`:

```typescript
// Hamburger menu for mobile
// Slide-out drawer with navigation
// Role switcher (artist/reviewer)
// Profile and logout
```

### 7.4 Error Handling & Loading States

Create `src/components/ui/loading.tsx`:

```typescript
// Skeleton loaders for:
// - Track cards
// - Review cards
// - Dashboard stats
// - Queue items

// Error boundary component
// Retry buttons for failed requests
```

Create `src/app/error.tsx` and `src/app/not-found.tsx`:

```typescript
// Global error page
// 404 page with helpful links
```

### 7.5 SEO & Meta Tags

Update `src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: {
    default: "SoundCheck - Get Real Feedback on Your Music",
    template: "%s | SoundCheck",
  },
  description: "A private feedback marketplace...",
  keywords: ["music feedback", "track reviews", ...],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://soundcheck.app",
    title: "SoundCheck",
    description: "...",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SoundCheck",
    description: "...",
    images: ["/og-image.png"],
  },
};
```

### 7.6 Production Deployment

Create deployment checklist:

```markdown
## Pre-Launch Checklist

### Environment
- [ ] Set up production PostgreSQL (Railway, Supabase, Neon)
- [ ] Configure production environment variables
- [ ] Set up Stripe production keys
- [ ] Configure email service (Resend/SendGrid)
- [ ] Set up error monitoring (Sentry)
- [ ] Set up analytics (Plausible/PostHog)

### Security
- [ ] Enable HTTPS
- [ ] Set secure cookie settings
- [ ] Add rate limiting to APIs
- [ ] Review CORS settings
- [ ] Audit authentication flows

### Performance
- [ ] Enable Next.js image optimization
- [ ] Set up CDN (Vercel handles this)
- [ ] Configure caching headers
- [ ] Optimize database queries

### Monitoring
- [ ] Set up uptime monitoring
- [ ] Configure error alerts
- [ ] Set up database backups
- [ ] Create admin dashboard for manual operations
```

---

## Phase 8: Growth Features

### 8.1 Referral Program

Add to schema:

```prisma
model Referral {
  id           String   @id @default(cuid())
  referrerId   String
  referrer     User     @relation("Referrer", fields: [referrerId], references: [id])
  referredId   String
  referred     User     @relation("Referred", fields: [referredId], references: [id])
  type         ReferralType
  rewardAmount Int      // cents
  rewardPaid   Boolean  @default(false)
  createdAt    DateTime @default(now())
}

enum ReferralType {
  ARTIST_TO_ARTIST      // Both get 2 free reviews
  REVIEWER_TO_REVIEWER  // Referrer gets $2 when referee completes 10 reviews
  ARTIST_TO_REVIEWER    // Artist gets 5 free reviews when reviewer completes 20
}
```

Create referral tracking:
- Generate unique referral codes per user
- Track signups with referral codes
- Automatically apply rewards when conditions met

### 8.2 Rush Delivery Option

Add to schema:

```prisma
model Track {
  // ... existing fields ...
  isRush        Boolean @default(false)
  rushFee       Int?    // additional cents paid
  rushDeadline  DateTime?
}
```

Update pricing:
- Add $3 rush fee option
- 24-hour guaranteed delivery
- Prioritize in queue
- Send urgent notifications to reviewers

### 8.3 Artist Subscription Plans

Add to schema:

```prisma
model Subscription {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  plan            SubscriptionPlan
  stripeSubId     String   @unique
  status          SubscriptionStatus
  currentPeriodEnd DateTime
  reviewsRemaining Int
  createdAt       DateTime @default(now())
}

enum SubscriptionPlan {
  STARTER   // $15/mo - 10 reviews
  PRO       // $40/mo - 30 reviews
  UNLIMITED // $99/mo - unlimited
}
```

### 8.4 Audio File Upload (R2/S3)

Install AWS SDK:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Create `src/lib/storage.ts`:

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

export async function getUploadUrl(filename: string, contentType: string) {
  const key = `tracks/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return { url, key };
}
```

### 8.5 Advanced Analytics Dashboard

Create `src/app/(dashboard)/artist/analytics/page.tsx`:

```typescript
// Show:
// - Review trends over time
// - Score comparisons across tracks
// - Genre performance
// - Improvement tracking
// - Export to CSV

// Premium feature ($10/mo or included in subscription)
```

### 8.6 Reviewer Leaderboards

Create `src/app/(dashboard)/reviewer/leaderboard/page.tsx`:

```typescript
// Show:
// - Top reviewers by volume (this week/month/all-time)
// - Top by rating
// - Rising stars (fastest tier progression)
// - Genre specialists

// Gamification:
// - Badges for milestones
// - Streaks for daily reviewing
// - Special recognition for top performers
```

---

## Database Migrations

When adding new features, create migrations:

```bash
# After schema changes
npm run db:migrate -- --name add_referrals
npm run db:migrate -- --name add_subscriptions
npm run db:generate
```

---

## Testing Strategy

### Unit Tests

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Create `vitest.config.ts` and test files:
- `src/lib/__tests__/queue.test.ts`
- `src/lib/__tests__/metadata.test.ts`
- `src/lib/__tests__/quality.test.ts`

### E2E Tests

```bash
npm install -D playwright
npx playwright install
```

Create tests for:
- Artist signup → onboarding → track submission → payment
- Reviewer signup → onboarding → review submission
- Full loop: artist submits, reviewer reviews, artist sees feedback

---

## API Documentation

Consider adding OpenAPI/Swagger documentation:

```bash
npm install swagger-ui-react
```

Create `src/app/api/docs/page.tsx` with API explorer.

---

## Monitoring & Analytics

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Analytics (PostHog)

```bash
npm install posthog-js
```

Track:
- Page views
- Signup conversions
- Track submission funnel
- Review completion rates
- Payment success rates

---

## Timeline Estimate

| Phase | Features | Complexity |
|-------|----------|------------|
| 4 | Enhanced Feedback | Medium |
| 5 | Quality System | Medium |
| 6 | Stripe Connect | High |
| 7 | Polish & Launch | Medium |
| 8 | Growth Features | High |

Recommended order:
1. Phase 5 (Quality) - Critical for value proposition
2. Phase 4 (Feedback) - Improves artist experience
3. Phase 7 (Polish) - Required for launch
4. Phase 6 (Payouts) - Can start with manual payouts
5. Phase 8 (Growth) - Post-launch iteration

---

## Quick Start for Each Phase

### Phase 4
```bash
npm install recharts  # For charts
# Create aggregate analytics component
# Add rating UI to feedback page
# Implement flagging API
```

### Phase 5
```bash
# Update queue.ts with better allocation
# Add quality detection to review API
# Create tier notification component
```

### Phase 6
```bash
# Update Stripe integration
# Add Connect fields to schema
# Run migration
# Build connect onboarding flow
```

### Phase 7
```bash
npm install @react-email/components resend  # For emails
# Audit mobile responsiveness
# Add loading states
# Set up monitoring
```

### Phase 8
```bash
npm install @aws-sdk/client-s3  # For file uploads
# Add referral system
# Build subscription management
# Create analytics dashboard
```

---

## Support & Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [NextAuth Docs](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com/docs)
