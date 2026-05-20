"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { dim: number; stroke: number }> = {
  sm:  { dim: 80,  stroke: 6 },
  md:  { dim: 120, stroke: 8 },
  lg:  { dim: 176, stroke: 10 },
  xl:  { dim: 240, stroke: 13 },
};

function scoreColor(score: number | null): string {
  if (score === null) return "#9333ea";
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#9333ea";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

interface ScoreRingProps {
  score: number | null;
  size?: Size;
  dark?: boolean;
  animate?: boolean;
  className?: string;
}

export function ScoreRing({
  score,
  size = "lg",
  dark = false,
  animate = true,
  className,
}: ScoreRingProps) {
  const { dim, stroke } = SIZES[size];
  const r = (dim - stroke * 2) / 2;
  const cx = dim / 2;
  const cy = dim / 2;
  const circumference = 2 * Math.PI * r;
  const pct = score != null ? Math.max(0, Math.min(100, score)) / 100 : 0;
  const offset = circumference * (1 - pct);
  const col = scoreColor(score);
  const trackCol = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const numSize = Math.round(dim * 0.27);
  const subSize = Math.round(dim * 0.075);
  const gradId = `sr-${size}-${score ?? "x"}`;

  const ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !animate) return;
    el.style.strokeDashoffset = String(circumference);
    const frame = requestAnimationFrame(() => {
      const t = setTimeout(() => {
        if (ref.current) {
          ref.current.style.transition =
            "stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)";
          ref.current.style.strokeDashoffset = String(offset);
        }
      }, 200);
      return () => clearTimeout(t);
    });
    return () => cancelAnimationFrame(frame);
  }, [score, animate, circumference, offset]);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={col} stopOpacity="0.55" />
            <stop offset="100%" stopColor={col} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Track ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={trackCol}
          strokeWidth={stroke}
        />
        {/* Progress ring */}
        <circle
          ref={ref}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={String(circumference)}
          strokeDashoffset={animate ? String(circumference) : String(offset)}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <span
          className="font-black tabular-nums leading-none"
          style={{ fontSize: numSize, color: col }}
        >
          {score != null ? score : "—"}
        </span>
        <span
          className="font-medium leading-none mt-1"
          style={{
            fontSize: subSize,
            color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.28)",
          }}
        >
          out of 100
        </span>
      </div>
    </div>
  );
}
