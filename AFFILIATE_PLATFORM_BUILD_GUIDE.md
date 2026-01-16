# Affiliate Platform Build Guide

## Executive Summary

Build a music affiliate marketing platform where:
- **Artists** upload tracks and sell them directly (like Bandcamp)
- **Promoters** (anyone) generate affiliate links for any track
- **Promoters earn commission** when their links drive sales
- **Artists get organic promotion** from people with aligned incentives

---

## Build vs. Reuse Recommendation

### RECOMMENDATION: Extend Existing Infrastructure

**DO reuse:**
- Next.js 16 + React 19 framework
- Prisma + PostgreSQL database
- NextAuth authentication system
- Stripe Checkout (for sales) + Stripe Connect (for affiliate payouts)
- S3 uploads for audio files
- Resend email infrastructure
- Tailwind CSS + existing UI components
- Vercel deployment pipeline

**DO NOT reuse:**
- The existing Track model (it's designed for feedback, not sales)
- The existing Review/ReviewerProfile models (different use case)
- Most existing pages (different user flows)

**Rationale:** The core infrastructure (auth, payments, uploads, database) is solid and represents 40%+ of the work. But this is a fundamentally different product, so most business logic and UI needs to be built fresh. Create new models alongside existing ones rather than heavily modifying them.

### Suggested Approach
1. Add new Prisma models for the affiliate system (prefix with `Aff` or use separate naming)
2. Create a new route group `(affiliate)` for the new product pages
3. Reuse existing auth, payments, and upload infrastructure
4. Keep MixReflect feedback product intact (can run both products)

---

## Product Requirements

### User Types

1. **Artist** - Uploads tracks, sets prices, enables affiliate program
2. **Promoter** - Generates affiliate links, earns commission on sales
3. **Buyer** - Purchases tracks (no account required)

Note: A user can be both Artist and Promoter.

### Core Flows

```
ARTIST FLOW:
Upload track → Set price → Enable affiliates → Set commission rate → Track goes live
                                                                           ↓
                                                         View sales dashboard
                                                         See which promoters drove sales
                                                         Withdraw earnings

PROMOTER FLOW:
Browse/search tracks → Generate affiliate link for track → Share link anywhere
                                                                    ↓
                                                      View earnings dashboard
                                                      See clicks, conversions, commission
                                                      Withdraw earnings (via Stripe Connect)

BUYER FLOW:
Click affiliate link → Land on track page → Listen to preview → Purchase → Download
```

---

## Database Schema

Add these new models to `prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────
// AFFILIATE PLATFORM - TRACKS FOR SALE
// ─────────────────────────────────────────────────────────────

model SaleTrack {
  id        String   @id @default(cuid())
  artistId  String
  artist    User     @relation("ArtistSaleTracks", fields: [artistId], references: [id], onDelete: Cascade)

  // Track info
  title       String
  slug        String   @unique  // URL-friendly identifier
  description String?
  artworkUrl  String?
  audioUrl    String   // S3 URL for full track
  previewUrl  String?  // S3 URL for 30-60 sec preview (optional, can generate)
  duration    Int?     // seconds

  // Pricing
  priceInCents    Int      // e.g., 100 = $1.00
  currency        String   @default("usd")

  // Affiliate settings
  affiliateEnabled    Boolean @default(true)
  commissionPercent   Int     @default(15)  // 15 = 15%

  // Stats (denormalized for performance)
  totalSales      Int @default(0)
  totalRevenue    Int @default(0)  // cents
  totalPaidOut    Int @default(0)  // cents paid to affiliates

  // Status
  isPublished Boolean  @default(false)
  isDeleted   Boolean  @default(false)

  // Genres for discovery
  genres Genre[] @relation("SaleTrackGenres")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  affiliateLinks AffiliateLink[]
  sales          Sale[]

  @@index([artistId, isPublished])
  @@index([slug])
  @@index([isPublished, createdAt])
}

// ─────────────────────────────────────────────────────────────
// PROMOTER PROFILES
// ─────────────────────────────────────────────────────────────

model PromoterProfile {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Display info
  displayName String?
  bio         String?

  // Payout setup
  stripeAccountId   String?  @unique
  stripeConnectedAt DateTime?
  payoutEmail       String?
  country           String?

  // Stats (denormalized)
  totalClicks     Int @default(0)
  totalSales      Int @default(0)
  totalEarnings   Int @default(0)  // cents
  pendingBalance  Int @default(0)  // cents, not yet withdrawn

  // Trust/verification
  isVerified Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  affiliateLinks AffiliateLink[]
  commissions    Commission[]
  payouts        PromoterPayout[]

  @@index([stripeAccountId])
}

// ─────────────────────────────────────────────────────────────
// AFFILIATE LINKS
// ─────────────────────────────────────────────────────────────

model AffiliateLink {
  id         String          @id @default(cuid())
  trackId    String
  track      SaleTrack       @relation(fields: [trackId], references: [id], onDelete: Cascade)
  promoterId String
  promoter   PromoterProfile @relation(fields: [promoterId], references: [id], onDelete: Cascade)

  // Unique code for this promoter+track combo
  code String @unique  // e.g., "abc123" -> /t/track-slug?ref=abc123

  // Stats
  clicks      Int @default(0)
  conversions Int @default(0)
  earnings    Int @default(0)  // cents

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clickEvents ClickEvent[]
  sales       Sale[]

  @@unique([trackId, promoterId])  // One link per promoter per track
  @@index([code])
  @@index([promoterId])
  @@index([trackId])
}

// ─────────────────────────────────────────────────────────────
// CLICK TRACKING
// ─────────────────────────────────────────────────────────────

model ClickEvent {
  id              String        @id @default(cuid())
  affiliateLinkId String
  affiliateLink   AffiliateLink @relation(fields: [affiliateLinkId], references: [id], onDelete: Cascade)

  // Attribution data
  ipHash      String?  // Hashed IP for deduplication (don't store raw IP)
  userAgent   String?
  referer     String?  // Where they came from
  country     String?

  // Session tracking for attribution
  sessionId   String   // Random ID stored in cookie, links click to purchase

  convertedToSale Boolean @default(false)

  createdAt DateTime @default(now())

  @@index([affiliateLinkId, createdAt])
  @@index([sessionId])
  @@index([createdAt])
}

// ─────────────────────────────────────────────────────────────
// SALES
// ─────────────────────────────────────────────────────────────

model Sale {
  id      String    @id @default(cuid())
  trackId String
  track   SaleTrack @relation(fields: [trackId], references: [id], onDelete: Cascade)

  // Buyer info (no account required)
  buyerEmail String
  buyerName  String?

  // Attribution (nullable - not all sales come from affiliates)
  affiliateLinkId String?
  affiliateLink   AffiliateLink? @relation(fields: [affiliateLinkId], references: [id], onDelete: SetNull)
  sessionId       String?        // Links to ClickEvent

  // Amounts
  amount            Int  // cents - what buyer paid
  platformFee       Int  // cents - your cut
  artistPayout      Int  // cents - artist receives
  affiliateCommission Int @default(0)  // cents - affiliate receives (0 if no affiliate)

  // Stripe
  stripePaymentIntentId String? @unique
  stripeSessionId       String? @unique

  status SaleStatus @default(PENDING)

  // Download tracking
  downloadCount Int      @default(0)
  downloadToken String   @unique  // Secure token for download link
  downloadExpiresAt DateTime?

  createdAt   DateTime  @default(now())
  completedAt DateTime?

  // Relations
  commission Commission?

  @@index([trackId, createdAt])
  @@index([affiliateLinkId])
  @@index([stripePaymentIntentId])
  @@index([downloadToken])
  @@index([buyerEmail])
}

enum SaleStatus {
  PENDING
  COMPLETED
  REFUNDED
  FAILED
}

// ─────────────────────────────────────────────────────────────
// COMMISSIONS (Affiliate earnings per sale)
// ─────────────────────────────────────────────────────────────

model Commission {
  id         String          @id @default(cuid())
  saleId     String          @unique
  sale       Sale            @relation(fields: [saleId], references: [id], onDelete: Cascade)
  promoterId String
  promoter   PromoterProfile @relation(fields: [promoterId], references: [id], onDelete: Cascade)

  amount Int  // cents

  // Payout tracking
  status    CommissionStatus @default(PENDING)
  payoutId  String?
  paidAt    DateTime?

  createdAt DateTime @default(now())

  @@index([promoterId, status])
  @@index([status, createdAt])
}

enum CommissionStatus {
  PENDING      // Sale complete, not yet paid out
  PROCESSING   // Payout initiated
  PAID         // Payout complete
  CANCELLED    // Sale refunded, commission cancelled
}

// ─────────────────────────────────────────────────────────────
// PROMOTER PAYOUTS
// ─────────────────────────────────────────────────────────────

model PromoterPayout {
  id         String          @id @default(cuid())
  promoterId String
  promoter   PromoterProfile @relation(fields: [promoterId], references: [id], onDelete: Cascade)

  amount Int  // cents

  // Stripe Connect transfer
  stripeTransferId String? @unique

  status PayoutStatus @default(PENDING)

  createdAt   DateTime  @default(now())
  processedAt DateTime?
  failedAt    DateTime?
  failureReason String?

  @@index([promoterId, createdAt])
  @@index([status])
}
```

### Update User Model

Add these relations to the existing User model:

```prisma
model User {
  // ... existing fields ...

  // Add these new relations:
  promoterProfile PromoterProfile?
  saleTracks      SaleTrack[]       @relation("ArtistSaleTracks")
}
```

### Update Genre Model

Add this relation to the existing Genre model:

```prisma
model Genre {
  // ... existing fields ...

  // Add this new relation:
  saleTracks SaleTrack[] @relation("SaleTrackGenres")
}
```

---

## API Endpoints

### Track Management (Artist)

```
POST   /api/affiliate/tracks              - Create new track for sale
GET    /api/affiliate/tracks              - List artist's tracks
GET    /api/affiliate/tracks/[id]         - Get track details
PATCH  /api/affiliate/tracks/[id]         - Update track (price, commission, etc.)
DELETE /api/affiliate/tracks/[id]         - Soft delete track

POST   /api/affiliate/tracks/[id]/publish - Publish track
POST   /api/affiliate/tracks/[id]/unpublish - Unpublish track
```

### Upload (Artist)

```
POST   /api/affiliate/uploads/presign     - Get presigned S3 URL for audio upload
POST   /api/affiliate/uploads/artwork     - Get presigned S3 URL for artwork
```

### Affiliate Links (Promoter)

```
POST   /api/affiliate/links               - Generate affiliate link for a track
GET    /api/affiliate/links               - List promoter's affiliate links
GET    /api/affiliate/links/[code]/stats  - Get stats for specific link
```

### Discovery (Public)

```
GET    /api/affiliate/discover            - Browse published tracks
GET    /api/affiliate/discover/search     - Search tracks
GET    /api/affiliate/discover/[slug]     - Get public track details
```

### Purchase Flow

```
POST   /api/affiliate/purchase/checkout   - Create Stripe checkout session
POST   /api/affiliate/purchase/webhook    - Stripe webhook for completed purchases
GET    /api/affiliate/download/[token]    - Download purchased track
```

### Click Tracking

```
POST   /api/affiliate/track-click         - Record click on affiliate link
```

### Promoter Dashboard

```
GET    /api/affiliate/promoter/stats      - Overall stats
GET    /api/affiliate/promoter/earnings   - Earnings breakdown
POST   /api/affiliate/promoter/payout     - Request payout
```

### Stripe Connect (Promoter)

```
POST   /api/affiliate/promoter/stripe/connect    - Start Stripe Connect onboarding
GET    /api/affiliate/promoter/stripe/status     - Check Stripe Connect status
POST   /api/affiliate/promoter/stripe/dashboard  - Get Stripe Express dashboard link
```

### Artist Dashboard

```
GET    /api/affiliate/artist/stats        - Sales stats
GET    /api/affiliate/artist/sales        - List sales with affiliate attribution
GET    /api/affiliate/artist/earnings     - Earnings breakdown
POST   /api/affiliate/artist/payout       - Request payout (if using Stripe Connect for artists too)
```

---

## Page Structure

Create these pages under `src/app/(affiliate)/`:

```
src/app/(affiliate)/
├── layout.tsx                    # Affiliate section layout
│
├── discover/
│   └── page.tsx                  # Public track discovery/browse
│
├── t/
│   └── [slug]/
│       └── page.tsx              # Public track page (purchase page)
│
├── artist/
│   ├── layout.tsx                # Artist dashboard layout
│   ├── dashboard/
│   │   └── page.tsx              # Artist overview
│   ├── tracks/
│   │   ├── page.tsx              # List artist's tracks
│   │   ├── new/
│   │   │   └── page.tsx          # Upload new track
│   │   └── [id]/
│   │       ├── page.tsx          # Track details & stats
│   │       └── edit/
│   │           └── page.tsx      # Edit track
│   ├── sales/
│   │   └── page.tsx              # Sales history
│   └── earnings/
│       └── page.tsx              # Earnings & payouts
│
├── promoter/
│   ├── layout.tsx                # Promoter dashboard layout
│   ├── dashboard/
│   │   └── page.tsx              # Promoter overview
│   ├── links/
│   │   └── page.tsx              # Affiliate links management
│   ├── earnings/
│   │   └── page.tsx              # Earnings & payouts
│   └── onboarding/
│       └── page.tsx              # Stripe Connect setup
│
├── purchase/
│   ├── success/
│   │   └── page.tsx              # Post-purchase success page
│   └── download/
│       └── [token]/
│           └── page.tsx          # Download page
│
└── auth/
    ├── signup/
    │   └── page.tsx              # Signup (choose artist/promoter)
    └── login/
        └── page.tsx              # Login (can reuse existing)
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Basic infrastructure, can upload and sell a track without affiliates

1. Add new Prisma models and run migration
2. Create S3 upload endpoints for audio files
3. Build track upload form (artist)
4. Build public track page with audio preview
5. Implement Stripe Checkout for track purchases
6. Handle purchase webhook and create download links
7. Build download page

**Deliverable:** Artist can upload track, buyer can purchase and download

### Phase 2: Affiliate System (Week 2)
**Goal:** Promoters can generate links and earn commission

1. Create PromoterProfile model and onboarding
2. Build affiliate link generation
3. Implement click tracking with session cookies
4. Attribute sales to affiliate links
5. Calculate and record commissions
6. Build promoter dashboard with stats

**Deliverable:** Promoters can share links, sales are attributed, commissions tracked

### Phase 3: Payouts (Week 3)
**Goal:** Promoters can withdraw earnings

1. Implement Stripe Connect onboarding for promoters
2. Build payout request flow
3. Execute payouts via Stripe Connect transfers
4. Build earnings history UI

**Deliverable:** Full payout flow working

### Phase 4: Discovery & Polish (Week 4)
**Goal:** Buyers can browse and discover tracks

1. Build discovery/browse page
2. Add search functionality
3. Genre filtering
4. Artist public profiles
5. Social sharing meta tags
6. Email notifications (sale complete, commission earned, etc.)

**Deliverable:** Complete MVP

---

## Technical Implementation Details

### 1. Audio Upload Flow

```typescript
// src/app/api/affiliate/uploads/presign/route.ts

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { filename, contentType } = await request.json()

  // Validate content type
  const allowedTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/aac"]
  if (!allowedTypes.includes(contentType)) {
    return Response.json({ error: "Invalid file type" }, { status: 400 })
  }

  const key = `tracks/${session.user.id}/${Date.now()}-${filename}`

  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

  return Response.json({ presignedUrl, publicUrl, key })
}
```

### 2. Affiliate Link Generation

```typescript
// src/app/api/affiliate/links/route.ts

