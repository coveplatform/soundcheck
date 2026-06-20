/**
 * The energy / attention arc across the track — a single smoothed line over the
 * measured envelope, framed as retention: where the track builds, holds, and
 * the dip where listeners are most likely to drop off.
 *
 * Built from the SAME envelope the waveform's moment markers come from
 * (buildEnvelope), so the dip here lines up with the "drift" marker on the
 * waveform above it. Pure server-renderable SVG, no chart lib.
 */

import { buildEnvelope, type ReportWaveformData, type WaveMoment } from "./report-waveform";

const ACCENT = "#6ee7ff";
const DIP = "#b8a4ff";

function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RetentionCurve({
  data,
  moments = [],
  className = "",
}: {
  data: ReportWaveformData;
  /** Moment markers from deriveWaveMoments — the dip is highlighted. */
  moments?: WaveMoment[];
  className?: string;
}) {
  const built = buildEnvelope(data);
  if (!built) return null;
  const { norm, dur } = built;
  const n = norm.length;

  const W = 1000;
  const H = 150;
  const padTop = 16;
  const padBot = 18;
  const usableH = H - padTop - padBot;

  // Downsample to keep the path light (the envelope is already smoothed).
  const M = Math.min(180, n);
  const yAtIdx = (idx: number) => padTop + (1 - (norm[idx] ?? 0)) * usableH;
  let line = "";
  for (let i = 0; i < M; i++) {
    const idx = Math.round((i / (M - 1)) * (n - 1));
    const x = ((i / (M - 1)) * W).toFixed(1);
    line += `${i ? "L" : "M"}${x},${yAtIdx(idx).toFixed(1)}`;
  }
  const area = `${line}L${W},${H - padBot}L0,${H - padBot}Z`;

  // The dip (drift risk) and the peak, read off the same markers as the wave.
  const dip = moments.find((m) => /dip|drift/i.test(m.note));
  const peak = moments.find((m) => m.free) ?? moments.find((m) => /peak|fullest/i.test(m.note));
  const xAtPct = (pct: number) => (pct / 100) * W;
  const yAtPct = (pct: number) => yAtIdx(Math.round((pct / 100) * (n - 1)));

  return (
    <div className={className}>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: 150 }}
          aria-hidden
        >
          <defs>
            <linearGradient id="retention-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.26} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1={0}
              x2={W}
              y1={padTop + g * usableH}
              y2={padTop + g * usableH}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          ))}
          <path d={area} fill="url(#retention-fill)" />
          <path
            d={line}
            fill="none"
            stroke={ACCENT}
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {dip && (
            <>
              <line
                x1={xAtPct(dip.pct)}
                x2={xAtPct(dip.pct)}
                y1={padTop}
                y2={H - padBot}
                stroke="rgba(184,164,255,0.5)"
                strokeWidth={1}
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={xAtPct(dip.pct)} cy={yAtPct(dip.pct)} r={4} fill={DIP} />
            </>
          )}
          {peak && <circle cx={xAtPct(peak.pct)} cy={yAtPct(peak.pct)} r={4} fill={ACCENT} />}
        </svg>

        {/* dip callout — the retention story, positioned over the marker */}
        {dip && (
          <span
            className="absolute -translate-x-1/2 top-0 font-mono text-[10px] whitespace-nowrap"
            style={{
              left: `${Math.min(88, Math.max(12, dip.pct))}%`,
              color: DIP,
            }}
          >
            likely drift · {dip.at}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-white/30 mt-1.5 font-mono">
        <span>0:00</span>
        <span className="text-white/40 normal-case">energy &amp; attention across the track</span>
        <span>{mmss(dur)}</span>
      </div>
    </div>
  );
}
