-- Add Ableton project support to Track model
ALTER TABLE "Track" ADD COLUMN IF NOT EXISTS "abletonProjectUrl" TEXT;
ALTER TABLE "Track" ADD COLUMN IF NOT EXISTS "abletonProjectData" JSONB;
ALTER TABLE "Track" ADD COLUMN IF NOT EXISTS "abletonRenderStatus" TEXT;

-- Add index for rendering status queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'Track_abletonRenderStatus_idx'
  ) THEN
    CREATE INDEX "Track_abletonRenderStatus_idx" ON "Track"("abletonRenderStatus") WHERE "abletonRenderStatus" IS NOT NULL;
  END IF;
END $$;