import { nanoid } from "nanoid"  // Install: npm install nanoid

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { trackId } = await request.json()

  // Get or create promoter profile
  let promoter = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id }
  })

  if (!promoter) {
    promoter = await prisma.promoterProfile.create({
      data: { userId: session.user.id }
    })
  }

  // Check if link already exists
  const existingLink = await prisma.affiliateLink.findUnique({
    where: {
      trackId_promoterId: {
        trackId,
        promoterId: promoter.id
      }
    }
  })

  if (existingLink) {
    return Response.json({ link: existingLink })
  }

  // Generate unique code
  const code = nanoid(8)  // 8 character unique code

  const link = await prisma.affiliateLink.create({
    data: {
      trackId,
      promoterId: promoter.id,
      code,
    },
    include: {
      track: true
    }
  })

  return Response.json({
    link,
    url: `${process.env.NEXT_PUBLIC_URL}/t/${link.track.slug}?ref=${code}`
  })
}
```

### 3. Click Tracking

```typescript
// src/app/api/affiliate/track-click/route.ts

import { cookies } from "next/headers"
import { nanoid } from "nanoid"
import crypto from "crypto"

export async function POST(request: Request) {
  const { code, referer, userAgent } = await request.json()

  // Get or create session ID for attribution
  const cookieStore = await cookies()
  let sessionId = cookieStore.get("aff_session")?.value

  if (!sessionId) {
    sessionId = nanoid(16)
    // Note: Cookie setting should be done in middleware or page component
  }

  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { code }
  })

  if (!affiliateLink) {
    return Response.json({ error: "Invalid link" }, { status: 404 })
  }

  // Hash IP for deduplication (don't store raw IP)
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : "unknown"
  const ipHash = crypto.createHash("sha256").update(ip + process.env.IP_SALT).digest("hex")

  // Check for duplicate clicks (same IP + link in last hour)
  const recentClick = await prisma.clickEvent.findFirst({
    where: {
      affiliateLinkId: affiliateLink.id,
      ipHash,
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000)  // 1 hour
      }
    }
  })

  if (!recentClick) {
    // Record click
    await prisma.clickEvent.create({
      data: {
        affiliateLinkId: affiliateLink.id,
        sessionId,
        ipHash,
        userAgent,
        referer,
      }
    })

    // Increment click count
    await prisma.affiliateLink.update({
      where: { id: affiliateLink.id },
      data: { clicks: { increment: 1 } }
    })

    // Update promoter stats
    await prisma.promoterProfile.update({
      where: { id: affiliateLink.promoterId },
      data: { totalClicks: { increment: 1 } }
    })
  }

  return Response.json({ success: true, sessionId })
}
```

### 4. Purchase Flow with Attribution

```typescript
// src/app/api/affiliate/purchase/checkout/route.ts

