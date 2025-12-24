CREATE TYPE "AddressedArtistNote" AS ENUM ('YES', 'PARTIALLY', 'NO');

ALTER TABLE "Review" ADD COLUMN "addressedArtistNote" "AddressedArtistNote";
ALTER TABLE "Review" ADD COLUMN "nextActions" TEXT;
ALTER TABLE "Review" ADD COLUMN "timestamps" JSONB;
