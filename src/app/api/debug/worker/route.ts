import { NextResponse } from "next/server";

// TEMP diagnostic: confirms whether the audio worker env is wired in prod and
// whether the server can reach it. Leaks nothing sensitive (host + booleans).
// Delete once the worker is confirmed grounding.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = process.env.AUDIO_WORKER_URL || null;
  const testUrl = new URL(request.url).searchParams.get("url");

  // Optional: run a real /analyze through the worker (server-side, with the
  // secret) to prove the full grounding pipeline — ?url=<track link>.
  if (url && testUrl) {
    try {
      const base = url.replace(/\/$/, "");
      const t0 = Date.now();
      const r = await fetch(`${base}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.AUDIO_WORKER_SECRET ? { Authorization: `Bearer ${process.env.AUDIO_WORKER_SECRET}` } : {}),
        },
        body: JSON.stringify({ url: testUrl }),
        signal: AbortSignal.timeout(60_000),
      });
      const data = (await r.json().catch(() => null)) as { features?: { durationSec?: number; tempo?: number; key?: string } | null; took?: number } | null;
      return NextResponse.json({
        analyzeStatus: r.status,
        grounded: !!data?.features,
        durationSec: data?.features?.durationSec ?? null,
        tempo: data?.features?.tempo ?? null,
        key: data?.features?.key ?? null,
        took: data?.took ?? null,
        roundTripMs: Date.now() - t0,
      });
    } catch (e) {
      return NextResponse.json({ analyzeError: e instanceof Error ? e.message : String(e) });
    }
  }

  const secretSet = !!process.env.AUDIO_WORKER_SECRET;
  let host: string | null = null;
  try {
    host = url ? new URL(url.startsWith("http") ? url : `https://${url}`).host : null;
  } catch {
    host = "(invalid url)";
  }

  let healthStatus: number | null = null;
  let healthBody: string | null = null;
  let healthError: string | null = null;
  if (url) {
    try {
      const base = url.replace(/\/$/, "");
      const r = await fetch(`${base}/health`, { signal: AbortSignal.timeout(20_000) });
      healthStatus = r.status;
      healthBody = (await r.text().catch(() => "")).slice(0, 120);
    } catch (e) {
      healthError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    urlSet: !!url,
    host,
    secretSet,
    healthStatus,
    healthBody,
    healthError,
  });
}