import Stripe from "stripe"
import { cookies } from "next/headers"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const { trackId, email } = await request.json()

  const track = await prisma.saleTrack.findUnique({
    where: { id: trackId }
  })

  if (!track || !track.isPublished) {
    return Response.json({ error: "Track not found" }, { status: 404 })
  }

  // Get session ID for attribution
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("aff_session")?.value

  // Find affiliate link if session has one
  let affiliateLinkId: string | null = null
  if (sessionId) {
    const clickEvent = await prisma.clickEvent.findFirst({
      where: {
        sessionId,
        affiliateLink: { trackId },
        convertedToSale: false,
      },
      orderBy: { createdAt: "desc" }
    })
    if (clickEvent) {
      affiliateLinkId = clickEvent.affiliateLinkId
    }
  }

  // Calculate amounts
  const platformFeePercent = 10  // 10% platform fee
  const commissionPercent = affiliateLinkId ? track.commissionPercent : 0

  const platformFee = Math.round(track.priceInCents * platformFeePercent / 100)
  const affiliateCommission = Math.round(track.priceInCents * commissionPercent / 100)
  const artistPayout = track.priceInCents - platformFee - affiliateCommission

  // Generate download token
  const downloadToken = nanoid(32)

  // Create pending sale record
  const sale = await prisma.sale.create({
    data: {
      trackId,
      buyerEmail: email,
      affiliateLinkId,
      sessionId,
      amount: track.priceInCents,
      platformFee,
      artistPayout,
      affiliateCommission,
      downloadToken,
      downloadExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }
  })

  // Create Stripe checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: track.currency,
          product_data: {
            name: track.title,
            images: track.artworkUrl ? [track.artworkUrl] : [],
          },
          unit_amount: track.priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL}/purchase/success?token=${downloadToken}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/t/${track.slug}`,
    customer_email: email,
    metadata: {
      saleId: sale.id,
      trackId: track.id,
      affiliateLinkId: affiliateLinkId || "",
    },
  })

  // Update sale with Stripe session ID
  await prisma.sale.update({
    where: { id: sale.id },
    data: { stripeSessionId: checkoutSession.id }
  })

  return Response.json({ url: checkoutSession.url })
}
```

