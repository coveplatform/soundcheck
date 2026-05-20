-- Create enums (IF NOT EXISTS guard)
DO $$ BEGIN
  CREATE TYPE "ScoreReportStatus" AS ENUM ('PENDING', 'PAID', 'IN_REVIEW', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ScoreVerdict" AS ENUM ('RELEASE_READY', 'ALMOST_THERE', 'NEEDS_WORK', 'NOT_READY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create table
CREATE TABLE IF NOT EXISTS "TrackScoreReport" (
    "id"              TEXT NOT NULL,
    "slug"            TEXT NOT NULL,
    "email"           TEXT NOT NULL,
    "trackUrl"        TEXT NOT NULL,
    "trackTitle"      TEXT,
    "genre"           TEXT,
    "notes"           TEXT,
    "status"          "ScoreReportStatus" NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT,
    "paidAt"          TIMESTAMP(3),
    "completedAt"     TIMESTAMP(3),
    "score"           INTEGER,
    "percentile"      DOUBLE PRECISION,
    "verdict"         "ScoreVerdict",
    "hookScore"       DOUBLE PRECISION,
    "productionScore" DOUBLE PRECISION,
    "retentionScore"  DOUBLE PRECISION,
    "emotionalScore"  DOUBLE PRECISION,
    "commercialScore" DOUBLE PRECISION,
    "aiSummary"       TEXT,
    "reviewerQuotes"  JSONB,
    "priorityFixes"   JSONB,
    "artistId"        TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrackScoreReport_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "TrackScoreReport_slug_key"            ON "TrackScoreReport"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "TrackScoreReport_stripeSessionId_key" ON "TrackScoreReport"("stripeSessionId");

-- Regular indexes
CREATE INDEX IF NOT EXISTS "TrackScoreReport_email_idx"  ON "TrackScoreReport"("email");
CREATE INDEX IF NOT EXISTS "TrackScoreReport_status_idx" ON "TrackScoreReport"("status");

-- Foreign key (only if not already present)
DO $$ BEGIN
  ALTER TABLE "TrackScoreReport"
    ADD CONSTRAINT "TrackScoreReport_artistId_fkey"
    FOREIGN KEY ("artistId") REFERENCES "ArtistProfile"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
