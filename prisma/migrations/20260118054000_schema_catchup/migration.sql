-- Catch-up migration to align database schema with prisma/schema.prisma

-- ArtistProfile: earnings + Stripe Connect fields
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "pendingBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "totalEarnings" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "stripeConnectedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'ArtistProfile_stripeAccountId_key'
  ) THEN
    CREATE UNIQUE INDEX "ArtistProfile_stripeAccountId_key" ON "ArtistProfile"("stripeAccountId");
  END IF;
END $$;

-- Track: purchases + link issue fields
ALTER TABLE "Track" ADD COLUMN IF NOT EXISTS "allowPurchase" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Track" ADD COLUMN IF NOT EXISTS "linkIssueNotifiedAt" TIMESTAMP(3);

-- User: trial reminder tracking
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialReminderSentAt" TIMESTAMP(3);

-- ReviewerProfile: affiliate earnings
ALTER TABLE "ReviewerProfile" ADD COLUMN IF NOT EXISTS "affiliateEarnings" INTEGER NOT NULL DEFAULT 0;

-- Purchases
CREATE TABLE IF NOT EXISTS "Purchase" (
  "id" TEXT NOT NULL,
  "trackId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "referredByReviewerId" TEXT,
  "referralShareId" TEXT,
  "commissionPaid" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'Purchase_trackId_reviewerId_key'
  ) THEN
    CREATE UNIQUE INDEX "Purchase_trackId_reviewerId_key" ON "Purchase"("trackId", "reviewerId");
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'Purchase_reviewerId_idx'
  ) THEN
    CREATE INDEX "Purchase_reviewerId_idx" ON "Purchase"("reviewerId");
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'Purchase_trackId_idx'
  ) THEN
    CREATE INDEX "Purchase_trackId_idx" ON "Purchase"("trackId");
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'Purchase_referredByReviewerId_idx'
  ) THEN
    CREATE INDEX "Purchase_referredByReviewerId_idx" ON "Purchase"("referredByReviewerId");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Purchase_trackId_fkey'
  ) THEN
    ALTER TABLE "Purchase"
      ADD CONSTRAINT "Purchase_trackId_fkey" FOREIGN KEY ("trackId")
      REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Purchase_reviewerId_fkey'
  ) THEN
    ALTER TABLE "Purchase"
      ADD CONSTRAINT "Purchase_reviewerId_fkey" FOREIGN KEY ("reviewerId")
      REFERENCES "ReviewerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Purchase_referredByReviewerId_fkey'
  ) THEN
    ALTER TABLE "Purchase"
      ADD CONSTRAINT "Purchase_referredByReviewerId_fkey" FOREIGN KEY ("referredByReviewerId")
      REFERENCES "ReviewerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Lead capture
CREATE TABLE IF NOT EXISTS "LeadCapture" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "artistName" TEXT,
  "source" TEXT NOT NULL DEFAULT 'get-feedback',
  "reminded" BOOLEAN NOT NULL DEFAULT false,
  "converted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LeadCapture_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'LeadCapture_email_idx'
  ) THEN
    CREATE INDEX "LeadCapture_email_idx" ON "LeadCapture"("email");
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'LeadCapture_reminded_createdAt_idx'
  ) THEN
    CREATE INDEX "LeadCapture_reminded_createdAt_idx" ON "LeadCapture"("reminded", "createdAt");
  END IF;
END $$;