### 5. Webhook Handler (Complete Sale & Commission)

```typescript
// src/app/api/affiliate/purchase/webhook/route.ts

import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_AFFILIATE!
    )
  } catch (err) {
    return Response.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const { saleId, trackId, affiliateLinkId } = session.metadata!

    await prisma.$transaction(async (tx) => {
      // Update sale status
      const sale = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: "COMPLETED",
          stripePaymentIntentId: session.payment_intent as string,
          completedAt: new Date(),
        }
      })

      // Update track stats
      await tx.saleTrack.update({
        where: { id: trackId },
        data: {
          totalSales: { increment: 1 },
          totalRevenue: { increment: sale.amount },
          totalPaidOut: { increment: sale.affiliateCommission },
        }
      })

      // If affiliate sale, create commission and update promoter
      if (affiliateLinkId && sale.affiliateCommission > 0) {
        // Get affiliate link to find promoter
        const affiliateLink = await tx.affiliateLink.findUnique({
          where: { id: affiliateLinkId }
        })

        if (affiliateLink) {
          // Create commission record
          await tx.commission.create({
            data: {
              saleId: sale.id,
              promoterId: affiliateLink.promoterId,
              amount: sale.affiliateCommission,
            }
          })

          // Update affiliate link stats
          await tx.affiliateLink.update({
            where: { id: affiliateLinkId },
            data: {
              conversions: { increment: 1 },
              earnings: { increment: sale.affiliateCommission },
            }
          })

          // Update promoter stats
          await tx.promoterProfile.update({
            where: { id: affiliateLink.promoterId },
            data: {
              totalSales: { increment: 1 },
              totalEarnings: { increment: sale.affiliateCommission },
              pendingBalance: { increment: sale.affiliateCommission },
            }
          })

          // Mark click as converted
          if (sale.sessionId) {
            await tx.clickEvent.updateMany({
              where: {
                affiliateLinkId,
                sessionId: sale.sessionId,
              },
              data: { convertedToSale: true }
            })
          }
        }
      }
    })
  }

  return Response.json({ received: true })
}
```

