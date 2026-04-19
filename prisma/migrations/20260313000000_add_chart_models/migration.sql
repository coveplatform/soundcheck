-- CreateTable
CREATE TABLE IF NOT EXISTS "ChartSubmission" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "chartDate" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "artworkUrl" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" "TrackSource" NOT NULL,
    "genre" TEXT,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChartSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChartVote" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "listenDuration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChartVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ChartSubmission_trackId_chartDate_key" ON "ChartSubmission"("trackId", "chartDate");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ChartSubmission_artistId_chartDate_key" ON "ChartSubmission"("artistId", "chartDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChartSubmission_chartDate_voteCount_idx" ON "ChartSubmission"("chartDate", "voteCount");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChartSubmission_chartDate_rank_idx" ON "ChartSubmission"("chartDate", "rank");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChartSubmission_isFeatured_idx" ON "ChartSubmission"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ChartVote_submissionId_voterId_key" ON "ChartVote"("submissionId", "voterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChartVote_voterId_createdAt_idx" ON "ChartVote"("voterId", "createdAt");

-- AddForeignKey
ALTER TABLE "ChartSubmission" ADD CONSTRAINT "ChartSubmission_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartSubmission" ADD CONSTRAINT "ChartSubmission_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "ArtistProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartVote" ADD CONSTRAINT "ChartVote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ChartSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartVote" ADD CONSTRAINT "ChartVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
