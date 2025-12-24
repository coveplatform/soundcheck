ALTER TABLE "ReviewerProfile" ALTER COLUMN "tier" DROP DEFAULT;

ALTER TYPE "ReviewerTier" RENAME TO "ReviewerTier_old";
CREATE TYPE "ReviewerTier" AS ENUM ('NORMAL', 'PRO');

ALTER TABLE "ReviewerProfile"
ALTER COLUMN "tier" TYPE "ReviewerTier"
USING (
  CASE
    WHEN "tier"::text IN ('ROOKIE', 'VERIFIED') THEN 'NORMAL'
    ELSE "tier"::text
  END
)::"ReviewerTier";

ALTER TABLE "ReviewerProfile" ALTER COLUMN "tier" SET DEFAULT 'NORMAL';

DROP TYPE "ReviewerTier_old";
