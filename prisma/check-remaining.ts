import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

if (!databaseUrl) throw new Error("No database URL");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  const tracks = await prisma.track.findMany({
    where: { status: { in: ["QUEUED", "IN_PROGRESS"] } },
    include: {
      ArtistProfile: { include: { User: { select: { email: true, name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const pending = tracks.filter(t => t.reviewsCompleted < t.reviewsRequested);

  if (pending.length === 0) {
    console.log("\nNo tracks pending reviews.");
    return;
  }

  console.log(`\n${"Email".padEnd(38)} ${"Name".padEnd(20)} ${"Left".padEnd(6)} ${"Title"}`);
  console.log("-".repeat(110));
  for (const t of pending) {
    const remaining = t.reviewsRequested - t.reviewsCompleted;
    const email = t.ArtistProfile.User.email.padEnd(38);
    const name = (t.ArtistProfile.artistName ?? t.ArtistProfile.User.name ?? "").slice(0, 19).padEnd(20);
    const left = `${remaining}/${t.reviewsRequested}`.padEnd(6);
    const title = t.title.slice(0, 45);
    console.log(`${email} ${name} ${left} ${title}`);
  }
  console.log(`\nTotal: ${pending.length} track(s) pending`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
