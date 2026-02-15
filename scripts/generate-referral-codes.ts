/**
 * Generate referral codes for existing users who don't have one yet
 */

import { prisma } from "../src/lib/prisma";
import { generateReferralCode } from "../src/lib/referral-system";

async function main() {
  console.log("🔄 Generating referral codes for existing users...\n");

  const usersWithoutCodes = await prisma.user.findMany({
    where: {
      referralCode: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log(`Found ${usersWithoutCodes.length} users without referral codes\n`);

  let updated = 0;
  let failed = 0;

  for (const user of usersWithoutCodes) {
    try {
      const name = user.name || user.email.split("@")[0];
      const code = await generateReferralCode(name, user.id);

      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode: code },
      });

      console.log(`✅ ${user.email}: ${code}`);
      updated++;
    } catch (error) {
      console.error(`❌ Failed for ${user.email}:`, error);
      failed++;
    }
  }

  console.log(`\n✅ Done! Updated: ${updated}, Failed: ${failed}`);
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
