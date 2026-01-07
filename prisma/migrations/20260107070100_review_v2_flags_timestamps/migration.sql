-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "reviewSchemaVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "countsTowardCompletion" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "countsTowardAnalytics" BOOLEAN NOT NULL DEFAULT true;

-- Backfill: existing flagged reviews should no longer count
UPDATE "Review"
SET
    "countsTowardCompletion" = false,
    "countsTowardAnalytics" = false
WHERE "wasFlagged" = true;

-- CreateTable
CREATE TABLE "ReviewTimestamp" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "seconds" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewTimestamp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewTimestamp_reviewId_idx" ON "ReviewTimestamp"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewTimestamp_reviewId_seconds_idx" ON "ReviewTimestamp"("reviewId", "seconds");

-- AddForeignKey
ALTER TABLE "ReviewTimestamp" ADD CONSTRAINT "ReviewTimestamp_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
