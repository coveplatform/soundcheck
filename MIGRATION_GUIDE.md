# MixReflect Migration Guide: Peer-to-Peer Credit Model

**Status:** AWAITING APPROVAL — Do not implement until confirmed.

This document covers every change needed to shift MixReflect from the current paid-reviewer model to the peer-to-peer credit exchange model. It includes: landing page, sign-up, onboarding, unified dashboard, database migrations, API changes, Stripe restructuring, existing user handling, and what to remove.

---

## Table of Contents

1. [Architecture Overview: What Changes](#1-architecture-overview)
2. [Database Migrations](#2-database-migrations)
3. [Existing User & Data Migration](#3-existing-user--data-migration)
4. [Landing Page Redesign](#4-landing-page-redesign)
5. [Sign-Up Flow](#5-sign-up-flow)
6. [Onboarding Flow (Unified)](#6-onboarding-flow)
7. [Unified Dashboard](#7-unified-dashboard)
8. [Navigation & Layout Merge](#8-navigation--layout-merge)
9. [Track Submission Flow (Credit-Based)](#9-track-submission-flow)
10. [Review Queue & Review Flow (For Credits)](#10-review-queue--review-flow)
11. [Pro Subscription Changes](#11-pro-subscription-changes)
12. [Credit Top-Up (Contextual Upsell)](#12-credit-top-up-flow)
13. [Track Sales & Affiliate System](#13-track-sales--affiliate-system)
14. [API Route Changes](#14-api-route-changes)
15. [Pages to Remove](#15-pages-to-remove)
16. [Components to Remove or Modify](#16-components-to-remove-or-modify)
17. [Stripe Changes](#17-stripe-changes)
18. [Admin Panel Updates](#18-admin-panel-updates)
19. [Email & Notification Changes](#19-email--notification-changes)
20. [How It Works (User-Facing Explanation)](#20-how-it-works-page)
21. [Implementation Phases](#21-implementation-phases)

---

## 1. Architecture Overview

### The Fundamental Shift

**Before:** Two separate user types (Artist + Reviewer) with separate dashboards, separate onboarding, separate profiles, separate navigation. Artists pay money → Reviewers get paid money.

**After:** One user type (Artist) who can both submit tracks AND review others' tracks for credits. Single dashboard, single onboarding, single navigation. No cash payouts. Revenue comes from Pro subscriptions and credit top-ups.

### What This Means Structurally

```
BEFORE:
  /artist/*     → Artist dashboard, tracks, submit, analytics
  /reviewer/*   → Reviewer dashboard, queue, review form, earnings
  /listener/*   → Alias for /reviewer/*
  Two sidebars, two layouts, two onboarding flows, two profile types

AFTER:
  /dashboard    → Unified home (your tracks + review queue)
  /tracks       → Your track library
  /submit       → Submit track for feedback (costs credits)
  /review       → Review queue (earn credits)
  /review/[id]  → Review form
  /analytics    → Track analytics (Pro)
  /sales        → Track sales (Pro)
  /account      → Settings
  One sidebar, one layout, one onboarding, one profile
```

### Role Merge Summary

| Concept | Before | After |
|---------|--------|-------|
| User types | Artist OR Reviewer (or both) | Just "User" (everyone is an artist who can review) |
| Profiles | ArtistProfile + ListenerProfile (separate) | Single unified profile |
| Onboarding | Artist: name only. Reviewer: intro → quiz → genres | Single flow: name → genres → done |
| Dashboard | Two separate dashboards | One dashboard with sections |
| Navigation | Two sidebars with different links | One sidebar |
| Review queue | Only for ListenerProfile users | Available to all users |
| Payments | Artists pay → Reviewers get paid | Credits only. Pro subscription for premium. |
| Earnings | Reviewer pending balance + payouts | No reviewer earnings. Only artist earnings from track sales (Pro). |

---

## 2. Database Migrations

### Migration 1: Add credit fields to ArtistProfile

```sql
-- Add review credits (earned by reviewing others)
ALTER TABLE "ArtistProfile" ADD COLUMN "reviewCredits" INTEGER NOT NULL DEFAULT 0;

-- Add lifetime credits earned (for stats)
ALTER TABLE "ArtistProfile" ADD COLUMN "totalCreditsEarned" INTEGER NOT NULL DEFAULT 0;

-- Add lifetime credits spent (for stats)
ALTER TABLE "ArtistProfile" ADD COLUMN "totalCreditsSpent" INTEGER NOT NULL DEFAULT 0;

-- Add total peer reviews given (for stats/PRO tier calculation)
ALTER TABLE "ArtistProfile" ADD COLUMN "totalPeerReviews" INTEGER NOT NULL DEFAULT 0;

-- Add average review rating received (for PRO tier)
ALTER TABLE "ArtistProfile" ADD COLUMN "peerReviewRating" FLOAT NOT NULL DEFAULT 0;

-- Add peer review gem count (for PRO tier)
ALTER TABLE "ArtistProfile" ADD COLUMN "peerGemCount" INTEGER NOT NULL DEFAULT 0;

-- Add peer review flag count
ALTER TABLE "ArtistProfile" ADD COLUMN "peerFlagCount" INTEGER NOT NULL DEFAULT 0;

-- Add genre preferences for review matching (artists pick genres they want to review)
-- This reuses the existing Genre many-to-many but needs a new join table
CREATE TABLE "_ArtistReviewGenres" (
  "A" TEXT NOT NULL REFERENCES "ArtistProfile"("id") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "Genre"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "_ArtistReviewGenres_AB_unique" ON "_ArtistReviewGenres"("A", "B");
CREATE INDEX "_ArtistReviewGenres_B_index" ON "_ArtistReviewGenres"("B");
```

### Migration 2: Link reviews to ArtistProfile (peer reviews)

```sql
-- Allow reviews to be linked to an ArtistProfile (peer reviewer) instead of ListenerProfile
ALTER TABLE "Review" ADD COLUMN "peerReviewerArtistId" TEXT REFERENCES "ArtistProfile"("id") ON DELETE SET NULL;
CREATE INDEX "Review_peerReviewerArtistId_idx" ON "Review"("peerReviewerArtistId");

-- Add flag for peer review vs paid review
ALTER TABLE "Review" ADD COLUMN "isPeerReview" BOOLEAN NOT NULL DEFAULT false;
```

### Migration 3: Add review queue for artists

```sql
-- Allow ReviewQueue to reference ArtistProfile as reviewer
ALTER TABLE "ReviewQueue" ADD COLUMN "artistReviewerId" TEXT REFERENCES "ArtistProfile"("id") ON DELETE CASCADE;
CREATE INDEX "ReviewQueue_artistReviewerId_idx" ON "ReviewQueue"("artistReviewerId");
```

### Migration 4: Update Track model for credit-based submission

```sql
-- Track how many credits were spent (instead of payment amount)
ALTER TABLE "Track" ADD COLUMN "creditsSpent" INTEGER NOT NULL DEFAULT 0;

-- Add new status for credit-based submission (no payment needed)
-- UPLOADED status already exists, we'll repurpose the flow:
-- UPLOADED → QUEUED (when credits spent) → IN_PROGRESS → COMPLETED
```

### Migration 5: Grant existing users signup credits

```sql
-- Give all existing artists 2 free credits as migration bonus
UPDATE "ArtistProfile" SET "reviewCredits" = 2;
```

### What NOT to migrate (keep for backwards compatibility)

- **ListenerProfile table** — keep it. Existing reviewers have data here. Don't delete.
- **Review.reviewerId** — keep it. Existing reviews reference ListenerProfile.
- **Payout table** — keep it. Existing payout history needs to remain accessible.
- **Payment table** — keep it. Existing payment records for old tracks.
- **Purchase table** — keep it. Existing purchase records.

### Prisma Schema Changes

```prisma
model ArtistProfile {
  // ... existing fields ...

  // NEW: Credit system
  reviewCredits       Int      @default(0)    // Current credit balance
  totalCreditsEarned  Int      @default(0)    // Lifetime earned
  totalCreditsSpent   Int      @default(0)    // Lifetime spent
  totalPeerReviews    Int      @default(0)    // Reviews given as peer
  peerReviewRating    Float    @default(0)    // Avg rating on reviews given
  peerGemCount        Int      @default(0)    // Gems received on peer reviews
  peerFlagCount       Int      @default(0)    // Flags received
  reviewGenres        Genre[]  @relation("ArtistReviewGenres") // Genres willing to review

  // NEW: Reviews given as peer reviewer
  peerReviews         Review[] @relation("PeerReviews")
  peerQueueEntries    ReviewQueue[] @relation("ArtistReviewQueue")
}

model Review {
  // ... existing fields ...

  // NEW: Peer review support
  peerReviewerArtistId String?
  peerReviewerArtist   ArtistProfile? @relation("PeerReviews", fields: [peerReviewerArtistId], references: [id])
  isPeerReview         Boolean @default(false)
}

model ReviewQueue {
  // ... existing fields ...

  // NEW: Artist as reviewer
  artistReviewerId String?
  artistReviewer   ArtistProfile? @relation("ArtistReviewQueue", fields: [artistReviewerId], references: [id])
}
```

---

## 3. Existing User & Data Migration

### Handling Current Users (90 users)

| User Type | Count (est.) | Migration Action |
|-----------|-------------|------------------|
| Artists only | ~60 | Grant 2 credits. No other changes. Dashboard redirects to new unified dashboard. |
| Reviewers only | ~20 | Create ArtistProfile automatically. Copy genre preferences. Grant 2 credits. Mark as needing onboarding (set artist name). |
| Dual role (artist + reviewer) | ~10 | Keep both profiles. Grant 2 credits to ArtistProfile. Copy reviewer genres to ArtistProfile.reviewGenres. |

### Handling Existing Tracks (45 tracks)

- **Tracks with completed reviews:** No change. Reviews display as normal. Old reviews keep `reviewerId` (ListenerProfile) reference.
- **Tracks with pending reviews:** Complete under old system. Any ASSIGNED/IN_PROGRESS reviews continue with existing reviewers.
- **Tracks in QUEUED state:** Transition to new credit system. These were already paid for, so they continue normally.

### Handling Existing Reviewers

| Scenario | Action |
|----------|--------|
| Reviewer with earnings history | Keep ListenerProfile intact for records. Create ArtistProfile. They can still see old earnings in account page (read-only). |
| Reviewer with pending balance | Allow them to withdraw remaining balance one final time (30-day window). Then freeze payouts. |
| Reviewer with PRO tier | Transfer PRO status to ArtistProfile: set `peerGemCount = ListenerProfile.gemCount`, preserve rating. |
| Reviewer with Stripe Connect | Keep for final payout. Don't delete. |

### Handling 6 Paying Subscribers

- Current Pro subscribers continue at $9.95/month
- Their benefits change to the new Pro benefits (10 credits/month instead of 20, plus track sales, priority, etc.)
- Send email explaining the change and new benefits
- If subscription renewal fails or they cancel, no action needed — new model doesn't depend on them

### Data Migration Script (to run once)

```typescript
// migration-to-credit-model.ts

async function migrateToCredits() {
  // 1. Grant all existing artists 2 credits
  await prisma.artistProfile.updateMany({
    data: { reviewCredits: 2 }
  });

  // 2. For reviewer-only users, create ArtistProfile
  const reviewerOnlyUsers = await prisma.user.findMany({
    where: {
      isReviewer: true,
      isArtist: false,
    },
    include: { listenerProfile: { include: { genres: true } } }
  });

  for (const user of reviewerOnlyUsers) {
    await prisma.artistProfile.create({
      data: {
        userId: user.id,
        artistName: user.name || "Artist",  // Placeholder, they'll set in onboarding
        reviewCredits: 2,
        reviewGenres: {
          connect: user.listenerProfile?.genres.map(g => ({ id: g.id })) || []
        }
      }
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { isArtist: true }
    });
  }

  // 3. For dual-role users, copy reviewer genres to artist review genres
  const dualRoleUsers = await prisma.user.findMany({
    where: { isArtist: true, isReviewer: true },
    include: {
      listenerProfile: { include: { genres: true } },
      artistProfile: true
    }
  });

  for (const user of dualRoleUsers) {
    if (user.artistProfile && user.listenerProfile) {
      await prisma.artistProfile.update({
        where: { id: user.artistProfile.id },
        data: {
          reviewCredits: 2,
          peerGemCount: user.listenerProfile.gemCount,
          peerReviewRating: user.listenerProfile.averageRating,
          totalPeerReviews: user.listenerProfile.totalReviews,
          reviewGenres: {
            connect: user.listenerProfile.genres.map(g => ({ id: g.id }))
          }
        }
      });
    }
  }

  // 4. Pro subscribers: update credit grant to 10 (new model)
  // Handled by webhook on next billing cycle
}
```

---

## 4. Landing Page Redesign

### Current Landing Page (`src/app/page.tsx`)

Currently promotes: paid reviews, reviewer earnings, package pricing (Starter $4.95 / Standard $14.95), and "For Reviewers" CTA.

### New Landing Page Structure

```
HERO SECTION
├── Headline: "Get real feedback on your music — for free"
├── Subheadline: "Upload your track. Review other artists. Get honest,
│   structured feedback from fellow musicians who understand your craft."
├── CTA: "Get Started Free" → /signup
├── Secondary: "See how it works" → scrolls to #how-it-works
└── Social proof: "X artists exchanging feedback" / "X reviews given"

HOW IT WORKS SECTION (#how-it-works)
├── Step 1: "Upload your track"
│   └── "Share a SoundCloud, Bandcamp, YouTube link or upload directly"
├── Step 2: "Review other artists"
│   └── "Listen to genre-matched tracks and give structured feedback.
│        Each review you give earns 1 credit."
├── Step 3: "Get feedback on your music"
│   └── "Spend credits to get reviews. Choose 3, 5, or 10 reviews
│        from artists who know your genre."
└── Visual: Simple 3-step illustration or animation

REVIEW DEMO SECTION
├── Show an example review (use existing review display component)
├── Highlight: structured format, timestamps, scores, actionable feedback
└── "This is what you'll get — and what you'll give"

TRACK REPORT SECTION (keep existing)
├── Show the track detail page with reviews
└── "See patterns across multiple reviews"

PRICING SECTION
├── FREE TIER (emphasized, primary)
│   ├── Price: $0
│   ├── "2 credits to start"
│   ├── "Earn unlimited credits by reviewing"
│   ├── "3 track uploads"
│   ├── "Genre-matched peer reviews"
│   ├── "Structured feedback with scores"
│   └── CTA: "Get Started Free"
│
├── PRO TIER ($9.95/month, secondary)
│   ├── "Everything in Free, plus:"
│   ├── "10 credits/month — no reviewing required"
│   ├── "Priority queue — 24h turnaround"
│   ├── "Expert reviews from top-rated artists"
│   ├── "Sell your music — keep 85%"
│   ├── "Unlimited uploads + stems"
│   ├── "Analytics dashboard"
│   └── CTA: "Start Pro"
│
└── No mention of credit top-ups here (they're a contextual upsell, not a product)

COMMUNITY SECTION
├── "Join X artists giving each other real feedback"
├── Genre diversity showcase
└── Testimonials or review snippets

FAQ SECTION (updated)
├── "Is it really free?" → Yes, earn credits by reviewing
├── "How do credits work?" → 1 review given = 1 credit. Credits get you reviews.
├── "Who reviews my music?" → Other artists on the platform, matched by genre.
├── "What if I don't want to review others?" → Pro gives you 10 credits/month,
│   or buy credit packs.
├── "What makes a good review?" → Structured form ensures quality. Minimum
│   listen time, word count, and community ratings.
├── "What is Pro?" → Monthly sub for convenience + premium features.
├── "Can I sell my music?" → Yes, Pro members can sell tracks and keep 85%.
└── "What genres are supported?" → [list genres]

FOOTER
├── Remove "For Reviewers" CTA entirely
├── Keep: Terms, Privacy, Support
└── Add: "How It Works" link
```

### Files to Modify

- `src/app/page.tsx` — Complete rewrite of hero, pricing, FAQ, remove reviewer CTA
- Remove social proof stats that reference "paid to reviewers" ($18,342)
- Update stats to: tracks reviewed, active artists, reviews exchanged

---

## 5. Sign-Up Flow

### Current Sign-Up

- `src/app/(auth)/signup/page.tsx`
- Email/password form, Google OAuth
- Redirects to `/artist/submit` after signup
- Tracks analytics events (artistSignup)

### New Sign-Up

**Keep the same page** but update:

```
SIGN-UP PAGE
├── Same form: email, password, Google OAuth
├── Remove any "role selection" (everyone is the same role now)
├── After signup:
│   → Redirect to /onboarding (new unified onboarding)
│   → NOT to /artist/submit
├── Update analytics events: "signup" (not "artistSignup")
└── Welcome copy: "Create your free account" (not "Create your artist account")
```

### Files to Modify

- `src/app/(auth)/signup/page.tsx` — Update redirect target, remove role-specific copy
- `src/app/(auth)/login/page.tsx` — Update redirect logic: always go to `/dashboard` (not role-based)

---

## 6. Onboarding Flow

### Current Onboarding

**Artist** (`/artist/onboarding`): Just asks for artist name. One step.

**Reviewer** (`/reviewer/onboarding`): Three steps — intro → quiz (4 music theory questions, pass 3/4) → genre selection + country.

### New Unified Onboarding (`/onboarding`)

Single flow, replaces both. No quiz needed (all users are artists, they inherently understand music).

```
STEP 1: "What's your artist name?"
├── Text input for artist name
├── "This is how you'll appear to other artists"
└── "Continue" button

STEP 2: "What genres do you make?"
├── Genre selector (pick 1-5 genres)
├── "We'll use this to match you with relevant tracks to review"
├── These genres serve dual purpose:
│   1. Tag your uploaded tracks by default
│   2. Match you with tracks to review
└── "Continue" button

STEP 3: "How it works" (brief explainer, not a separate page)
├── Inline explanation:
│   "You have 2 credits to start.
│    Each credit = 1 review on your track.
│    Earn more credits by reviewing other artists' tracks."
├── Simple visual: Upload → Review others → Get reviewed
├── "Got it, take me to my dashboard" button
└── Links to /dashboard
```

### Why No Quiz

The quiz (`/reviewer/onboarding` step 2) tested basic music knowledge (compression, BPM, EQ, DAW). This was needed when reviewers were random people being paid to listen. In the new model, every reviewer is an artist — they already know this stuff. The quality gate is now the structured review form + rating system + credit denial for bad reviews.

### Files to Create/Modify

- **Create:** `src/app/(dashboard)/onboarding/page.tsx` — New unified 3-step onboarding
- **Modify:** `src/app/(auth)/signup/page.tsx` — Redirect to `/onboarding`
- **Modify:** `src/app/(auth)/login/page.tsx` — Check if onboarding complete, redirect accordingly
- **Remove from active routing:** `src/app/(dashboard)/artist/onboarding/page.tsx`
- **Remove from active routing:** `src/app/(dashboard)/reviewer/onboarding/page.tsx`

### Onboarding Completion Check

Currently the artist dashboard checks `artistProfile` exists. The reviewer dashboard checks `completedOnboarding` and `onboardingQuizPassed`.

New check: ArtistProfile exists AND has `artistName` set AND has at least 1 genre in `reviewGenres`. If not, redirect to `/onboarding`.

---

## 7. Unified Dashboard

### Current Dashboards

**Artist Dashboard** (`/artist/dashboard`):
- Plan label + review credits
- Stats: Track count, In Review count, Total Earnings
- Next action card (upload/request reviews)
- Recent tracks (3 max) with status badges

**Reviewer Dashboard** (`/reviewer/dashboard`):
- Checks: email verified, onboarding done, quiz passed, not restricted
- Stats: Total reviews, Average rating, Queue count
- Pending reviews (3 max)
- Sidebar: earnings, tier progress, genres

### New Unified Dashboard (`/dashboard`)

```
DASHBOARD LAYOUT
├── HEADER
│   ├── "Welcome back, {artistName}"
│   ├── Credit balance: "🎵 {n} credits" (prominent, always visible)
│   ├── Pro badge (if subscribed)
│   └── Quick actions: [Submit Track] [Review Tracks]
│
├── STATS ROW (4 cards)
│   ├── "Your Tracks" — count of tracks uploaded
│   ├── "Credits" — current balance (with + icon to earn more)
│   ├── "Reviews Given" — total peer reviews completed
│   └── "Avg Review Rating" — how your reviews are rated by others
│
├── MY TRACKS SECTION
│   ├── Header: "Your Tracks" with [View All] link → /tracks
│   ├── Show latest 3 tracks with:
│   │   ├── Artwork, title, genres
│   │   ├── Status badge (Uploaded / Awaiting Reviews / In Progress / Completed)
│   │   ├── Review count: "3/5 reviews"
│   │   └── Action: [Request Reviews] or [View Reviews]
│   └── If no tracks: empty state with [Upload Your First Track] CTA
│
├── REVIEW QUEUE SECTION
│   ├── Header: "Tracks to Review" with [View Queue] link → /review
│   ├── "Review tracks to earn credits — 1 review = 1 credit"
│   ├── Show up to 3 tracks in queue with:
│   │   ├── Track title, artist name, genre tags
│   │   └── [Review] button
│   ├── If queue empty: "No tracks in your queue right now. Check back soon!"
│   └── Below queue: "Your review genres: {genre tags}" with [Edit] link
│
├── CREDIT EXPLAINER (show once, dismissable)
│   ├── "How credits work:"
│   ├── "1. Upload a track and choose how many reviews you want (costs credits)"
│   ├── "2. Review other artists' tracks to earn credits (1 review = 1 credit)"
│   ├── "3. Your 2 starter credits are ready to use"
│   └── [Dismiss] button (sets a flag like hasSeenWelcome)
│
└── PRO UPSELL (only for free users, subtle)
    ├── "Save time with Pro — 10 credits/month + sell your music"
    └── [Learn More] → /pro or pricing section
```

### Files to Create/Modify

- **Create:** `src/app/(dashboard)/dashboard/page.tsx` — New unified dashboard
- **Modify:** `src/app/(dashboard)/artist/page.tsx` — Redirect to `/dashboard`
- **Modify:** `src/app/(dashboard)/reviewer/dashboard/page.tsx` — Redirect to `/dashboard`
- **Modify:** `src/app/(dashboard)/listener/dashboard/page.tsx` — Redirect to `/dashboard`

---

## 8. Navigation & Layout Merge

### Current Navigation

**Artist Sidebar** (`artist-sidebar.tsx`):
- Links: Dashboard, Tracks, Analytics, Sales, Discover, Earnings
- "Switch to Listener" button for dual-role users

**Reviewer Nav** (`nav.tsx` / DashboardNav):
- Links: Dashboard, Listening Queue, History, Earnings
- Color coded: lime (artist) vs orange (reviewer)
- "Switch to Artist" button

### New Unified Sidebar

One sidebar for all users. No role switching needed.

```
SIDEBAR
├── Logo (MixReflect)
├── ──────────────
├── Dashboard          → /dashboard
├── My Tracks          → /tracks
├── Submit Track       → /submit
├── ──────────────
├── Review Queue       → /review         (with badge: {n} pending)
├── Review History     → /review/history
├── ──────────────
├── Analytics          → /analytics      (Pro badge if not subscribed)
├── Sales              → /sales          (Pro badge if not subscribed)
├── ──────────────
├── CREDIT BALANCE
│   ├── "{n} credits"
│   ├── [Earn Credits] → /review
│   └── [Get Pro] → /pro  (or [Manage] if subscribed)
├── ──────────────
├── Settings           → /account
└── Sign Out

MOBILE BOTTOM NAV (5 items)
├── Dashboard  → /dashboard
├── Tracks     → /tracks
├── Submit     → /submit (center, prominent)
├── Review     → /review
└── Account    → /account
```

### Color Scheme

Drop the dual color system (lime/orange). Use a single brand color consistently.

### Files to Create/Modify

- **Create:** `src/components/dashboard/sidebar.tsx` — New unified sidebar
- **Create:** `src/app/(dashboard)/layout.tsx` — New unified layout using single sidebar
- **Remove from active use:** `src/components/dashboard/artist-sidebar.tsx`
- **Remove from active use:** `src/components/dashboard/artist-nav.tsx`
- **Modify:** `src/components/dashboard/nav.tsx` — Simplify to single-role nav or replace entirely

### Layout Structure

```
NEW LAYOUT (src/app/(dashboard)/layout.tsx)
├── Fetch: user session, artistProfile (with credits, genres, subscription)
├── Check: onboarding complete? If not → redirect to /onboarding
├── Check: email verified? Show banner if not
├── Render:
│   ├── <Sidebar credits={n} isPro={bool} pendingReviews={n} />
│   └── <main className="md:pl-64">{children}</main>
└── Wrap with AudioProvider (for track playback)
```

---

## 9. Track Submission Flow

### Current Flow (`/artist/submit`)

Multi-step: Artist name → Track upload → Track details → Package selection → Stripe checkout → Success page

### New Flow (`/submit`)

Multi-step, but credits instead of payment:

```
STEP 1: TRACK UPLOAD (same as current step 2)
├── Toggle: Link vs File upload
├── Link: SoundCloud / Bandcamp / YouTube URL
├── File: Drag-and-drop MP3
├── Auto-fetch metadata (title, artwork)
└── "Continue"

STEP 2: TRACK DETAILS (same as current step 3)
├── Title (auto-filled)
├── Genre selector (1-3, pre-filled from artist genres)
├── Visibility: Private / Public
└── "Continue"

STEP 3: REQUEST REVIEWS (NEW — replaces checkout)
├── "How many reviews do you want?"
├── Three options (radio/cards):
│   ├── 3 reviews — 3 credits
│   ├── 5 reviews — 5 credits (recommended)
│   └── 10 reviews — 10 credits
├── Show current balance: "You have {n} credits"
├── If enough credits:
│   └── "Submit for Review" button → deducts credits, queues track
├── If NOT enough credits:
│   ├── Balance shown in red: "You need {x} more credits"
│   ├── [Review tracks to earn credits] → /review (primary)
│   ├── [Buy {x} credits for ${price}] (secondary, subtle)
│   └── [Upgrade to Pro — 10 credits/month] (upsell)
└── Optional: "Submit without reviews" (just upload, request later)

SUCCESS PAGE (simplified, no Stripe polling needed)
├── "Track Submitted! 🎉"
├── "{n} reviews requested — we're matching you with artists now"
├── "Reviews typically arrive within 24-72 hours"
├── [View Track] → /tracks/{id}
├── [Submit Another] → /submit
└── [Earn More Credits] → /review
```

### Key Differences

1. **No Stripe checkout** — credits deducted instantly
2. **No package names** (Starter/Standard) — just "how many reviews?"
3. **Credit insufficiency** is the upsell moment, not a paywall
4. **Track can be uploaded without requesting reviews** — useful for Pro users managing a library

### Files to Modify

- **Rewrite:** `src/app/(dashboard)/artist/submit/page.tsx` → Move to `src/app/(dashboard)/submit/page.tsx`
- **Remove:** `src/app/(dashboard)/artist/submit/checkout/page.tsx` — No more Stripe checkout for reviews
- **Rewrite:** `src/app/(dashboard)/artist/submit/success/page.tsx` → Move to `src/app/(dashboard)/submit/success/page.tsx`
- **Modify:** `src/app/api/tracks/route.ts` (POST) — Accept `reviewsRequested` without payment, deduct credits
- **Remove need for:** `src/app/api/tracks/[id]/checkout/route.ts` — No payment checkout for reviews
- **Modify:** `src/app/api/tracks/[id]/request-reviews/route.ts` — Deduct credits instead of freeReviewCredits

---

## 10. Review Queue & Review Flow

### Current Flow

**Reviewer queue** (`/reviewer/queue`): Shows assigned tracks with genre match, expiration timer. Reviewer clicks "Listen" to start.

**Review form** (`/reviewer/review/[id]`): Track player, heartbeat tracking, structured form (first impression, scores, best/weakest parts, engagement signals, notes). Submit button unlocks after 3 minutes.

### New Flow

The review queue and form work identically — the only change is WHO accesses them (all users, not just reviewers) and WHAT they earn (credits, not cash).

#### Review Queue (`/review`)

```
REVIEW QUEUE PAGE
├── Header: "Review Tracks — Earn Credits"
├── Subheader: "Each quality review earns you 1 credit"
├── Your genres: {tags} [Edit genres]
│
├── AVAILABLE TRACKS (genre-matched)
│   ├── For each track:
│   │   ├── Track title, artist name
│   │   ├── Genre tags
│   │   ├── Source badge (SoundCloud/Bandcamp/YouTube/Upload)
│   │   ├── Duration (if known)
│   │   └── [Review This Track] button
│   └── If none: "No tracks in your genre right now. Check back soon!"
│
├── ASSIGNED TO YOU (already picked up, in progress)
│   ├── Track title + time remaining
│   └── [Continue Review] button
│
└── STATS SIDEBAR
    ├── Credits earned today: {n}
    ├── Total reviews given: {n}
    ├── Your rating: {stars}/5
    ├── Gem count: {n}
    └── PRO reviewer status: {tier} (with progress bar if close)
```

#### Review Form (`/review/[id]`)

**Keep the existing review form almost entirely.** It's well-designed. Changes:

```
REVIEW FORM CHANGES
├── Remove: "Earnings: $0.50" / "$1.50" display → replace with "Credit: +1"
├── Remove: Any reference to cash payout
├── Add: "Complete this review to earn 1 credit" at top
├── Keep: Everything else (player, heartbeat, structured form, 3-min gate,
│         word count, quality checks)
├── On submit success:
│   ├── "Review submitted! +1 credit earned"
│   ├── Show new credit balance
│   └── [Review another track] / [Back to dashboard]
└── On submit fail (quality check):
    ├── "Review didn't meet quality standards — no credit earned"
    └── Explain what was wrong (too short, low effort, etc.)
```

### Queue Assignment Logic Changes

Currently `queue.ts` → `getEligibleReviewers()` queries ListenerProfile. Need to also (or instead) query ArtistProfile for peer reviewers.

```
NEW: getEligiblePeerReviewers(trackId)
├── Query ArtistProfile where:
│   ├── Has completed onboarding (artistName set + reviewGenres.length > 0)
│   ├── User.emailVerified is not null
│   ├── Account age > 24 hours (keep existing gate)
│   ├── Has NOT already reviewed this track
│   ├── Is NOT the track's own artist (can't review your own)
│   ├── Genre match: ArtistProfile.reviewGenres overlaps with Track.genres
│   │   (use existing genre hierarchy expansion)
│   └── Not flagged/restricted (peerFlagCount < threshold)
├── Sort by:
│   ├── PRO tier first (peerGemCount >= 10 OR totalPeerReviews >= 50 + rating >= 4.7)
│   ├── Then by peerReviewRating desc
│   ├── Then by peerGemCount desc
│   └── Then by totalPeerReviews desc
└── Return sorted list
```

### Files to Create/Modify

- **Create:** `src/app/(dashboard)/review/page.tsx` — New review queue (adapt from `/reviewer/queue`)
- **Create:** `src/app/(dashboard)/review/[id]/page.tsx` — Review form (adapt from `/reviewer/review/[id]`)
- **Create:** `src/app/(dashboard)/review/history/page.tsx` — Review history (adapt from `/reviewer/history`)
- **Modify:** `src/lib/queue.ts` — Add `getEligiblePeerReviewers()`, modify assignment logic
- **Modify:** `src/app/api/reviews/route.ts` (POST) — Award credit to ArtistProfile instead of cash to ListenerProfile
- **Modify:** `src/app/api/queue/route.ts` (GET) — Query both ListenerProfile and ArtistProfile review queues

---

## 11. Pro Subscription Changes

### Current Pro

- $9.95/month
- 20 review credits (fulfilled by paid reviewers at $0.50-1.50 each)
- Unlimited uploads
- Analytics, sales

### New Pro

- $9.95/month (same price)
- **10 credits/month** (fulfilled by peer reviewers at $0 cost)
- Priority queue (24h turnaround vs 48-72h)
- PRO-tier artist reviews (matched to highest-rated peer reviewers)
- Track sales (keep 85%) — **gated to Pro only** (already implemented)
- Affiliate system access
- Unlimited uploads + stems
- Analytics dashboard

### Stripe Subscription Webhook Changes

Currently `checkout.session.completed` and `invoice.payment_succeeded` grant `freeReviewCredits += 20`.

Change to: `artistProfile.reviewCredits += 10` on each billing cycle.

### Files to Modify

- **Modify:** `src/app/api/webhooks/stripe/route.ts` — Change credit grant from 20 freeReviewCredits to 10 reviewCredits
- **Modify:** `src/app/api/subscriptions/checkout/route.ts` — Update metadata/description
- **Modify:** Pricing section in landing page and any subscription management UI
- **Keep:** `src/app/api/subscriptions/portal/route.ts` — No change, Stripe portal still works
- **Keep:** `src/app/api/subscriptions/verify/route.ts` — Update to check new fields

---

## 12. Credit Top-Up Flow

### Current Credit Purchase

`/api/review-credits/checkout` — Sells 5/20/50 credit packs at $5/$18/$40 AUD.

### New Credit Top-Up

NOT a page. Contextual upsell shown at two trigger points:

**Trigger 1:** Track submission with insufficient credits (`/submit` step 3)
**Trigger 2:** Dashboard when credits = 0 and user has tracks without reviews

```
CREDIT TOP-UP MODAL/INLINE
├── "Need more credits?"
├── Pack options:
│   ├── 3 credits — $2.95
│   ├── 10 credits — $7.95
│   └── 25 credits — $14.95
├── [Buy] → Stripe checkout → credits added
├── Divider: "— or —"
├── "Get 10 credits/month with Pro ($9.95/month)"
│   └── [Upgrade to Pro]
└── "Or review tracks to earn free credits"
    └── [Go to Review Queue]
```

### Files to Modify

- **Modify:** `src/app/api/review-credits/checkout/route.ts` — Update pack sizes and prices ($2.95/$7.95/$14.95 for 3/10/25)
- **Create:** `src/components/credits/credit-topup-prompt.tsx` — Reusable component for the inline upsell
- **Remove:** Any standalone "buy credits" page (credits are contextual, not a destination)

---

## 13. Track Sales & Affiliate System

### No Changes Needed

The track sales system (`/t/[trackShareId]`), affiliate links, ExternalPurchase flow, and revenue split (85% Pro / 80% Free) remain exactly as-is. These are already:

- Gated to Pro subscribers (track sales)
- Working with Stripe checkout
- Tracking affiliate commissions

The only change: artist earnings from sales are credited to `ArtistProfile.pendingBalance` (already the case). The payout mechanism for artist earnings (Stripe Connect) remains.

### Files: No modifications needed for sales/affiliate system

---

## 14. API Route Changes

### Routes to Modify

| Route | Change |
|-------|--------|
| `POST /api/tracks` | Accept `reviewsRequested` without payment. Deduct `artistProfile.reviewCredits`. Set status to QUEUED if credits spent, UPLOADED if no reviews requested. |
| `POST /api/tracks/[id]/request-reviews` | Deduct from `reviewCredits` instead of `freeReviewCredits`. Support requesting reviews on UPLOADED tracks. |
| `POST /api/reviews` (submit) | Award 1 credit to `peerReviewerArtist.reviewCredits` and increment `totalCreditsEarned` + `totalPeerReviews`. No cash payout. |
| `GET /api/queue` | Return tracks assigned to current user's ArtistProfile (via ReviewQueue.artistReviewerId), not just ListenerProfile. |
| `POST /api/review-credits/checkout` | Update pack sizes: 3/$2.95, 10/$7.95, 25/$14.95. Credits go to `reviewCredits`. |
| `POST /api/webhooks/stripe` | On subscription renewal: add 10 to `reviewCredits` (not 20 to `freeReviewCredits`). |
| `POST /api/auth/signup` | Always set `isArtist: true`. Don't set `isReviewer` for new users. |
| `POST /api/auth/set-artist` | May not be needed anymore (all users are artists). Keep for backwards compat. |
| `POST /api/artist/profile` | Accept `reviewGenres` in addition to existing fields. |
| `PATCH /api/listener/profile` | Keep working for existing users but route new users through artist profile. |
| `GET /api/platform-stats` | Update stats: "artists exchanging feedback" instead of "active listeners". |

### Routes to Remove (or deprecate)

| Route | Reason |
|-------|--------|
| `POST /api/tracks/[id]/checkout` | No Stripe checkout for reviews anymore. Credits deducted directly. |
| `POST /api/listener/payouts` | No more reviewer cash payouts (keep route for final 30-day withdrawal window, then remove). |
| `POST /api/listener/stripe/connect` | No new Stripe Connect for reviewers. Keep for existing users' final payout. |
| `POST /api/listener/stripe/dashboard` | Same as above. |
| `POST /api/reviewer/payouts` | Alias for listener payouts. Same treatment. |
| `POST /api/reviewer/stripe/connect` | Same. |
| `POST /api/reviewer/stripe/dashboard` | Same. |
| `POST /api/purchases` | Reviewer track purchases for $0.50 — remove. Track sales handle this now. |
| `POST /api/auth/trial-signup` | Quick signup flow for old model. Remove or redirect. |

### Routes to Create

| Route | Purpose |
|-------|---------|
| `GET /api/review-queue` | Get peer review queue for current user's ArtistProfile |
| `POST /api/peer-reviews` | Submit peer review (or modify existing `/api/reviews` POST to handle both) |
| `GET /api/credits` | Get current credit balance + history |

### Routes Unchanged

All of these continue as-is:
- `/api/auth/*` (except signup changes above)
- `/api/reviews/[id]/heartbeat`, `/skip`, `/unplayable`, `/flag`, `/gem`
- `/api/tracks/[id]/sharing`, `/stems`, `/affiliate-links`
- `/api/t/[trackShareId]/*` (public track + sales)
- `/api/uploads/*`
- `/api/genres`
- `/api/metadata`
- `/api/subscriptions/*` (with webhook changes)
- `/api/support/*`
- `/api/admin/*` (with updates noted in section 18)
- `/api/account/*`
- `/api/webhooks/stripe` (with changes noted above)

---

## 15. Pages to Remove

These pages should redirect or be removed entirely:

| Page | Action |
|------|--------|
| `/artist/dashboard` | Redirect to `/dashboard` |
| `/artist/onboarding` | Redirect to `/onboarding` |
| `/artist/submit` | Redirect to `/submit` |
| `/artist/submit/checkout` | **Remove entirely** — no Stripe checkout for reviews |
| `/artist/submit/success` | Redirect to `/submit/success` |
| `/artist/tracks` | Redirect to `/tracks` |
| `/artist/tracks/[id]` | Redirect to `/tracks/[id]` |
| `/artist/tracks/[id]/request-reviews` | Redirect to `/tracks/[id]/request-reviews` |
| `/artist/analytics` | Redirect to `/analytics` |
| `/artist/sales` | Redirect to `/sales` |
| `/artist/earnings` | Redirect to `/earnings` |
| `/artist/account` | Redirect to `/account` |
| `/artist/reviewers` | **Remove** — no separate reviewer listing |
| `/artist/reviewers/[id]` | **Remove** |
| `/reviewer/dashboard` | Redirect to `/dashboard` |
| `/reviewer/onboarding` | Redirect to `/onboarding` |
| `/reviewer/queue` | Redirect to `/review` |
| `/reviewer/review/[id]` | Redirect to `/review/[id]` |
| `/reviewer/history` | Redirect to `/review/history` |
| `/reviewer/earnings` | **Remove** — no reviewer earnings (show legacy data in /account if needed) |
| `/reviewer/account` | Redirect to `/account` |
| `/listener/*` | All listener aliases redirect to new paths |

### Keep These Pages (moved to new paths)

| Old Path | New Path |
|----------|----------|
| `/artist/dashboard` | `/dashboard` |
| `/artist/tracks` | `/tracks` |
| `/artist/tracks/[id]` | `/tracks/[id]` |
| `/artist/submit` | `/submit` |
| `/artist/analytics` | `/analytics` |
| `/artist/sales` | `/sales` |
| `/artist/account` | `/account` |
| `/reviewer/queue` | `/review` |
| `/reviewer/review/[id]` | `/review/[id]` |
| `/reviewer/history` | `/review/history` |

---

## 16. Components to Remove or Modify

### Remove

| Component | Reason |
|-----------|--------|
| `artist-sidebar.tsx` | Replaced by unified sidebar |
| `artist-nav.tsx` | Replaced by unified sidebar |
| `nav.tsx` (DashboardNav) | Replaced by unified sidebar (or heavily simplified) |
| `payout-actions.tsx` | No more reviewer payouts (keep temporarily for 30-day wind-down) |
| `review-upsell.tsx` | Old upsell for paid review packages — replace with credit-based messaging |
| `welcome-modal.tsx` | Replace with inline onboarding explainer on dashboard |

### Modify

| Component | Changes |
|-----------|---------|
| `review-display.tsx` | Keep as-is. Works for both old paid reviews and new peer reviews. |
| `review-carousel.tsx` | No changes needed. |
| `review-rating.tsx` | Keep. Artists still rate reviews they receive. |
| `review-flag.tsx` | Keep. Flagged peer reviews = no credit for reviewer. |
| `review-gem.tsx` | Keep. Gem peer reviews boost reviewer's PRO tier progress. |
| `account-settings-client.tsx` | Remove subscription/credit section's old copy. Remove "Roles" section. Remove reviewer-specific fields. Add credit balance display. Add review genre preferences. |
| `genre-selector.tsx` | No changes. Already supports both "artist" and "reviewer" variants. |
| `stem-uploader.tsx` | No changes. |
| `track-play-button.tsx` | No changes. |
| `track-cancel-button.tsx` | Update to refund credits (not Stripe refund). |
| `track-sharing-button.tsx` | No changes. |

### Create

| Component | Purpose |
|-----------|---------|
| `sidebar.tsx` | New unified sidebar with credit display |
| `credit-balance.tsx` | Reusable credit balance display (number + earn/buy actions) |
| `credit-topup-prompt.tsx` | Inline upsell for buying credits (shown contextually) |
| `review-queue-card.tsx` | Card showing a track available for peer review |
| `onboarding-steps.tsx` | Unified onboarding flow component |

---

## 17. Stripe Changes

### Remove

| Item | Reason |
|------|--------|
| Track review checkout (`/api/tracks/[id]/checkout`) | Credits replace payment |
| Reviewer payout transfers | No more cash payouts to reviewers |
| NORMAL tier review payments ($0.50) | Replaced by credit system |
| PRO tier review payments ($1.50) | PRO reviewers earn credits, not cash |

### Keep

| Item | Reason |
|------|--------|
| Pro subscription ($9.95/month) | Primary revenue stream |
| Credit top-up checkout | Secondary revenue stream |
| Track sales checkout (`/t/[trackShareId]/checkout`) | Pro feature |
| Artist payout via Stripe Connect | Artists earn from track sales |
| Webhook handler | Still needed for subscriptions, credit purchases, track sales |

### Modify

| Item | Change |
|------|--------|
| Subscription webhook | Grant 10 `reviewCredits` instead of 20 `freeReviewCredits` |
| Credit checkout | New pack sizes: 3/$2.95, 10/$7.95, 25/$14.95 |
| Webhook idempotency | Keep as-is (StripeWebhookEvent dedup) |

### Stripe Products to Update (in Stripe Dashboard)

1. **MixReflect Pro** subscription — Update description to reflect new benefits
2. **Review Credit Packs** — Create new products/prices for $2.95/3, $7.95/10, $14.95/25
3. **Disable old products** — Starter ($4.95), Standard ($14.95), old credit packs

---

## 18. Admin Panel Updates

### Modify

| Page | Change |
|------|--------|
| Admin dashboard | Update stats to show: total credits in circulation, peer reviews/day, credit purchase revenue |
| Admin users | Show credit balance alongside existing data. Show peer review count. |
| Admin tracks | Show whether track was credit-funded or legacy payment-funded |
| Admin reviews | Show whether review is peer review or legacy paid review |
| Admin reviewers | Phase out. Peer reviewers are just users. Keep for legacy data. |

### Keep As-Is

- Admin track cancellation (refund credits instead of Stripe)
- Admin user management (verify email, activate pro)
- Admin support tickets
- Admin leads/reengagement

### New Admin Actions

| Action | Purpose |
|--------|---------|
| Grant credits to user | Replace "grant free track" with "grant N credits" |
| View credit economy stats | Total credits earned, spent, purchased, in circulation |
| Flag/restrict peer reviewer | Based on ArtistProfile peer review data |

---

## 19. Email & Notification Changes

### Remove

| Email | Reason |
|-------|--------|
| Tier change email (reviewer promoted to PRO) | PRO tier is now based on ArtistProfile stats, notify differently |
| Reviewer payment received | No more cash payments |
| Payout processed | No more reviewer payouts |

### Modify

| Email | Change |
|-------|--------|
| Welcome email | Update to explain credit system, not paid reviews |
| Track submitted confirmation | "Your track is queued for peer review" not "payment received" |
| Review completed notification | "An artist reviewed your track" not "a reviewer reviewed your track" |
| Subscription confirmation | Update Pro benefits list |

### Add

| Email | Purpose |
|-------|---------|
| Credit earned | "You earned 1 credit for reviewing {track}. Balance: {n}" |
| Credits running low | "You have 1 credit left. Review tracks or upgrade to Pro." |
| PRO reviewer status earned | "You've reached PRO reviewer status! Your reviews are now prioritized." |
| Model transition email | One-time email to all existing users explaining the change |

---

## 20. How It Works (User-Facing Explanation)

This content should appear in three places:
1. Landing page "How It Works" section
2. Onboarding step 3
3. Dashboard explainer (dismissible)

### Content

```
HOW MIXREFLECT WORKS

1. Upload Your Track
   Share a link (SoundCloud, Bandcamp, YouTube) or upload an MP3 directly.
   Add your genre and you're ready to go.

2. Review Other Artists' Tracks
   Browse tracks in your genre. Listen for at least 3 minutes, then give
   structured feedback: first impression, production quality, originality,
   best and weakest parts, and more.

   Each quality review you submit earns you 1 credit.

3. Get Feedback on Your Music
   Spend credits to get reviews on your tracks. Choose how many reviews
   you want (3, 5, or 10). Artists in your genre will listen and give
   you the same structured feedback.

WHAT'S A CREDIT?
  • 1 credit = 1 review on your track
  • Earn credits by reviewing other artists (1 review given = 1 credit)
  • New accounts start with 2 free credits
  • Pro members get 10 credits/month automatically

QUALITY STANDARDS
  • Every review requires at least 3 minutes of listening
  • Structured form ensures detailed, actionable feedback
  • Artists rate the reviews they receive
  • Low-quality reviews don't earn credits
  • Top reviewers earn "PRO" status and get priority access

WANT MORE?
  MixReflect Pro ($9.95/month):
  • 10 credits/month — no reviewing required
  • Priority reviews from top-rated artists
  • 24-hour turnaround
  • Sell your music and keep 85%
  • Unlimited uploads + stem support
  • Analytics dashboard
```

---

## 21. Implementation Phases

### Phase 1: Database & Core Credit Logic (Week 1)

**Goal:** Credit system works. Users can earn and spend credits.

1. Run database migrations (add credit fields, peer review fields, review genre join table)
2. Run data migration script (grant 2 credits, create ArtistProfiles for reviewer-only users)
3. Modify `POST /api/reviews` to award credits instead of cash
4. Modify `POST /api/tracks` to deduct credits instead of requiring payment
5. Modify `POST /api/tracks/[id]/request-reviews` to use `reviewCredits`
6. Add `getEligiblePeerReviewers()` to `queue.ts`
7. Modify `assignReviewersToTrack()` to use peer reviewers
8. Update Stripe webhook to grant 10 credits on subscription renewal
9. Update review credit checkout for new pack sizes

**Test:** Can a user upload a track, spend credits, have another user review it, and earn a credit?

### Phase 2: Unified Dashboard & Navigation (Week 2)

**Goal:** Single dashboard replaces both artist and reviewer dashboards.

1. Create new unified sidebar component
2. Create new unified layout
3. Create `/dashboard` page with both "My Tracks" and "Review Queue" sections
4. Create `/review` page (review queue, adapted from reviewer queue)
5. Create `/review/[id]` page (review form, adapted from reviewer review)
6. Create `/review/history` page
7. Move `/artist/tracks` → `/tracks`
8. Move `/artist/submit` → `/submit` (rewrite for credit-based flow)
9. Move `/artist/analytics` → `/analytics`
10. Move `/artist/sales` → `/sales`
11. Create `/account` page (unified settings)
12. Set up redirects from all old paths

**Test:** Can a user navigate the entire app without hitting old routes?

### Phase 3: Onboarding & Sign-Up (Week 2-3)

**Goal:** New users get a clean experience from first touch.

1. Create `/onboarding` page (name → genres → explainer)
2. Update signup redirect to `/onboarding`
3. Update login redirect to `/dashboard`
4. Remove onboarding quiz requirement
5. Add onboarding completion check to layout (redirect if incomplete)

**Test:** New user signs up → onboards → sees dashboard with 2 credits → can submit and review.

### Phase 4: Landing Page & Marketing (Week 3)

**Goal:** Landing page sells the new model.

1. Rewrite hero section (free feedback, not paid reviews)
2. Rewrite pricing section (Free vs Pro, no packages)
3. Rewrite FAQ
4. Remove "For Reviewers" CTA
5. Update social proof stats
6. Add "How It Works" section

**Test:** Landing page clearly communicates: upload → review others → get reviewed.

### Phase 5: Cleanup & Transition (Week 3-4)

**Goal:** Remove old code paths, handle existing users.

1. Send transition email to all existing users
2. Allow 30-day final payout window for existing reviewers with pending balance
3. Remove old components (artist-sidebar, artist-nav, DashboardNav role switching)
4. Remove old API routes (track checkout, reviewer payouts after wind-down)
5. Update admin panel
6. Update email templates
7. Remove old Stripe products
8. Monitor credit economy balance (credits earned vs spent)

---

## File Change Summary

### New Files to Create (~15 files)

```
src/app/(dashboard)/dashboard/page.tsx          — Unified dashboard
src/app/(dashboard)/submit/page.tsx             — Credit-based track submission
src/app/(dashboard)/submit/success/page.tsx     — Submission success
src/app/(dashboard)/review/page.tsx             — Peer review queue
src/app/(dashboard)/review/[id]/page.tsx        — Peer review form
src/app/(dashboard)/review/history/page.tsx     — Review history
src/app/(dashboard)/onboarding/page.tsx         — Unified onboarding
src/app/(dashboard)/layout.tsx                  — Unified layout (or modify existing)
src/components/dashboard/sidebar.tsx            — Unified sidebar
src/components/credits/credit-balance.tsx       — Credit balance display
src/components/credits/credit-topup-prompt.tsx  — Contextual upsell component
src/components/review/review-queue-card.tsx     — Track card for review queue
src/components/onboarding/onboarding-steps.tsx  — Onboarding flow
prisma/migrations/YYYYMMDD_credit_model/        — Database migration
scripts/migrate-to-credits.ts                   — Data migration script
```

### Files to Heavily Modify (~15 files)

```
src/app/page.tsx                                — Landing page rewrite
src/app/(auth)/signup/page.tsx                  — Remove role selection, update redirect
src/app/(auth)/login/page.tsx                   — Update redirect logic
src/app/api/tracks/route.ts                     — Credit deduction on submission
src/app/api/tracks/[id]/request-reviews/route.ts — Use reviewCredits
src/app/api/reviews/route.ts                    — Award credits instead of cash
src/app/api/queue/route.ts                      — Query ArtistProfile peer reviewers
src/app/api/review-credits/checkout/route.ts    — New pack sizes/prices
src/app/api/webhooks/stripe/route.ts            — Grant reviewCredits on renewal
src/app/api/auth/signup/route.ts                — Always set isArtist: true
src/lib/queue.ts                                — Add peer reviewer matching
src/lib/metadata.ts                             — Remove package configs or simplify
src/components/account/account-settings-client.tsx — Remove role sections
prisma/schema.prisma                            — Add credit fields, peer review relations
```

### Files to Remove or Redirect (~25 files)

```
src/app/(dashboard)/artist/dashboard/page.tsx   → redirect to /dashboard
src/app/(dashboard)/artist/onboarding/page.tsx  → redirect to /onboarding
src/app/(dashboard)/artist/submit/*             → redirect to /submit
src/app/(dashboard)/artist/tracks/*             → redirect to /tracks
src/app/(dashboard)/artist/analytics/page.tsx   → redirect to /analytics
src/app/(dashboard)/artist/sales/page.tsx       → redirect to /sales
src/app/(dashboard)/artist/earnings/page.tsx    → redirect to /earnings
src/app/(dashboard)/artist/account/page.tsx     → redirect to /account
src/app/(dashboard)/artist/reviewers/*          → remove
src/app/(dashboard)/reviewer/dashboard/page.tsx → redirect to /dashboard
src/app/(dashboard)/reviewer/onboarding/page.tsx → redirect to /onboarding
src/app/(dashboard)/reviewer/queue/page.tsx     → redirect to /review
src/app/(dashboard)/reviewer/review/[id]/page.tsx → redirect to /review/[id]
src/app/(dashboard)/reviewer/history/page.tsx   → redirect to /review/history
src/app/(dashboard)/reviewer/earnings/page.tsx  → remove (legacy data in /account)
src/app/(dashboard)/reviewer/account/page.tsx   → redirect to /account
src/app/(dashboard)/listener/*                  → all redirect to new paths
src/components/dashboard/artist-sidebar.tsx     → remove (replaced by sidebar.tsx)
src/components/dashboard/artist-nav.tsx         → remove
src/components/reviewer/payout-actions.tsx      → remove after 30-day wind-down
src/components/artist/welcome-modal.tsx         → remove (replaced by dashboard explainer)
src/components/artist/review-upsell.tsx         → remove (replaced by credit prompt)
```

### Unchanged Files (~50+ files)

All of these continue working as-is:
- Review display/carousel/rating/flag/gem components
- Track sharing, stem upload, Ableton project components
- Track sales & affiliate system (entire `/t/[trackShareId]` flow)
- Support ticket system
- Auth pages (forgot-password, reset-password, verify-email)
- Legal pages (privacy, terms)
- Admin panel (mostly — minor stat updates)
- Public track page (`/track/[id]`)
- Discover page
- All upload API routes
- All utility API routes
- Stripe subscription management (portal, verify)

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| User types | 2 (Artist + Reviewer) | 1 (unified) |
| Dashboards | 2 | 1 |
| Onboarding flows | 2 | 1 |
| Sidebars | 2 | 1 |
| Revenue per review | -$0.50 to -$1.50 (cost) | $0 (free) |
| Pro margin | -26.5% | ~94% |
| Credit top-up margin | 15% | ~85-94% |
| Sign-up barrier | Payment required for reviews | Free (earn credits) |
| Files to create | — | ~15 |
| Files to modify | — | ~15 |
| Files to remove/redirect | — | ~25 |
| Database migrations | — | 5 |
| Estimated dev time | — | 3-4 weeks |
