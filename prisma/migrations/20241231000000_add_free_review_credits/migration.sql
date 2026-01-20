-- AlterTable
DO $$
BEGIN
  IF to_regclass('public."ArtistProfile"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "freeReviewCredits" INTEGER NOT NULL DEFAULT 1';
  END IF;
END $$;
