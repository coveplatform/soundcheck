import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public social proof for the landing page: how many honest reviews have been
 * delivered, plus a few anonymized snippets (no track or artist attached).
 */
export const revalidate = 1800; // 30 min

export async function GET() {
  try {
    const [count, rows] = await Promise.all([
      prisma.review.count({ where: { status: "COMPLETED" } }),
      prisma.review.findMany({
        where: { status: "COMPLETED", bestPart: { not: null } },
        select: { bestPart: true, productionScore: true, originalityScore: true },
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
    ]);

    // Keep substantive, self-contained snippets; anonymize entirely.
    const snippets = rows
      .map((r) => ({
        text: (r.bestPart ?? "").trim(),
        rating: Math.max(3, Math.round(((r.productionScore ?? 4) + (r.originalityScore ?? 4)) / 2)),
      }))
      .filter((s) => s.text.length >= 45 && s.text.length <= 180)
      .slice(0, 6);

    return NextResponse.json({ count, snippets });
  } catch {
    return NextResponse.json({ count: 0, snippets: [] });
  }
}
