// Why did kris's latest score report fall back to metadata-only?
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("@/lib/prisma");
  const reports = await prisma.trackScoreReport.findMany({
    where: { email: "kris.engelhardt4@gmail.com" },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      slug: true,
      createdAt: true,
      status: true,
      trackUrl: true,
      trackTitle: true,
      score: true,
      paidAt: true,
      fingerprint: true,
      reviewerQuotes: true,
    },
  });
  for (const r of reports) {
    const q = (r.reviewerQuotes as Record<string, unknown> | null) ?? {};
    console.log({
      id: r.id,
      slug: r.slug,
      createdAt: r.createdAt,
      status: r.status,
      trackUrl: r.trackUrl,
      trackTitle: r.trackTitle,
      score: r.score,
      paid: !!r.paidAt,
      hasFingerprint: !!r.fingerprint,
      quoteKeys: Object.keys(q),
      grounded: (q as any).grounded ?? (q as any).measured ?? "(n/a)",
    });
  }
  await prisma.$disconnect();
}
main();
