/*
  Warnings:

  - The `abletonRenderStatus` column on the `Track` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'AbletonRenderStatus'
  ) THEN
    CREATE TYPE "AbletonRenderStatus" AS ENUM ('PENDING', 'RENDERING', 'COMPLETED', 'FAILED');
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."Track"') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Track'
        AND column_name = 'abletonRenderStatus'
    ) THEN
      ALTER TABLE "Track" ADD COLUMN "abletonRenderStatus" "AbletonRenderStatus";
    ELSE
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Track'
          AND column_name = 'abletonRenderStatus'
          AND udt_name <> 'AbletonRenderStatus'
      ) THEN
        ALTER TABLE "Track"
          ALTER COLUMN "abletonRenderStatus" TYPE "AbletonRenderStatus"
          USING (
            CASE
              WHEN "abletonRenderStatus" IN ('PENDING', 'RENDERING', 'COMPLETED', 'FAILED')
                THEN "abletonRenderStatus"::"AbletonRenderStatus"
              ELSE NULL
            END
          );
      END IF;
    END IF;
  END IF;
END $$;
