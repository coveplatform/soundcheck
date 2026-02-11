-- Unify peer reviewer profiles: make reviewerId optional on Review and ReviewQueue
-- so peer reviews use only peerReviewerArtistId / artistReviewerId without needing ReviewerProfile

-- Step 1: Make Review.reviewerId nullable
ALTER TABLE "Review" ALTER COLUMN "reviewerId" DROP NOT NULL;

-- Step 2: Make ReviewQueue.reviewerId nullable
ALTER TABLE "ReviewQueue" ALTER COLUMN "reviewerId" DROP NOT NULL;

-- Step 3: Add unique constraint for peer reviews (trackId + peerReviewerArtistId)
-- PostgreSQL allows multiple NULLs in unique constraints, so this won't conflict with legacy reviews
CREATE UNIQUE INDEX "Review_trackId_peerReviewerArtistId_key" ON "Review"("trackId", "peerReviewerArtistId");

-- Step 4: Add unique constraint for peer queue entries (trackId + artistReviewerId)
CREATE UNIQUE INDEX "ReviewQueue_trackId_artistReviewerId_key" ON "ReviewQueue"("trackId", "artistReviewerId");

-- Step 5: Null out reviewerId on existing peer reviews (they were set to auto-created ReviewerProfiles)
UPDATE "Review" SET "reviewerId" = NULL WHERE "isPeerReview" = true AND "peerReviewerArtistId" IS NOT NULL;

-- Step 6: Null out reviewerId on existing peer queue entries
UPDATE "ReviewQueue" SET "reviewerId" = NULL WHERE "artistReviewerId" IS NOT NULL;
