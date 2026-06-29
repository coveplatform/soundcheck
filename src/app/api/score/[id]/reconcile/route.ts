import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcileScoreUnlock } from "@/lib/score-unlock";

// May kick generation if the webhook never landed.
export const maxDuration = 60;

/**
 * Self-heal an unlock the Stripe webhook never delivered. [id] is the slug.
 *
 * The report page hits this on the `?unlocked=1` success redirect. It is the
 * ONLY recovery if the webhook is delayed/misconfigured/dropped — without it a
 * paying customer stays locked forever. Safe unauthenticated: reconcileScoreUnlock
 * sets `paidAt` ONLY when Stripe itself confirms the session is paid and belongs
 * to this report. Idempotent with the webhook.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: slug } = await params;
  const report = await prisma.trackScoreReport.findUnique({
    where: { slug },
    select: { id: true, stripeSessionId: true },
  });
  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const result = await reconcileScoreUnlock(report.id, report.stripeSessionId);
  return NextResponse.json(result);
}
