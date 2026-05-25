import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!url) throw new Error("No database URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const EMAIL = process.argv[2];
const AMOUNT = parseInt(process.argv[3] ?? "0", 10);

if (!EMAIL || !AMOUNT) {
  console.error("Usage: npx tsx prisma/give-credits.ts <email> <amount>");
  process.exit(1);
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    include: { ArtistProfile: { select: { id: true, reviewCredits: true } } },
  });
  if (!user?.ArtistProfile) {
    console.log(`NOT FOUND: ${EMAIL}`);
    return;
  }
  const before = user.ArtistProfile.reviewCredits;
  const updated = await prisma.artistProfile.update({
    where: { id: user.ArtistProfile.id },
    data: { reviewCredits: { increment: AMOUNT } },
    select: { reviewCredits: true },
  });
  console.log(`Done — ${EMAIL}: ${before} → ${updated.reviewCredits} credits`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
