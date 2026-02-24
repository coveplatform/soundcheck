"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ── Vinyl record config ──────────────────────────────────── */
const RECORDS = [
  {
    id: 0,
    cx: 0.20,
    cy: 0.12,
    size: 38,
    baseTilt: -12,
    bob: 0,
    spinSpeed: 8,
    vinyl: "#1a1a2e",
    label: "#facc15",
    labelStroke: "#92400e",
    labelHighlight: "#fef08a",
  },
  {
    id: 1,
    cx: 0.82,
    cy: 0.10,
    size: 30,
    baseTilt: 15,
    bob: 0.7,
    spinSpeed: 10,
    vinyl: "#1a1a2e",
    label: "#f472b6",
    labelStroke: "#881337",
    labelHighlight: "#fbcfe8",
  },
  {
    id: 2,
    cx: 0.90,
    cy: 0.50,
    size: 34,
    baseTilt: 8,
    bob: 1.4,
    spinSpeed: 7,
    vinyl: "#1a1a2e",
    label: "#60a5fa",
    labelStroke: "#1e3a8a",
    labelHighlight: "#bfdbfe",
  },
  {
    id: 3,
    cx: 0.10,
    cy: 0.84,
    size: 32,
    baseTilt: -10,
    bob: 2.1,
    spinSpeed: 9,
    vinyl: "#1a1a2e",
    label: "#4ade80",
    labelStroke: "#14532d",
    labelHighlight: "#bbf7d0",
  },
  {
    id: 4,
    cx: 0.78,
    cy: 0.92,
    size: 26,
    baseTilt: 14,
    bob: 2.8,
    spinSpeed: 11,
    vinyl: "#1a1a2e",
    label: "#c084fc",
    labelStroke: "#581c87",
    labelHighlight: "#e9d5ff",
  },
];

