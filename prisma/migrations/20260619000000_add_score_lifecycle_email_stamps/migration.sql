-- Behavioral lifecycle-email dedupe stamps for the score report product.
-- Both nullable: set the first (and only) time each lifecycle email is sent.
ALTER TABLE "TrackScoreReport" ADD COLUMN IF NOT EXISTS "reminderEmailedAt" TIMESTAMP(3);
ALTER TABLE "TrackScoreReport" ADD COLUMN IF NOT EXISTS "secondTrackEmailedAt" TIMESTAMP(3);
