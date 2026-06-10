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

const EMAIL = "geteasewithpa@gmail.com";

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: EMAIL, mode: "insensitive" } },
    include: {
      ArtistProfile: true,
      Account: { select: { provider: true } },
    },
  });
  console.log("=== USER ===");
  if (user) {
    console.log("id:          ", user.id);
    console.log("email:       ", user.email);
    console.log("name:        ", user.name);
    console.log("createdAt:   ", user.createdAt);
    console.log("lastActiveAt:", user.lastActiveAt);
    console.log("provider:    ", user.Account?.[0]?.provider);
    console.log("referredBy:  ", user.referredByCode);
    console.log("artistProfile:", user.ArtistProfile ? user.ArtistProfile.artistName : null);
  } else {
    console.log("No User row (email-only submitter)");
  }

  const sub = await prisma.scoreSubscriber.findFirst({
    where: { email: { equals: EMAIL, mode: "insensitive" } },
  });
  console.log("\n=== SUBSCRIBER ROW ===");
  console.log(sub ?? "none");

  const reports = await prisma.trackScoreReport.findMany({
    where: { email: { equals: EMAIL, mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
  });
  console.log(`\n=== ${reports.length} SCORE REPORTS ===`);
  for (const r of reports) {
    console.log("------------------------------------------------");
    console.log("createdAt:  ", r.createdAt.toISOString());
    console.log("slug:       ", r.slug);
    console.log("title:      ", r.trackTitle);
    console.log("trackUrl:   ", r.trackUrl);
    console.log("genre:      ", r.genre);
    console.log("status:     ", r.status);
    console.log("score:      ", r.score, "| verdict:", r.verdict);
    console.log("paidAt:     ", r.paidAt);
    console.log("completedAt:", r.completedAt);
    if (r.notes) console.log("notes:      ", r.notes);
  }

  // Same track resubmitted? Group by URL/title
  const byUrl = new Map<string, number>();
  for (const r of reports) {
    const k = (r.trackUrl || "").trim();
    byUrl.set(k, (byUrl.get(k) ?? 0) + 1);
  }
  console.log("\n=== SUBMISSIONS PER TRACK URL ===");
  for (const [u2, n] of [...byUrl.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`${String(n).padStart(2)}x  ${u2}`);
  }

  // Burst analysis: submissions per calendar day
  const byDay = new Map<string, number>();
  for (const r of reports) {
    const d = r.createdAt.toISOString().slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  console.log("\n=== SUBMISSIONS PER DAY ===");
  for (const [d, n] of byDay.entries()) console.log(`${d}: ${n}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