const NEAR_PX = 160;
const EASE = "cubic-bezier(.34,1.56,.64,1)";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/* ── Vinyl record SVG ─────────────────────────────────────── */
function VinylRecordSvg({
  size,
  eyeX,
  eyeY,
  near,
  spinDeg,
  vinyl,
  label,
  labelStroke,
  labelHighlight,
}: {
  size: number;
  eyeX: number;
  eyeY: number;
  near: boolean;
  spinDeg: number;
  vinyl: string;
  label: string;
  labelStroke: string;
  labelHighlight: string;
}) {
  const r = size; // outer radius
  const cx = r + 4;
  const cy = r + 4;
  const svgSize = (r + 4) * 2;
  const labelR = r * 0.38; // center label radius
  const holeR = r * 0.06; // spindle hole

  // groove rings
  const grooveCount = 5;
  const grooveStart = labelR + (r - labelR) * 0.15;
  const grooveEnd = r * 0.92;
  const grooveStep = (grooveEnd - grooveStart) / grooveCount;

  // eyes on the label
  const eyeR = size * 0.09;
  const pupilR = size * (near ? 0.04 : 0.055);
  const shineR = size * 0.022;
  const eyeGap = labelR * 0.38;
  const eyeCy = cy - labelR * 0.12;
  const maxMove = eyeR * 0.45;

  // mouth
  const mouthCy = cy + labelR * 0.35;

  return (
    <svg
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      width={svgSize}
      height={svgSize}
      className="overflow-visible block"
    >
      {/* drop shadow */}
      <circle cx={cx + 2} cy={cy + 2} r={r} fill="rgba(0,0,0,0.25)" />

      {/* vinyl disc — spins */}
      <g transform={`rotate(${spinDeg}, ${cx}, ${cy})`}>
        {/* outer disc */}
        <circle cx={cx} cy={cy} r={r} fill={vinyl} stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} />

        {/* subtle sheen on vinyl */}
        <circle cx={cx} cy={cy} r={r * 0.95} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={r * 0.08} />

        {/* groove rings */}
        {Array.from({ length: grooveCount }, (_, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={grooveStart + i * grooveStep}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={0.8}
          />
        ))}

        {/* edge highlight — top-left gloss */}
        <path
          d={`M ${cx - r * 0.5} ${cy - r * 0.86} A ${r} ${r} 0 0 1 ${cx + r * 0.86} ${cy - r * 0.5}`}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </g>

      {/* center label — does NOT spin (face stays upright) */}
      {/* label shadow */}
      <circle cx={cx + 1} cy={cy + 1} r={labelR} fill="rgba(0,0,0,0.2)" />
      {/* label fill */}
      <circle cx={cx} cy={cy} r={labelR} fill={label} stroke={labelStroke} strokeWidth={2} />
      {/* label highlight */}
      <ellipse
        cx={cx - labelR * 0.18}
        cy={cy - labelR * 0.22}
        rx={labelR * 0.35}
        ry={labelR * 0.20}
        fill={labelHighlight}
        opacity={0.5}
      />

      {/* spindle hole */}
      <circle cx={cx} cy={cy - labelR * 0.48} r={holeR} fill={vinyl} stroke={labelStroke} strokeWidth={0.8} />

      {/* left eye */}
      <circle cx={cx - eyeGap} cy={eyeCy} r={eyeR} fill="white" stroke={labelStroke} strokeWidth={1.2} />
      <circle
        cx={cx - eyeGap + eyeX * maxMove}
        cy={eyeCy + eyeY * maxMove}
        r={pupilR}
        fill="#0f0a1a"
      />
      <circle
        cx={cx - eyeGap + eyeX * maxMove * 0.1 + shineR * 0.5}
        cy={eyeCy + eyeY * maxMove * 0.1 - shineR}
        r={shineR}
        fill="white"
      />

      {/* right eye */}
      <circle cx={cx + eyeGap} cy={eyeCy} r={eyeR} fill="white" stroke={labelStroke} strokeWidth={1.2} />
      <circle
        cx={cx + eyeGap + eyeX * maxMove}
        cy={eyeCy + eyeY * maxMove}
        r={pupilR}
        fill="#0f0a1a"
      />
      <circle
        cx={cx + eyeGap + eyeX * maxMove * 0.1 + shineR * 0.5}
        cy={eyeCy + eyeY * maxMove * 0.1 - shineR}
        r={shineR}
        fill="white"
      />

      {/* blush */}
      {near && (
        <>
          <ellipse
            cx={cx - eyeGap - eyeR * 0.6}
            cy={eyeCy + eyeR * 1.4}
            rx={size * 0.035}
            ry={size * 0.022}
            fill="rgba(255,100,150,0.45)"
          />
          <ellipse
            cx={cx + eyeGap + eyeR * 0.6}
            cy={eyeCy + eyeR * 1.4}
            rx={size * 0.035}
            ry={size * 0.022}
            fill="rgba(255,100,150,0.45)"
          />
        </>
      )}

      {/* mouth — smile normally, surprised "o" when near */}
      {near ? (
        <ellipse
          cx={cx}
          cy={mouthCy}
          rx={size * 0.035}
          ry={size * 0.03}
          fill={labelStroke}
          opacity={0.7}
        />
      ) : (
        <path
          d={`M ${cx - labelR * 0.18} ${mouthCy} Q ${cx} ${mouthCy + labelR * 0.15} ${cx + labelR * 0.18} ${mouthCy}`}
          fill="none"
          stroke={labelStroke}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/* ── main export ───────────────────────────────────────────── */
export function SpeakerBuddies() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: -9999, y: -9999 });
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tick, setTick] = useState(0);
  const rafId = useRef<number | null>(null);
  const latest = useRef({ x: -9999, y: -9999 });
  const animRef = useRef<number>(0);

  const updateRect = useCallback(() => {
    if (containerRef.current) {
      setRect(containerRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    updateRect();
    const ro = new ResizeObserver(updateRect);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("scroll", updateRect, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", updateRect);
    };
  }, [updateRect]);

  // mouse tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      latest.current = { x: e.clientX, y: e.clientY };
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(() => {
          setMouse({ ...latest.current });
          rafId.current = null;
        });
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // spin animation — tick updates every ~50ms for smooth rotation
  useEffect(() => {
    let running = true;
    const step = () => {
      if (!running) return;
      setTick((t) => t + 1);
      animRef.current = requestAnimationFrame(step);
    };
    const id = setInterval(() => {
      // throttle to ~20fps for spin (plenty smooth for rotation)
    }, 50);
    animRef.current = requestAnimationFrame(step);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      clearInterval(id);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {RECORDS.map((rec) => {
        let eyeX = 0;
        let eyeY = 0;
        let tiltX = 0; // lean toward form
        let near = false;

        if (rect) {
          const sx = rect.left + rec.cx * rect.width;
          const sy = rect.top + rec.cy * rect.height;
          const dx = mouse.x - sx;
          const dy = mouse.y - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 1) {
            eyeX = dx / dist;
            eyeY = dy / dist;
          }

          // tilt toward form when cursor is over it
          const relX = (mouse.x - rect.left) / rect.width;
          if (relX < 0) {
            const raw = clamp(Math.abs(relX), 0, 1.2);
            const factor = Math.pow(raw / 1.2, 1.8);
            tiltX = factor * -18; // lean left toward form
          }

          near = dist < NEAR_PX;
        }

        // continuous spin
        const spinDeg = (tick * (360 / (rec.spinSpeed * 60))) % 360;

        return (
          <div
            key={rec.id}
            className="absolute"
            style={{
              left: `${rec.cx * 100}%`,
              top: `${rec.cy * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* idle bob */}
            <div
              style={{
                animationName: "speaker-idle",
                animationDuration: "3.2s",
                animationTimingFunction: "ease-in-out",
                animationDelay: `${rec.bob}s`,
                animationIterationCount: "infinite",
              }}
            >
              {/* base tilt + lean toward form */}
              <div
                style={{
                  transform: `rotate(${rec.baseTilt + tiltX}deg) ${near ? "scale(1.12)" : "scale(1)"}`,
                  transition: `transform 0.5s ${EASE}`,
                  willChange: "transform",
                }}
              >
                <VinylRecordSvg
                  size={rec.size}
                  eyeX={eyeX}
                  eyeY={eyeY}
                  near={near}
                  spinDeg={spinDeg}
                  vinyl={rec.vinyl}
                  label={rec.label}
                  labelStroke={rec.labelStroke}
                  labelHighlight={rec.labelHighlight}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
