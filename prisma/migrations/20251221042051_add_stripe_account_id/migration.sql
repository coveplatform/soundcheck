-- CreateEnum
CREATE TYPE "ReviewerTier" AS ENUM ('ROOKIE', 'VERIFIED', 'PRO');

-- CreateEnum
CREATE TYPE "TrackSource" AS ENUM ('SOUNDCLOUD', 'BANDCAMP', 'YOUTUBE', 'UPLOAD');

-- CreateEnum
CREATE TYPE "TrackStatus" AS ENUM ('PENDING_PAYMENT', 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('STARTER', 'STANDARD', 'PRO', 'DEEP_DIVE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "FirstImpression" AS ENUM ('STRONG_HOOK', 'DECENT', 'LOST_INTEREST');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('PAYPAL', 'STRIPE_CONNECT', 'MANUAL');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isArtist" BOOLEAN NOT NULL DEFAULT false,
    "isReviewer" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ArtistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "totalTracks" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "ReviewerTier" NOT NULL DEFAULT 'ROOKIE',
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarnings" INTEGER NOT NULL DEFAULT 0,
    "pendingBalance" INTEGER NOT NULL DEFAULT 0,
    "spotifyId" TEXT,
    "lastfmUsername" TEXT,
    "stripeAccountId" TEXT,
    "flagCount" INTEGER NOT NULL DEFAULT 0,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "completedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "reviewsToday" INTEGER NOT NULL DEFAULT 0,
    "lastReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" "TrackSource" NOT NULL,
    "title" TEXT NOT NULL,
    "artworkUrl" TEXT,
    "duration" INTEGER,
    "feedbackFocus" TEXT,
    "status" "TrackStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "packageType" "PackageType" NOT NULL,
    "reviewsRequested" INTEGER NOT NULL,
    "reviewsCompleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'ASSIGNED',
    "listenDuration" INTEGER NOT NULL DEFAULT 0,
    "lastHeartbeat" TIMESTAMP(3),
    "firstImpression" "FirstImpression",
    "productionScore" INTEGER,
    "vocalScore" INTEGER,
    "originalityScore" INTEGER,
    "wouldListenAgain" BOOLEAN,
    "perceivedGenre" TEXT,
    "similarArtists" TEXT,
    "bestPart" TEXT,
    "bestPartTimestamp" INTEGER,
    "weakestPart" TEXT,
    "weakestTimestamp" INTEGER,
    "additionalNotes" TEXT,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "artistRating" INTEGER,
    "wasFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "stripePaymentId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PayoutMethod" NOT NULL,
    "status" "PayoutStatus" NOT NULL,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewQueue" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArtistGenres" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArtistGenres_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ReviewerGenres" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ReviewerGenres_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TrackGenres" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TrackGenres_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistProfile_userId_key" ON "ArtistProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewerProfile_userId_key" ON "ReviewerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewerProfile_stripeAccountId_key" ON "ReviewerProfile"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE INDEX "Track_status_createdAt_idx" ON "Track"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Track_artistId_idx" ON "Track"("artistId");

-- CreateIndex
CREATE INDEX "Review_reviewerId_status_idx" ON "Review"("reviewerId", "status");

-- CreateIndex
CREATE INDEX "Review_trackId_idx" ON "Review"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_trackId_reviewerId_key" ON "Review"("trackId", "reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_trackId_key" ON "Payment"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE INDEX "ReviewQueue_reviewerId_expiresAt_idx" ON "ReviewQueue"("reviewerId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewQueue_trackId_reviewerId_key" ON "ReviewQueue"("trackId", "reviewerId");

-- CreateIndex
CREATE INDEX "_ArtistGenres_B_index" ON "_ArtistGenres"("B");

-- CreateIndex
CREATE INDEX "_ReviewerGenres_B_index" ON "_ReviewerGenres"("B");

-- CreateIndex
CREATE INDEX "_TrackGenres_B_index" ON "_TrackGenres"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistProfile" ADD CONSTRAINT "ArtistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewerProfile" ADD CONSTRAINT "ReviewerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "ReviewerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "ReviewerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "ReviewerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistGenres" ADD CONSTRAINT "_ArtistGenres_A_fkey" FOREIGN KEY ("A") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistGenres" ADD CONSTRAINT "_ArtistGenres_B_fkey" FOREIGN KEY ("B") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReviewerGenres" ADD CONSTRAINT "_ReviewerGenres_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReviewerGenres" ADD CONSTRAINT "_ReviewerGenres_B_fkey" FOREIGN KEY ("B") REFERENCES "ReviewerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TrackGenres" ADD CONSTRAINT "_TrackGenres_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TrackGenres" ADD CONSTRAINT "_TrackGenres_B_fkey" FOREIGN KEY ("B") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