### 6. Promoter Payout (Stripe Connect)

```typescript
// src/app/api/affiliate/promoter/payout/route.ts

import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const promoter = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id }
  })

  if (!promoter) {
    return Response.json({ error: "Promoter profile not found" }, { status: 404 })
  }

  if (!promoter.stripeAccountId) {
    return Response.json({ error: "Stripe Connect not set up" }, { status: 400 })
  }

  if (promoter.pendingBalance < 500) {  // Minimum $5 payout
    return Response.json({ error: "Minimum payout is $5" }, { status: 400 })
  }

  const amount = promoter.pendingBalance

  try {
    // Create Stripe transfer to connected account
    const transfer = await stripe.transfers.create({
      amount,
      currency: "usd",
      destination: promoter.stripeAccountId,
      metadata: {
        promoterId: promoter.id,
      }
    })

    // Record payout
    await prisma.$transaction(async (tx) => {
      await tx.promoterPayout.create({
        data: {
          promoterId: promoter.id,
          amount,
          stripeTransferId: transfer.id,
          status: "COMPLETED",
          processedAt: new Date(),
        }
      })

      // Update pending commissions to PAID
      await tx.commission.updateMany({
        where: {
          promoterId: promoter.id,
          status: "PENDING",
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
        }
      })

      // Reset pending balance
      await tx.promoterProfile.update({
        where: { id: promoter.id },
        data: { pendingBalance: 0 }
      })
    })

    return Response.json({ success: true, amount })
  } catch (error) {
    console.error("Payout failed:", error)
    return Response.json({ error: "Payout failed" }, { status: 500 })
  }
}
```

