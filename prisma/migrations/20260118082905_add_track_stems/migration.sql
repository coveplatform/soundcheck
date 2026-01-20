-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'StemType'
  ) THEN
    CREATE TYPE "StemType" AS ENUM ('MASTER', 'DRUMS', 'BASS', 'SYNTHS', 'VOCALS', 'MELODY', 'FX', 'OTHER');
  END IF;
END $$;

-- AlterTable
ALTER TABLE "Track" ADD COLUMN IF NOT EXISTS "hasStems" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "TrackStem" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "stemUrl" TEXT NOT NULL,
    "stemType" "StemType" NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "duration" INTEGER,
    "waveformData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackStem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrackStem_trackId_order_idx" ON "TrackStem"("trackId", "order");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrackStem_trackId_idx" ON "TrackStem"("trackId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TrackStem_trackId_fkey'
  ) THEN
    ALTER TABLE "TrackStem" ADD CONSTRAINT "TrackStem_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
