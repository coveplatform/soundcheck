-- Merge freeReviewCredits into reviewCredits and remove freeReviewCredits column
-- This fixes the critical bug where new users get 1 freeReviewCredit but code only checks reviewCredits

-- Step 1: Merge both credit fields into reviewCredits
DO $$
BEGIN
  -- Only run if both columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ArtistProfile'
    AND column_name = 'freeReviewCredits'
  ) THEN
    -- Add freeReviewCredits to reviewCredits for all existing users
    UPDATE "ArtistProfile"
    SET "reviewCredits" = "reviewCredits" + COALESCE("freeReviewCredits", 0);

    -- Drop the freeReviewCredits column
    ALTER TABLE "ArtistProfile" DROP COLUMN "freeReviewCredits";
  END IF;
END $$;

-- Step 2: Add reviewCredits column if it doesn't exist, then set default to 1
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "reviewCredits" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ArtistProfile" ALTER COLUMN "reviewCredits" SET DEFAULT 1;
