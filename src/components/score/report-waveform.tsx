/**
 * The measured 3-band waveform on the live report.
 *
 * Renders the worker's per-column LOW/MID/HIGH peaks as a rekordbox-style
 * "spearhead" recolored to the icy palette: deep-cyan bass body, bright cyan
 * mids, white core. Pure server-renderable SVG — no canvas, no hydration wait.
 * Data comes from TrackScoreReport.waveform (see worker `_report_waveform`).
 *
 * Moment markers (derived from the measured RMS body, see deriveWaveMoments)
 * annotate the wave SoundCloud-comment style. On a locked report one marker is
 * open and the rest blur their note (timestamp visible — receipts with
 * coordinates); unlocked reports get every marker open.
 */

import { Lock } from "lucide-react";

const SPEAR = { lo: "rgb(18,88,138)", mid: "rgb(110,231,255)", hi: "rgb(244,244,239)" };
// Green variant marks the free moment's slice (matches the demo teaser).
const SPEAR_FREE = { lo: "rgb(22,118,88)", mid: "rgb(124,255,196)", hi: "rgb(255,255,255)" };
const GREEN = "#7cffc4";
const ACCENT = "#6ee7ff";
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

export type WaveMoment = {
  /** Position across the wave, 0-100. */
  pct: number;
  /** Timestamp into the analysed span, mm:ss. */
  at: string;
  note: string;
  /** The one marker that stays open on a locked report. */
  free?: boolean;
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

function smooth(v: number[], win: number): number[] {
  const pre = new Float64Array(v.length + 1);
  for (let i = 0; i < v.length; i++) pre[i + 1] = pre[i]! + v[i]!;
  const out = new Array<number>(v.length);
  for (let i = 0; i < v.length; i++) {
    const a = Math.max(0, i - win);
    const b = Math.min(v.length, i + win + 1);
    out[i] = (pre[b]! - pre[a]!) / (b - a);
  }
  return out;
}

/**
 * Measured moment markers, derived from the waveform's RMS body (no AI, no
 * extra storage — works for every report that has a waveform): the first real
 * lift out of the intro, the fullest stretch (the free marker), the deepest
 * energy dip after the lift, and where the outro starts winding down.
 */
export function deriveWaveMoments(data: ReportWaveformData): WaveMoment[] {
  const dur = data.durationSec ?? null;
  if (!dur || dur < 45) return [];

  const amp = data.amp ? b64ToBytes(data.amp) : null;
  let env: number[];
  if (amp && amp.length >= 64) {
    env = Array.from(amp, (v) => v / 255);
  } else {
    const lo = b64ToBytes(data.lo);
    const mid = b64ToBytes(data.mid);
    const hi = b64ToBytes(data.hi);
    if (!lo || !mid || !hi || lo.length < 64) return [];
    env = Array.from(lo, (v, i) => Math.max(v, mid[i] ?? 0, hi[i] ?? 0) / 255);
  }

  const n = env.length;
  // ~3s smoothing window so kicks don't read as structure
  const norm = smooth(env, Math.max(2, Math.round((3 / dur) * n)));
  const peak = Math.max(...norm);
  if (peak <= 0.01) return [];
  for (let i = 0; i < n; i++) norm[i] = norm[i]! / peak;

  const sec = (i: number) => (i / (n - 1)) * dur;
  const truncated =
    data.sourceDurationSec != null && data.sourceDurationSec > dur + 5;

  // first real lift — where the track opens up out of the intro
  let liftIdx = 0;
  while (liftIdx < n && norm[liftIdx]! < 0.6) liftIdx++;
  if (liftIdx >= n) liftIdx = 0;
  const liftSec = sec(liftIdx);

  // the fullest sustained stretch (the free marker)
  let peakIdx = 0;
  for (let i = 0; i < n; i++) if (norm[i]! > norm[peakIdx]!) peakIdx = i;

  // deepest dip after the lift (drift risk), ignoring the outro
  let dipIdx = -1;
  const dipFrom = Math.min(n - 1, liftIdx + Math.round(n * 0.05));
  const dipTo = Math.round(n * 0.92);
  for (let i = dipFrom; i < dipTo; i++) {
    if (dipIdx < 0 || norm[i]! < norm[dipIdx]!) dipIdx = i;
  }

  // where the energy starts winding down (skip when the analysis window cut
  // the track short — that "fade" would just be the cutoff)
  let outIdx = n - 1;
  while (outIdx > 0 && norm[outIdx]! < 0.5) outIdx--;

  type Candidate = WaveMoment & { idx: number; prio: number };
  const candidates: Candidate[] = [
    {
      idx: peakIdx,
      prio: 0,
      free: true,
      pct: 0,
      at: mmss(sec(peakIdx)),
      note: "the track hits its fullest stretch here — peak energy on the read",
    },
  ];
  if (liftSec >= 6 && liftSec <= dur * 0.4) {
    candidates.push({
      idx: liftIdx,
      prio: 1,
      pct: 0,
      at: mmss(liftSec),
      note: `the first real lift — ${Math.round(liftSec)}s of intro before the track opens up`,
    });
  }
  if (dipIdx >= 0 && norm[dipIdx]! <= 0.65) {
    candidates.push({
      idx: dipIdx,
      prio: 2,
      pct: 0,
      at: mmss(sec(dipIdx)),
      note: "energy dips here — the most likely spot for attention to drift",
    });
  }
  if (!truncated && dur - sec(outIdx) >= 8) {
    candidates.push({
      idx: outIdx,
      prio: 3,
      pct: 0,
      at: mmss(sec(outIdx)),
      note: "the energy starts winding down into the outro here",
    });
  }

  // keep markers at least ~6% apart; the free marker always wins a collision
  candidates.sort((a, b) => a.prio - b.prio);
  const kept: Candidate[] = [];
  for (const c of candidates) {
    c.pct = Math.min(98.5, Math.max(1.5, (c.idx / (n - 1)) * 100));
    if (kept.every((k) => Math.abs(k.pct - c.pct) >= 6)) kept.push(c);
  }
  kept.sort((a, b) => a.pct - b.pct);
  return kept.map(({ idx: _idx, prio: _prio, ...m }) => m);
}

export function ReportWaveform({
  data,
  moments = [],
  sealed = false,
  className = "",
}: {
  data: ReportWaveformData;
  /** Moment markers from deriveWaveMoments (omit for the bare wave). */
  moments?: WaveMoment[];
  /** Locked report: non-free marker notes blur (timestamps stay visible). */
  sealed?: boolean;
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
  const dTotal = poly(totalH);
  const dMid = poly(midH);
  const dCore = poly(coreH);

  const analysed = data.durationSec ?? null;
  const sourceDur = data.sourceDurationSec ?? null;
  const truncated = analysed != null && sourceDur != null && sourceDur > analysed + 5;

  // the free moment's slice gets re-tinted green (clip id is deterministic so
  // the SVG stays server-renderable — one report waveform per page)
  const free = moments.find((m) => m.free);
  const clipId = free ? `wf-free-${Math.round(free.pct * 10)}` : null;
  const freeX = free ? ((free.pct - 1.6) / 100) * W : 0;
  const freeW = (3.2 / 100) * W;

  return (
    <div className={className}>
      <div className="relative h-24 border-b border-white/10">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-full block"
          aria-hidden
        >
          {clipId && (
            <defs>
              <clipPath id={clipId}>
                <rect x={freeX} y={0} width={freeW} height={H} />
              </clipPath>
            </defs>
          )}
          <path d={dTotal} fill={SPEAR.lo} />
          <path d={dMid} fill={SPEAR.mid} />
          <path d={dCore} fill={SPEAR.hi} />
          {clipId && (
            <g clipPath={`url(#${clipId})`}>
              <path d={dTotal} fill={SPEAR_FREE.lo} />
              <path d={dMid} fill={SPEAR_FREE.mid} />
              <path d={dCore} fill={SPEAR_FREE.hi} />
            </g>
          )}
        </svg>

        {/* marker hairlines */}
        {moments.map((m) => (
          <span
            key={m.at}
            className="absolute top-0 bottom-0 w-px pointer-events-none"
            style={{
              left: `${m.pct}%`,
              background: m.free ? "rgba(124,255,196,0.5)" : "rgba(110,231,255,0.25)",
            }}
          />
        ))}

        {/* marker dots + bubbles — free: always open; others: on hover, note
            blurred behind the seal on a locked report */}
        {moments.map((m) => {
          const isSealed = sealed && !m.free;
          const align =
            m.pct <= 12 ? "left-0" : m.pct >= 88 ? "right-0" : "left-1/2 -translate-x-1/2";
          return (
            <a
              key={m.at}
              href={isSealed ? "#unlock" : undefined}
              className={`absolute -bottom-2.5 -translate-x-1/2 group ${m.free ? "z-20" : "z-10 hover:z-30"}`}
              style={{ left: `${m.pct}%` }}
            >
              <span
                className={`${m.free ? "flex" : "hidden group-hover:flex"} absolute bottom-[30px] ${align} items-center gap-1.5 text-[11px] px-2 py-1 border w-max max-w-[230px] font-mono`}
                style={
                  m.free
                    ? { background: GREEN, color: "#000", borderColor: GREEN, fontWeight: 700 }
                    : {
                        background: "#101010",
                        color: "rgba(255,255,255,0.75)",
                        borderColor: "rgba(255,255,255,0.2)",
                      }
                }
              >
                <span className="shrink-0" style={m.free ? undefined : { color: ACCENT }}>
                  {m.at}
                </span>
                {isSealed ? (
                  <>
                    <span className="blur-[4px] opacity-60 select-none normal-case" aria-hidden>
                      {m.note}
                    </span>
                    <Lock className="h-2.5 w-2.5 shrink-0 opacity-60" />
                  </>
                ) : (
                  <span className="normal-case">{m.note}</span>
                )}
              </span>
              <span
                className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition group-hover:scale-110"
                style={
                  m.free
                    ? { background: GREEN, borderColor: GREEN }
                    : {
                        background: "#101010",
                        borderColor: isSealed ? "rgba(255,255,255,0.3)" : ACCENT,
                      }
                }
              >
                {isSealed ? (
                  <Lock className="h-2 w-2 text-white/50" />
                ) : (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: m.free ? "#000" : ACCENT }}
                  />
                )}
              </span>
            </a>
          );
        })}
      </div>
      <div
        className={`flex items-center justify-between text-[10px] text-white/30 ${moments.length ? "mt-5" : "mt-1.5"} font-mono`}
      >
        <span>0:00</span>
        <span className="text-white/40 normal-case">
          {truncated
            ? `first ${mmss(analysed!)} of ${mmss(sourceDur!)} analysed`
            : moments.length
              ? `${moments.length} moment markers from the read${sealed ? " · 1 unlocked" : ""}`
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