---

## Key UI Components to Build

### 1. Track Upload Form
- Audio file dropzone with progress
- Artwork upload
- Title, description inputs
- Price input (with currency)
- Commission rate slider (10-50%)
- Genre selector
- Preview/publish toggle

### 2. Public Track Page (`/t/[slug]`)
- Large artwork display
- Audio player with preview (30-60 sec or full if free)
- Artist info
- Price and buy button
- "Share & Earn" CTA for logged-in users
- Social sharing buttons

### 3. Affiliate Link Generator
- One-click "Get your link" button
- Copy to clipboard
- Share to Twitter/Facebook/etc.
- QR code generation (optional)

### 4. Promoter Dashboard
- Total earnings (all time)
- Pending balance (available to withdraw)
- Clicks today/this week/this month
- Conversion rate
- List of active affiliate links with stats
- Withdraw button

### 5. Artist Dashboard
- Total sales
- Total revenue
- Revenue by track
- Top affiliates driving sales
- Recent sales list with attribution

---

## Environment Variables to Add

```env
# Affiliate Platform Specific
STRIPE_WEBHOOK_SECRET_AFFILIATE=whsec_xxx

# S3 (if not already configured)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_BUCKET_NAME=soundcheck-tracks

# Security
IP_SALT=random_string_for_hashing_ips

# URLs
NEXT_PUBLIC_URL=https://yourdomain.com
```

