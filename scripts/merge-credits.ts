import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function mergeCredits() {
  console.log('Starting credit field merge...');

  try {
    // Execute the migration SQL
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- Only run if both columns exist
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'ArtistProfile'
          AND column_name = 'freeReviewCredits'
        ) THEN
          -- Add freeReviewCredits to reviewCredits for all existing users
          UPDATE "ArtistProfile"
          SET "reviewCredits" = "reviewCredits" + COALESCE("freeReviewCredits", 0);

          -- Drop the freeReviewCredits column
          ALTER TABLE "ArtistProfile" DROP COLUMN "freeReviewCredits";

          RAISE NOTICE 'Successfully merged freeReviewCredits into reviewCredits and dropped column';
        ELSE
          RAISE NOTICE 'freeReviewCredits column does not exist, skipping merge';
        END IF;
      END $$;
    `);

    // Change the default value of reviewCredits to 1
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ArtistProfile" ALTER COLUMN "reviewCredits" SET DEFAULT 1;
    `);

    console.log('✅ Credit field merge completed successfully!');
    console.log('   - Merged freeReviewCredits into reviewCredits');
    console.log('   - Dropped freeReviewCredits column');
    console.log('   - Set reviewCredits default to 1');
  } catch (error) {
    console.error('❌ Error during credit field merge:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

mergeCredits();
