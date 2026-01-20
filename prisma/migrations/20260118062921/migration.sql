/*
  Warnings:

  - A unique constraint covering the columns `[shareId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "shareId" TEXT;

-- CreateIndex
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'Review_shareId_key'
  ) THEN
    CREATE UNIQUE INDEX "Review_shareId_key" ON "Review"("shareId");
  END IF;
END $$;
