# Data Models (Prisma)

Source of truth: `prisma/schema.prisma`.

## User

**Purpose:** Core identity record for authentication and role flags.

**Key Fields:**

| Field | Type | Description |
|------|------|-------------|
| id | String | Primary key |
| email | String | Unique email |
| password | String? | Credentials auth password hash (nullable when OAuth-only) |
| emailVerified | DateTime? | When email was verified |
| isArtist | Boolean | Artist role flag |
| isReviewer | Boolean | Reviewer role flag |

**Relationships:**

- Has one: `ArtistProfile`
- Has one: `ReviewerProfile`
- Has many: `Account`, `Session`
- Has many: `PasswordResetToken`, `EmailVerificationToken`, `SupportTicket`

## ArtistProfile

**Purpose:** Artist-facing profile and stats.

**Key Fields:**

| Field | Type | Description |
|------|------|-------------|
| id | String | Primary key |
| userId | String | Unique FK to `User` |
| artistName | String | Display name |
| totalTracks | Int | Count of submitted tracks |
| totalSpent | Int | Lifetime spend in cents |
| freeReviewCredits | Int | Credit balance for free submissions |

**Relationships:**

- Belongs to: `User`
- Has many: `Track`
- Many-to-many: `Genre` (`ArtistGenres`)

## ReviewerProfile

**Purpose:** Reviewer-facing profile, tiering, earnings, and quality gating.

**Key Fields:**

| Field | Type | Description |
|------|------|-------------|
| id | String | Primary key |
| userId | String | Unique FK to `User` |
| tier | ReviewerTier | `NORMAL` or `PRO` |
| totalReviews | Int | Completed reviews count |
| averageRating | Float | Average artist rating |
| totalEarnings | Int | Lifetime earnings in cents |
| pendingBalance | Int | Withdrawable balance in cents |
| stripeAccountId | String? | Stripe Connect account id |
| stripeConnectedAt | DateTime? | First connected timestamp |
| onboardingQuizScore | Int | Score for reviewer quiz |
| onboardingQuizPassed | Boolean | Gate for queue access |
| completedOnboarding | Boolean | Gate for queue access |
| gemCount | Int | Quality signal |
| flagCount | Int | Quality/restriction signal |
| isRestricted | Boolean | Prevents queue/review actions |

**Relationships:**

- Belongs to: `User`
- Has many: `Review`
- Has many: `ReviewQueue`
- Has many: `Payout`
- Many-to-many: `Genre` (`ReviewerGenres`)

**Key Enums:**

- `ReviewerTier`: `NORMAL`, `PRO`

## Genre

**Purpose:** Categorization for matching tracks to reviewers.

**Key Fields:**

| Field | Type | Description |
|------|------|-------------|
| id | String | Primary key |
| name | String | Unique name |
| slug | String | Unique slug |

**Relationships:**

- Many-to-many: `ArtistProfile` (`ArtistGenres`)
- Many-to-many: `ReviewerProfile` (`ReviewerGenres`)
- Many-to-many: `Track` (`TrackGenres`)

## Track

**Purpose:** A track submitted by an artist for paid/free review.

**Key Fields:**

| Field | Type | Description |
|------|------|-------------|
| id | String | Primary key |
| artistId | String | FK to `ArtistProfile` |
| sourceUrl | String | Source URL (or uploaded file URL) |
| sourceType | TrackSource | `SOUNDCLOUD`/`BANDCAMP`/`YOUTUBE`/`UPLOAD` |
| title | String | Track title |
| status | TrackStatus | Submission lifecycle |
| packageType | PackageType | Purchased package |
| reviewsRequested | Int | Target review count |
| reviewsCompleted | Int | Completed reviews count |
| promoCode | String? | Promo/free-usage marker |
| paidAt | DateTime? | When paid or queued |
| completedAt | DateTime? | When fully completed |
| linkIssueNotifiedAt | DateTime? | Broken-link notification marker |

**Relationships:**

- Belongs to: `ArtistProfile`
- Has one: `Payment`
- Has many: `Review`
- Has many: `ReviewQueue`
- Many-to-many: `Genre` (`TrackGenres`)

**Key Enums:**

- `TrackSource`: `SOUNDCLOUD`, `BANDCAMP`, `YOUTUBE`, `UPLOAD`
- `TrackStatus`: `PENDING_PAYMENT`, `QUEUED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- `PackageType`: `STARTER`, `STANDARD`, `PRO`, `DEEP_DIVE`

## Review

**Purpose:** A single reviewer’s structured feedback for a track.

**Key Fields:**

| Field | Type | Description |
|------|------|-------------|
| id | String | Primary key |
| trackId | String | FK to `Track` |
| reviewerId | String | FK to `ReviewerProfile` |
| status | ReviewStatus | Assignment lifecycle |
| listenDuration | Int | Seconds listened |
| lastHeartbeat | DateTime? | Last client heartbeat timestamp |
| paidAmount | Int | Earnings for this review in cents |
| artistRating | Int? | Rating set by artist (1-5) |
| wasFlagged | Boolean | Flag marker |
| flagReason | String? | Reason text |
| shareId | String? | Public share ID |

**Relationships:**

- Belongs to: `Track`
- Belongs to: `ReviewerProfile`
- Has many: `ReviewTimestamp`

**Key Enums:**

- `ReviewStatus`: `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `EXPIRED`, `SKIPPED`
- `FirstImpression`: `STRONG_HOOK`, `DECENT`, `LOST_INTEREST`

## ReviewQueue

**Purpose:** Queue entry representing an active assignment of a track to a reviewer.

**Key Fields:**

| Field | Type | Description |
|------|------|-------------|
| id | String | Primary key |
| trackId | String | FK to `Track` |
| reviewerId | String | FK to `ReviewerProfile` |
| priority | Int | Higher is more urgent |
| assignedAt | DateTime | When assigned |
| expiresAt | DateTime | Assignment expiration time |

## Payment

**Purpose:** Artist payment record for a track (Stripe checkout).

**Key Fields:**

| Field | Type | Description |
|------|------|-------------|
| id | String | Primary key |
| trackId | String | Unique FK to `Track` |
| amount | Int | Amount in cents |
| stripeSessionId | String | Unique Stripe checkout session id |
| stripePaymentId | String? | PaymentIntent id (nullable) |
| status | PaymentStatus | Payment lifecycle |

**Key Enums:**

- `PaymentStatus`: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`

## Payout

**Purpose:** Reviewer withdrawal record.

**Key Fields:**

| Field | Type | Description |
|------|------|-------------|
| id | String | Primary key |
| reviewerId | String | FK to `ReviewerProfile` |
| amount | Int | Amount in cents |
| method | PayoutMethod | Withdrawal method |
| status | PayoutStatus | Status |
| externalId | String? | Stripe transfer id (or other) |

**Key Enums:**

- `PayoutMethod`: `PAYPAL`, `STRIPE_CONNECT`, `MANUAL`
- `PayoutStatus`: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`

## SupportTicket / SupportMessage

**Purpose:** User-submitted support conversations.

**SupportTicket Fields:** `subject`, `status`, timestamps.

**SupportMessage Fields:** `authorType` (`USER`/`ADMIN`), message body, timestamps.

## Operational / infra tables

- `RateLimit`: used for throttling
- `StripeWebhookEvent`: webhook deduplication
- `LeadCapture`: lead capture tracking for get-feedback funnel
