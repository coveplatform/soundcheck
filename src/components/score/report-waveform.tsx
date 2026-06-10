/**
 * The measured 3-band waveform on the live report (unlocked state).
 *
 * Renders the worker's per-column LOW/MID/HIGH peaks as a rekordbox-style
 * "spearhead" recolored to the icy palette: deep-cyan bass body, bright cyan
 * mids, white core. Pure server-renderable SVG — no canvas, no hydration wait.
 * Data comes from TrackScoreReport.waveform (see worker `_report_waveform`).
 */

const SPEAR = { lo: "rgb(18,88,138)", mid: "rgb(110,231,255)", hi: "rgb(244,244,239)" };
// Per-band colour-zone weights (lift weak mids, trim bass) — from djmix.
const W_LO = 0.9;
const W_MID = 1.5;
const W_HI = 1.0;

export type ReportWaveformData = {
  n: number;
  lo: string; // base64 uint8 column peaks
  mid: string;
  hi: string;
  amp?: string;
  durationSec?: number | null;
  sourceDurationSec?: number | null;
};

function b64ToBytes(b64: string): Uint8Array | null {
  try {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ReportWaveform({
  data,
  className = "",
}: {
  data: ReportWaveformData;
  className?: string;
}) {
  const lo = b64ToBytes(data.lo);
  const mid = b64ToBytes(data.mid);
  const hi = b64ToBytes(data.hi);
  if (!lo || !mid || !hi || lo.length < 16) return null;

  const W = 1000;
  const H = 96;
  const cy = H / 2;
  const N = Math.min(480, lo.length);
  const src = lo.length;
  const totalH = new Array<number>(N);
  const midH = new Array<number>(N);
  const coreH = new Array<number>(N);
  for (let i = 0; i < N; i++) {
    const a = Math.floor((i / N) * src);
    const b = Math.max(a + 1, Math.floor(((i + 1) / N) * src));
    let l = 0;
    let m = 0;
    let h = 0;
    for (let j = a; j < b; j++) {
      if (lo[j]! > l) l = lo[j]!;
      if (mid[j]! > m) m = mid[j]!;
      if (hi[j]! > h) h = hi[j]!;
    }
    // silhouette = loudest band; nested colour zones by weighted proportion
    const t = (Math.max(l, m, h) / 255) * (cy - 2);
    const wl = (l / 255) * W_LO;
    const wm = (m / 255) * W_MID;
    const wh = (h / 255) * W_HI;
    const S = wl + wm + wh + 1e-6;
    totalH[i] = t;
    midH[i] = (t * (wm + wh)) / S;
    coreH[i] = (t * wh) / S;
  }
  const poly = (hs: number[]) => {
    let top = "";
    let bot = "";
    for (let i = 0; i < N; i++) {
      const x = ((i / (N - 1)) * W).toFixed(1);
      top += `${i ? "L" : "M"}${x},${(cy - hs[i]!).toFixed(1)}`;
      bot = `L${x},${(cy + hs[i]!).toFixed(1)}` + bot;
    }
    return top + bot + "Z";
  };

  const analysed = data.durationSec ?? null;
  const sourceDur = data.sourceDurationSec ?? null;
  const truncated = analysed != null && sourceDur != null && sourceDur > analysed + 5;

  return (
    <div className={className}>
      <div className="relative h-24 border-b border-white/10">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-full block"
          aria-hidden
        >
          <path d={poly(totalH)} fill={SPEAR.lo} />
          <path d={poly(midH)} fill={SPEAR.mid} />
          <path d={poly(coreH)} fill={SPEAR.hi} />
        </svg>
      </div>
      <div className="flex items-center justify-between text-[10px] text-white/30 mt-1.5 font-mono">
        <span>0:00</span>
        <span className="text-white/40 normal-case">
          {truncated
            ? `first ${mmss(analysed!)} of ${mmss(sourceDur!)} analysed`
            : "measured from your audio"}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5" style={{ background: SPEAR.lo }} /> bass
            <span className="w-1.5 h-1.5 ml-1" style={{ background: SPEAR.mid }} /> mids
            <span className="w-1.5 h-1.5 ml-1" style={{ background: SPEAR.hi }} /> highs
          </span>
          {analysed != null && <span>{mmss(sourceDur ?? analysed)}</span>}
        </span>
      </div>
    </div>
  );
}