---

## Testing Checklist

### Phase 1 Tests
- [ ] Artist can upload audio file to S3
- [ ] Artist can create track with price
- [ ] Public track page renders correctly
- [ ] Audio preview plays
- [ ] Stripe checkout creates correctly
- [ ] Webhook processes successful payment
- [ ] Buyer receives download link
- [ ] Download works

### Phase 2 Tests
- [ ] User can create promoter profile
- [ ] Promoter can generate affiliate link
- [ ] Click tracking records clicks
- [ ] Session attribution works across page loads
- [ ] Sale correctly attributed to affiliate
- [ ] Commission calculated correctly
- [ ] Promoter stats update after sale

### Phase 3 Tests
- [ ] Stripe Connect onboarding flow works
- [ ] Payout request executes transfer
- [ ] Commission status updates to PAID
- [ ] Pending balance resets after payout

### Edge Cases
- [ ] Same user buying twice (should allow)
- [ ] Multiple clicks same IP (should dedupe)
- [ ] Purchase without affiliate (should work, no commission)
- [ ] Refund handling (commission should be cancelled)
- [ ] Affiliate link for own track (decide: allow or block)

---

## Recommended Dependencies to Add

```bash
npm install nanoid           # Unique ID generation
npm install @tanstack/react-query  # Data fetching (optional but nice)
```

---

## Migration Strategy

Since this is a new product alongside MixReflect:

1. **Keep existing tables untouched** - MixReflect continues working
2. **Add new tables** via Prisma migration
3. **Share User table** - users can be artist, reviewer, AND promoter
4. **Share Genre table** - reuse existing genres
5. **Separate Stripe webhooks** - use different endpoint for affiliate purchases
6. **Can share auth pages** or create new ones in `(affiliate)/auth/`

Run migration:
```bash
npx prisma migrate dev --name add_affiliate_platform
```

---

## Future Enhancements (Post-MVP)

1. **Tiered commissions** - Higher % for top promoters
2. **Campaign system** - Artists can create limited-time higher commission campaigns
3. **Leaderboards** - Top promoters get featured
4. **Analytics** - Detailed click/conversion analytics with charts
5. **Embeddable players** - Promoters embed players on their sites
6. **Bundle sales** - Sell multiple tracks as album
7. **Subscription model** - Monthly access to artist's catalog
8. **API for external apps** - Let other apps integrate your affiliate system

---

## Summary

**Build on existing infrastructure:** Yes - use the Next.js, Prisma, Stripe, S3, and auth setup.

**Modify existing models:** Minimal - just add relations to User and Genre.

**Build new:** Most of the business logic, all affiliate-specific models, and new UI pages.

**Timeline estimate:** 3-4 weeks for full MVP with all phases.

**Start with:** Phase 1 (basic sales without affiliates) - proves the core purchase flow before adding affiliate complexity.
