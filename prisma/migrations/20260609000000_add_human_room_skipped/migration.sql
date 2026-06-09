-- Subscriber submitted past their monthly real-reviewer-round allowance:
-- full AI read still delivered, but no human room assigned for this report.
ALTER TABLE "TrackScoreReport" ADD COLUMN IF NOT EXISTS "humanRoomSkipped" BOOLEAN NOT NULL DEFAULT false;
