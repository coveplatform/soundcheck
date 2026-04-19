import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url! }) });

const EMAILS = [
  "jesusgirlarchive@gmail.com",
  "afiguera@gmail.com",
  "sean.ogilvie@aol.com",
  "ppepon788@gmail.com",
  "the7thparadox.band@gmail.com",
  "rellval06@gmail.com",
  "turnertn931@gmail.com",
];

async function main() {
  for (const email of EMAILS) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) { console.log(`[MISS] ${email}`); continue; }
    const ap = await prisma.artistProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!ap) { console.log(`[MISS] No profile: ${email}`); continue; }
    const tracks = await prisma.track.findMany({
      where: { artistId: ap.id },
      select: { id: true, title: true, status: true, reviewsCompleted: true, reviewsRequested: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    for (const t of tracks) {
      const icon = t.status === "COMPLETED" ? "✓" : "✗";
      console.log(`  ${icon} [${t.status}] "${t.title}" — ${t.reviewsCompleted}/${t.reviewsRequested}  (${email})`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
