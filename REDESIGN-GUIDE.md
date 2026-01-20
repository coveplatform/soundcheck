# MixReflect Artist Dashboard Redesign Guide

## Overview

MixReflect is being repositioned from a **feedback-only platform** to a **full artist platform** where reviews are one feature among many. This document explains what has been done and what still needs to change.

---

## The Old Model (Feedback-First)

```
Artist submits track → Pays for reviews → Gets feedback → Done
```

Tracks only existed in the context of getting reviewed. The entire experience was built around the review submission flow.

## The New Model (Platform-First)

```
Artist uploads track → Track lives on platform (discoverable)
                    → Can optionally request reviews
                    → Can be purchased by listeners
                    → Can be shared via affiliate links
                    → Artist earns money
```

**Key insight**: Tracks exist independently. Reviews, purchases, and discovery are things that *happen* to tracks.

---

## New Positioning

> **"MixReflect: Get heard. Get feedback. Get paid."**

1. **Get heard** - Guaranteed listeners (reviewers) + organic discovery
2. **Get feedback** - Detailed, honest reviews (the core differentiator)
3. **Get paid** - Reviewers can purchase tracks they love

### The Flywheel

1. Artist uploads track
2. Artist requests reviews (paid)
3. Reviewers give detailed feedback
4. Reviewers who love it can BUY the track (artist earns, reviewer forfeits their fee)
5. Reviewers can SHARE tracks via affiliate links
6. Shares drive new listeners → potential purchases
7. Artist builds audience + income from feedback process

---

## What Has Been Changed

### 1. Artist-Specific Layout (`src/app/(dashboard)/artist/layout.tsx`)

- Artists now have their own layout separate from reviewers
- Clean, minimal background (warm cream `#faf8f5`)
- No sidebar - uses the new floating nav instead
- Passes `hasEarnings` prop to nav to conditionally show Earnings link

### 2. New Navigation (`src/components/dashboard/artist-nav.tsx`)

**Desktop:**
- Hamburger icon in top-left corner
- Clicking opens full-screen menu with huge typography (8-12vw)
- Nav links: Tracks, Upload, Earnings (conditional)
- Bottom of menu: Artist name, Settings, Sign out, Switch to Reviewer

**Mobile:**
- Simple text links fixed at bottom of screen
- Same links as desktop

**Design principles:**
- Minimal persistent UI - the content is the focus
- Full-screen menu feels like a deliberate space, not a dropdown
- Typography is light weight (`font-light`), not bold
- Staggered animation on menu items

### 3. Dashboard (`src/app/(dashboard)/artist/dashboard/page.tsx`)

**Header:**
- "Your tracks" title (light weight, large)
- Subtitle shows: track count, free credits (if any), total earned (if any)
- Pending balance pill (if any)

**Track Grid:**
- First card is always "Upload track" with dashed border and plus icon
- Remaining cards show tracks with:
  - Artwork (or placeholder gradient with music icon)
  - Title
  - Status pills below:
    - Review progress: `💬 3/5` with color coding (violet=in progress, emerald=complete)
    - Earnings: `💲 2.50` if track has purchases
    - "No reviews yet" if neither
  - Progress bar overlaid on artwork for tracks being reviewed

**Empty State:**
- Stacked album art mockups (rotated squares)
- "Upload your first track" heading
- "Get it heard by real listeners. Get feedback. Get paid." subtext
- CTA button

### 4. Earnings Page (`src/app/(dashboard)/artist/earnings/page.tsx`)

- Shows total earned and available to withdraw
- Stripe connect CTA if not connected
- List of all sales with track name, buyer, amount, date
- Only accessible if artist has earnings (nav link is conditional)

### 5. Middleware Changes (`middleware.ts`)

- Added `x-pathname` header to all responses
- This allows the parent dashboard layout to detect if we're in artist section and skip rendering the old nav/backdrop

### 6. Parent Dashboard Layout (`src/app/(dashboard)/layout.tsx`)

- Checks `x-pathname` header
- If artist section → renders only `{children}` (artist has own layout)
- If reviewer section → renders old nav + backdrop + content

---

## What Still Needs to Change

### Critical: Separate Upload from Review Request

**Current behavior:**
- "Upload" page (`/artist/submit`) combines uploading a track AND requesting reviews
- You cannot upload a track without choosing a review package and paying
- Track status starts as `PENDING_PAYMENT`

**Needed behavior:**
- Artists should be able to upload tracks WITHOUT requesting reviews
- Tracks should be able to exist in a "just uploaded" state
- "Request reviews" should be a separate action you can take on any track

**Implementation needed:**
1. Create new track status: `UPLOADED` or `DRAFT` (no reviews requested)
2. Modify submit page OR create separate upload-only flow
3. Add "Get Reviews" action on track detail page and/or track cards
4. Track cards should show different states:
   - Just uploaded (no reviews)
   - Reviews requested but not paid
   - Reviews in progress
   - Reviews complete
   - Earning money

### Navigation Clarity

**Current issues:**
- "Upload" label is ambiguous - does it just upload or also request reviews?
- No clear way to request reviews on an existing track
- Settings buried in hamburger menu

**Potential solutions:**
1. Rename nav items for clarity:
   - "Upload" → "New Track" or keep as "Upload" if it becomes upload-only
   - Add "Get Reviews" as separate nav item or action on tracks
2. Add settings icon visible in corner (not just in menu)
3. Consider showing user avatar/initial as menu trigger instead of hamburger

