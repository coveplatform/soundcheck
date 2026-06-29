import { NextResponse } from "next/server";
import { sweepMissingDeepReads, sweepMissingInstantReads } from "@/lib/score-sweep";

// One deep read (Replicate cold start + stems + a big LLM call) can approach the
// ceiling, so the sweep does ONE report per invocation and this cron runs often
// (every ~10 min) to drain a backlog quickly — instead of 2/day inside the
// daily cleanup, which structurally could never keep up.
export const maxDuration = 300;

/**
 * Dedicated deep-read delivery cron.
 *
 * Premium deep reads are fire-and-forget from the unlock paths; a serverless
 * kill drops them. This is the backstop that re-fires them, now starvation-safe
 * (terminally-failed reports are skipped, never-attempted ones go first). Split
 * out of /api/cron/cleanup so paid deliverables aren't gated by a once-daily job.
 *
 * Protected by CRON_SECRET.
 */
export async function POST(request: Request) {
  if (!process.env.CRON_SECRET) {
    console.error("[deep-reads] CRON_SECRET not configured");
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
  }
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rebuild blank (score=null) owned reports first — cheap relative to a deep
  // read and it unblocks customers stuck with nothing — then drain deep reads.
  const instant = await sweepMissingInstantReads().catch((err) => {
    console.error("[deep-reads] instant sweep failed:", err);
    return { stuck: 0, repaired: 0, failed: 0, attempted: [] as string[] };
  });

  const deep = await sweepMissingDeepReads().catch((err) => {
    console.error("[deep-reads] deep sweep failed:", err);
    return { missing: 0, repaired: 0, failed: 0, terminallyFailed: 0, attempted: [] as string[] };
  });

  return NextResponse.json({ success: true, instant, deep, timestamp: new Date().toISOString() });
}

// Allow GET for manual testing (still requires auth).
export async function GET(request: Request) {
  return POST(request);
}
