-- AlterTable
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "subscriptionCanceledAt" TIMESTAMP(3);
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "subscriptionCurrentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT;
