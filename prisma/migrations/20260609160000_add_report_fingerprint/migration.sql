-- Acoustic identity for re-upload / new-version detection (set by the audio worker).
ALTER TABLE "TrackScoreReport" ADD COLUMN IF NOT EXISTS "fingerprint" JSONB;
