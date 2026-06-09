import { NextResponse } from "next/server";

// TEMP diagnostic: confirms whether the audio worker env is wired in prod and
// whether the server can reach it. Leaks nothing sensitive (host + booleans).
// Delete once the worker is confirmed grounding.
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.AUDIO_WORKER_URL || null;
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
