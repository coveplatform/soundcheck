-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "isGem" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ReviewerProfile" ADD COLUMN     "gemCount" INTEGER NOT NULL DEFAULT 0;
