// Re-run kris's metadata-only report through the fixed pipeline:
// clear the score (the public /generate route only regenerates when score is
// null), then hit the prod self-heal endpoint and verify grounding.
import { config } from "dotenv";
config({ path: ".env.local" });

const REPORT_ID = "cmq7orjc3000004kzrr8zm091";
const SLUG = "cmq7orjc3000104kzri2cw7wd";

async function main() {
  const { prisma } = await import("@/lib/prisma");

  await prisma.trackScoreReport.update({
    where: { id: REPORT_ID },
    data: { score: null, reviewerQuotes: undefined, status: "PENDING" },
  });
  console.log("report cleared → PENDING");

  const res = await fetch(`https://www.mixreflect.com/api/score/${SLUG}/generate`, {
    method: "POST",
  });
  console.log("generate:", res.status, await res.text());

  const after = await prisma.trackScoreReport.findUnique({
    where: { id: REPORT_ID },
    select: { score: true, status: true, fingerprint: true, reviewerQuotes: true },
  });
  const q = (after?.reviewerQuotes as Record<string, unknown> | null) ?? {};
  console.log({
    score: after?.score,
    status: after?.status,
    grounded: (q as any).grounded,
    deep: (q as any).deep,
    hasFingerprint: !!after?.fingerprint,
  });
  console.log(`https://www.mixreflect.com/report/${SLUG}`);
  await prisma.$disconnect();
}
main();
