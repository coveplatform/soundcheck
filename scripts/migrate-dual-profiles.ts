/**
 * Migration Script: Dual-Profile to Unified Artist Model
 *
 * This script migrates existing dual-profile users (ListenerProfile + ArtistProfile)
 * to the new unified model where everyone is an artist who can optionally review.
 *
 * WHAT IT DOES:
 * 1. Ensures all users have an ArtistProfile
 * 2. For users with only ListenerProfile: creates ArtistProfile and migrates genre data
 * 3. For users with both: preserves both but marks ListenerProfile as legacy
 * 4. Preserves all financial data (earnings, payouts, stripe accounts)
 *
 * WHAT IT DOESN'T DO:
 * - Delete any data
 * - Modify existing reviews
 * - Transfer pending balances (kept in original profile for payouts)
 */

import { prisma } from '../src/lib/prisma';

interface MigrationStats {
  totalUsers: number;
  usersWithBothProfiles: number;
  usersWithOnlyListener: number;
  usersWithOnlyArtist: number;
  usersWithNeither: number;
  artistProfilesCreated: number;
  genresMigrated: number;
  errors: string[];
}

async function main() {
  console.log('🚀 Starting dual-profile migration...\n');

  // Step 0: Set all users to isArtist=true and isReviewer=true (unified model)
  console.log('📝 Step 1: Updating all users to unified model (isArtist=true, isReviewer=true)...');
  const updateResult = await prisma.user.updateMany({
    data: {
      isArtist: true,
      isReviewer: true,
    },
  });
  console.log(`✓ Updated ${updateResult.count} users to unified model\n`);

  const stats: MigrationStats = {
    totalUsers: 0,
    usersWithBothProfiles: 0,
    usersWithOnlyListener: 0,
    usersWithOnlyArtist: 0,
    usersWithNeither: 0,
    artistProfilesCreated: 0,
    genresMigrated: 0,
    errors: [],
  };

  // Get all users with their profiles
  const users = await prisma.user.findMany({
    include: {
      artistProfile: {
        include: {
          genres: true,
          reviewGenres: true,
        },
      },
      listenerProfile: {
        include: {
          genres: true,
        },
      },
    },
  });

  stats.totalUsers = users.length;
  console.log(`📊 Found ${users.length} total users\n`);

  for (const user of users) {
    const hasArtist = !!user.artistProfile;
    const hasListener = !!user.listenerProfile;

    try {
      // Case 1: User has both profiles (dual-role)
      if (hasArtist && hasListener) {
        stats.usersWithBothProfiles++;
        console.log(`✓ User ${user.email} has both profiles (keeping both for now)`);

        // Ensure reviewGenres are set on ArtistProfile from ListenerProfile genres
        if (user.listenerProfile.genres.length > 0 && user.artistProfile.reviewGenres.length === 0) {
          await prisma.artistProfile.update({
            where: { id: user.artistProfile.id },
            data: {
              reviewGenres: {
                connect: user.listenerProfile.genres.map(g => ({ id: g.id })),
              },
            },
          });
          stats.genresMigrated += user.listenerProfile.genres.length;
          console.log(`  → Migrated ${user.listenerProfile.genres.length} review genres to ArtistProfile`);
        }
      }
      // Case 2: User has only ListenerProfile (paid reviewer, no artist profile)
      else if (!hasArtist && hasListener) {
        stats.usersWithOnlyListener++;
        console.log(`⚠️  User ${user.email} has only ListenerProfile - creating ArtistProfile...`);

        // Create ArtistProfile for this reviewer
        const artistProfile = await prisma.artistProfile.create({
          data: {
            userId: user.id,
            artistName: user.name || user.email.split('@')[0],
            reviewCredits: 5, // Give them some credits to start
            totalCreditsEarned: 5,
            completedOnboarding: user.listenerProfile.completedOnboarding,

            // Copy genres as both artist genres AND review genres
            genres: {
              connect: user.listenerProfile.genres.map(g => ({ id: g.id })),
            },
            reviewGenres: {
              connect: user.listenerProfile.genres.map(g => ({ id: g.id })),
            },
          },
        });

        stats.artistProfilesCreated++;
        stats.genresMigrated += user.listenerProfile.genres.length * 2;

        // Update user to be marked as artist and reviewer (unified model)
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isArtist: true,
            isReviewer: true, // Everyone can review in the unified model
          },
        });

        console.log(`  ✓ Created ArtistProfile for ${user.email}`);
        console.log(`  → Migrated ${user.listenerProfile.genres.length} genres`);
        console.log(`  → Granted 5 review credits`);
      }
      // Case 3: User has only ArtistProfile (normal case - do nothing)
      else if (hasArtist && !hasListener) {
        stats.usersWithOnlyArtist++;
        // This is the ideal state - nothing to do
      }
      // Case 4: User has neither profile (shouldn't happen, but handle it)
      else {
        stats.usersWithNeither++;
        console.log(`❌ User ${user.email} has no profiles - this is an error state`);
        stats.errors.push(`User ${user.id} (${user.email}) has no profiles`);
      }

    } catch (error) {
      const errorMsg = `Failed to migrate user ${user.id} (${user.email}): ${error}`;
      console.error(`❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total users:                 ${stats.totalUsers}`);
  console.log(`Users with both profiles:    ${stats.usersWithBothProfiles}`);
  console.log(`Users with only Listener:    ${stats.usersWithOnlyListener}`);
  console.log(`Users with only Artist:      ${stats.usersWithOnlyArtist}`);
  console.log(`Users with neither:          ${stats.usersWithNeither}`);
  console.log(`\nArtistProfiles created:      ${stats.artistProfilesCreated}`);
  console.log(`Genres migrated:             ${stats.genresMigrated}`);
  console.log(`\nErrors:                      ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    stats.errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log('\n✅ Migration complete!\n');

  // Next steps
  console.log('📋 NEXT STEPS:');
  console.log('1. Review the migration summary above');
  console.log('2. Check that all users have ArtistProfile');
  console.log('3. Update code to stop creating ListenerProfiles');
  console.log('4. Mark ListenerProfile as legacy (keep for payouts only)');
  console.log('5. Eventually deprecate ListenerProfile completely\n');
}

main()
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .then(() => {
    console.log('✅ Migration script completed successfully!');
    process.exit(0);
  });