### Track Detail Page (`src/app/(dashboard)/artist/tracks/[id]/page.tsx`)

**Current state:**
- Designed around review feedback (scores, signals, review carousel)
- Has audio player, progress bar, stats

**Needed changes:**
1. Add "Request Reviews" CTA if track has no reviews
2. Show earnings for this specific track
3. Show purchase history for this track
4. Potentially add sharing/affiliate link generation
5. Update visual design to match new dashboard aesthetic

### Track States

Need to support these states clearly in UI:

| State | Meaning | Visual Treatment |
|-------|---------|------------------|
| `UPLOADED` | Just uploaded, no reviews | Clean card, "Get feedback" CTA |
| `PENDING_PAYMENT` | Reviews requested but not paid | Overlay "Payment pending" |
| `QUEUED` | Paid, waiting for reviewers | Progress bar at 0% |
| `IN_PROGRESS` | Reviews coming in | Progress bar showing X/Y |
| `COMPLETED` | All reviews done | Emerald checkmark or pill |
| Has purchases | Track has been bought | Show earnings on card |

### Public Discovery (Future)

The new model implies tracks can be discovered by the public. This requires:

1. Public track pages (may already exist at `/r/[shareId]`)
2. Browse/discover page for listeners
3. Search functionality
4. Genre filtering
5. Consider: should non-reviewers be able to purchase?

### Affiliate System Integration

Reviewers can share tracks and earn commission. For artists this means:

1. Show which reviewers are promoting their tracks
2. Show traffic/clicks from affiliate links
3. Potentially show conversion rates

---

## Design System Notes

### Colors
- Background: `#faf8f5` (warm cream)
- Text: `black` at various opacities (`/90`, `/70`, `/40`, `/20`)
- Accent: `emerald` for earnings/success, `violet` for in-progress
- Borders: `black/5` to `black/10`

### Typography
- Headings: `font-light` (not bold!)
- Large headings: `text-3xl` to `text-5xl` on dashboard, up to `8vw` in menu
- Body: default weight
- Mono: used for counts, stats, subtle labels

### Spacing
- Page padding: `px-6 sm:px-8 lg:px-12`
- Top padding: `pt-14 sm:pt-16` (accounts for fixed nav trigger)
- Grid gaps: `gap-4 sm:gap-6`

### Cards
- Border radius: `rounded-2xl`
- Artwork: `aspect-square rounded-2xl`
- Hover: `hover:bg-white/60` or scale effect on images

### Buttons
- Primary: `bg-black text-white rounded-full`
- Ghost/text: just text with hover color change
- Icon buttons: `p-2 rounded-full hover:bg-black/5`

---

## File Structure

```
src/app/(dashboard)/artist/
├── layout.tsx          # Artist-specific layout with new nav
├── dashboard/
│   └── page.tsx        # Track grid (redesigned)
├── earnings/
│   └── page.tsx        # New earnings page
├── submit/
│   └── page.tsx        # Upload flow (needs rethinking)
├── tracks/
│   └── [id]/
│       └── page.tsx    # Track detail (needs updates)
└── account/
    └── page.tsx        # Settings (exists, may need updates)

src/components/dashboard/
├── artist-nav.tsx      # New floating nav for artists
├── nav.tsx             # Old nav (still used by reviewers)
└── backdrop.tsx        # Old backdrop (still used by reviewers)
```

---

## Database Considerations

### Current Schema (relevant parts)

```prisma
model Track {
  status TrackStatus @default(PENDING_PAYMENT)
  // ...
}

enum TrackStatus {
  PENDING_PAYMENT
  QUEUED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

### Potential Schema Changes

To support upload-without-reviews:

```prisma
enum TrackStatus {
  DRAFT           // New: just uploaded, no reviews requested
  PENDING_PAYMENT // Reviews requested, awaiting payment
  QUEUED          // Paid, waiting for reviewers
  IN_PROGRESS     // Reviews in progress
  COMPLETED       // All reviews done
  CANCELLED       // Cancelled by artist
}
```

Or add a separate field:

```prisma
model Track {
  reviewsRequested Int  // 0 = no reviews requested
  status TrackStatus    // Only relevant if reviewsRequested > 0
}
```

---

## Testing Checklist

After making changes, verify:

1. [ ] New artist can sign up and see empty dashboard
2. [ ] Artist can upload a track
3. [ ] Track appears in dashboard with correct state
4. [ ] Artist can request reviews on a track (if implementing separate flow)
5. [ ] Review progress shows correctly on cards
6. [ ] Earnings show on tracks that have purchases
7. [ ] Earnings page shows all sales
8. [ ] Navigation works on desktop and mobile
9. [ ] Full-screen menu opens/closes correctly
10. [ ] Switch to reviewer works
11. [ ] Settings accessible
12. [ ] Sign out works

---

## Questions to Resolve

1. **Can artists upload without requesting reviews?** (Requires product decision + schema changes)
2. **Should there be a public browse/discover page?**
3. **Who can purchase tracks - only reviewers or anyone?**
4. **Should affiliate stats be visible to artists?**
5. **What happens to tracks with no reviews after X days?**

---

## Summary

The redesign shifts MixReflect from "submit track → get reviews" to "upload track → it lives on the platform → optionally get reviews → potentially earn money". The UI has been updated to be cleaner, more modern, and track-centric rather than review-centric. The main outstanding work is separating the upload flow from the review request flow, and ensuring all track states are clearly represented in the UI.
