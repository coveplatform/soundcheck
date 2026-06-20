/**
 * Pentagon radar of the five score dimensions — the at-a-glance "shape" of a
 * track (spiky vs balanced) that sits alongside the per-dimension bars. The
 * bars carry the numbers and the notes; this carries the silhouette.
 *
 * Pure, server-renderable SVG in the icy report palette — no chart lib, no
 * hydration wait, consistent with ScoreRing and ReportWaveform.
 */

const ACCENT = "#6ee7ff";

// Short axis labels — the full dimension names are too long to ring the chart.
const SHORT: Record<string, string> = {
  "Hook Strength": "Hook",
  "Production Quality": "Production",
  "Listener Retention": "Retention",
  "Emotional Impact": "Emotion",
  "Commercial Potential": "Commercial",
};

export function ScoreRadar({
  categories,
  max = 5,
  className = "",
}: {
  categories: { label: string; score: number }[];
  max?: number;
  className?: string;
}) {
  const n = categories.length;
  if (n < 3) return null;

  const W = 320;
  const H = 250;
  const cx = 160;
  const cy = 132;
  const R = 84;

  // Axis i starts at the top (−90°) and steps clockwise.
  const angle = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const pt = (v: number, i: number) => {
    const a = angle(i);
    return [cx + R * v * Math.cos(a), cy + R * v * Math.sin(a)] as const;
  };
  const ringPath = (level: number) =>
    categories
      .map((_, i) => {
        const [x, y] = pt(level, i);
        return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join("") + "Z";

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const dataPath =
    categories
      .map((c, i) => {
        const [x, y] = pt(clamp01((c.score ?? 0) / max), i);
        return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join("") + "Z";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full h-auto ${className}`}
      role="img"
      aria-label="score shape across the five dimensions"
    >
      {/* grid rings */}
      {[0.25, 0.5, 0.75, 1].map((level) => (
        <path
          key={level}
          d={ringPath(level)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}
      {/* spokes */}
      {categories.map((_, i) => {
        const [x, y] = pt(1, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x.toFixed(1)}
            y2={y.toFixed(1)}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}
      {/* the track's shape */}
      <path
        d={dataPath}
        fill={ACCENT}
        fillOpacity={0.16}
        stroke={ACCENT}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {categories.map((c, i) => {
        const [x, y] = pt(clamp01((c.score ?? 0) / max), i);
        return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={3} fill={ACCENT} />;
      })}
      {/* axis labels */}
      {categories.map((c, i) => {
        const [x, y] = pt(1.1, i);
        const a = angle(i);
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const anchor = cos > 0.25 ? "start" : cos < -0.25 ? "end" : "middle";
        const dy = sin < -0.3 ? -2 : sin > 0.3 ? 11 : 4;
        const short = SHORT[c.label] ?? c.label.split(" ")[0] ?? c.label;
        return (
          <text
            key={i}
            x={x.toFixed(1)}
            y={(y + dy).toFixed(1)}
            textAnchor={anchor}
            className="font-mono"
            fontSize={11}
            fill="rgba(255,255,255,0.55)"
          >
            {short}
          </text>
        );
      })}
    </svg>
  );
}
