import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: "postgresql://neondb_owner:npg_kpCRT4IHM6Uh@ep-rough-sea-a1lcoouv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" }),
});

async function main() {
  const referred = await prisma.user.findMany({
    where: { referredByCode: { not: null } },
    select: {
      email: true,
      referredByCode: true,
      createdAt: true,
      ArtistProfile: { select: { reviewCredits: true, completedOnboarding: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Users with referredByCode: ${referred.length}\n`);
  for (const u of referred) {
    console.log(
      `${u.email} | code: ${u.referredByCode} | onboarded: ${u.ArtistProfile?.completedOnboarding ?? false} | credits: ${u.ArtistProfile?.reviewCredits ?? "no profile"} | joined: ${u.createdAt.toLocaleDateString()}`
    );
  }

  // Also check who has made referrals
  const referrers = await prisma.user.findMany({
    where: { totalReferrals: { gt: 0 } },
    select: { email: true, totalReferrals: true, referralCode: true },
  });

  console.log(`\nUsers with completed referrals: ${referrers.length}`);
  for (const u of referrers) {
    console.log(`${u.email} | code: ${u.referralCode} | total referrals: ${u.totalReferrals}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
