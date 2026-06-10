import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;
if (!url) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3); // last 3 days

async function main() {
  console.log("=== ArtistProfiles with subscription (subscriptionTier/status set) ===");
  const subs = await prisma.artistProfile.findMany({
    where: {
      OR: [
        { subscriptionStatus: { not: null } },
        { subscriptionTier: { not: null } },
      ],
    },
    select: {
      id: true,
      artistName: true,
      reviewCredits: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionId: true,
      subscriptionCurrentPeriodStart: true,
      subscriptionCurrentPeriodEnd: true,
      subscriptionCanceledAt: true,
      stripeCustomerId: true,
      User: { select: { email: true } },
    },
    orderBy: { subscriptionCurrentPeriodStart: "desc" },
  });
  console.log(JSON.stringify(subs, null, 2));

  console.log("\n=== ScoreSubscribers (score-product unlimited) ===");
  const ss = await prisma.scoreSubscriber.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  console.log(JSON.stringify(ss, null, 2));

  console.log("\n=== Recent AddOnPayments (last 3 days) ===");
  const addons = await prisma.addOnPayment.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });
  console.log(JSON.stringify(addons, null, 2));

  console.log("\n=== Recent ExternalPurchases (last 3 days) ===");
  const ext = await prisma.externalPurchase.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });
  console.log(JSON.stringify(ext, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
