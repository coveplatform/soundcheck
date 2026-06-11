"use client";

import { useEffect, useState } from "react";

// Shared bits for the "analyzing your track" waits — the homepage assignment
// modal and the report page's pending state. The DSP listen is genuinely slow
// (1–2 min), and a static step list reads as a hang, so every element here
// exists to keep something visibly moving the whole time.

const ACCENT = "#6ee7ff";

// Flavor lines that rotate under the active step while the ticker is parked.
// Listen phase = the long DSP stretch; write phase = the read being drafted.
export const LISTEN_FLAVOR = [
  "listening through the intro…",
  "tracking the energy into the first chorus…",
  "checking how fast the hook lands…",
  "following the arrangement build…",
  "reading the dynamics through the mid-section…",
  "watching for where attention drifts…",
  "checking how the ending resolves…",
];

export const WRITE_FLAVOR = [
  "scoring each dimension…",
  "drafting the verdict…",
  "picking the fixes that move the score most…",
  "tightening the read…",
];

// Progress bar that never stops: eases asymptotically toward `target`, so
// there's always sub-percent motion even when the pipeline is mid-phase, and
// it visibly jumps when `target` moves (a real phase boundary). Keep targets
// shy of 100 — a finished bar promises a finished page.
export function CreepingBar({
  target,
  monoClass = "",
}: {
  target: number;
  monoClass?: string;
}) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setP((prev) => {
        if (prev >= target) return prev;
        return Math.min(prev + Math.max((target - prev) * 0.016, 0.02), target);
      });
    }, 120);
    return () => clearInterval(t);
  }, [target]);
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 bg-white/10 overflow-hidden">
        <div
          className="relative h-full overflow-hidden"
          style={{ width: `${p}%`, background: ACCENT, transition: "width 140ms linear" }}
        >
          <div className="analyzing-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
      </div>
      <span className={`${monoClass} text-[11px] text-white/45 tabular-nums w-9 text-right`}>
        {Math.floor(p)}%
      </span>
    </div>
  );
}

// Little dancing equalizer — the "it's actually playing your song" signal.
// Parent sets the height (e.g. h-4); bars fill it and scaleY-bounce.
export function EqBars({ className = "" }: { className?: string }) {
  const durations = [0.9, 1.15, 0.7, 1.3, 1.0];
  return (
    <div className={`flex items-end gap-[3px] ${className}`} aria-hidden>
      {durations.map((d, i) => (
        <span
          key={i}
          className="eq-bar w-[3px] h-full"
          style={{
            background: ACCENT,
            animationDuration: `${d}s`,
            animationDelay: `${i * 0.13}s`,
          }}
        />
      ))}
    </div>
  );
}

// Cycles through flavor lines with a fade, so the text keeps changing even
// while the step list holds still.
export function RotatingLine({
  lines,
  className = "",
  intervalMs = 3600,
}: {
  lines: string[];
  className?: string;
  intervalMs?: number;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % lines.length), intervalMs);
    return () => clearInterval(t);
  }, [lines.length, intervalMs]);
  return (
    <span key={i} className={`inline-block animate-[fade-in_400ms_ease-out] ${className}`}>
      {lines[i]}
    </span>
  );
}

// m:ss since mount — honest proof that time is passing because of work,
// not because the page died.
export function Elapsed({ className = "" }: { className?: string }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setS((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className={`tabular-nums ${className}`}>
      {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
    </span>
  );
}
