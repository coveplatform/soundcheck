-- Pre-auth score submissions: generate the report before the user signs in,
-- then redeem an anonymous claim token once they authenticate.
ALTER TABLE "TrackScoreReport" ADD COLUMN IF NOT EXISTS "claimToken" TEXT;
ALTER TABLE "TrackScoreReport" ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3);
ALTER TABLE "TrackScoreReport" ADD COLUMN IF NOT EXISTS "createdByIp" TEXT;

-- One token maps to at most one report.
CREATE UNIQUE INDEX IF NOT EXISTS "TrackScoreReport_claimToken_key" ON "TrackScoreReport"("claimToken");
