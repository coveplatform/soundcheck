"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ── Banjo-Kazooie quaver config ──────────────────────────── */
// Positions chosen to sit in gaps around the text content:
//   Content occupies roughly y 15%-85% of the panel, with p-10/p-14 padding.
//   Notes go in: top corners, side edges in padding zone, bottom edge.
const NOTES = [
  {
    id: 0,
    cx: 0.14,
    cy: 0.04,
    size: 30,
    tilt: -15,
    bob: 0,
    fill: "#facc15",
    stroke: "#92400e",
    highlight: "#fef08a",
  },
  {
    id: 1,
    cx: 0.88,
    cy: 0.06,
    size: 26,
    tilt: 12,
    bob: 0.7,
    fill: "#f472b6",
    stroke: "#881337",
    highlight: "#fbcfe8",
  },
  {
    id: 2,
    cx: 0.92,
    cy: 0.44,
    size: 32,
    tilt: 8,
    bob: 1.4,
    fill: "#60a5fa",
    stroke: "#1e3a8a",
    highlight: "#bfdbfe",
  },
  {
    id: 3,
    cx: 0.06,
    cy: 0.76,
    size: 28,
    tilt: -10,
    bob: 2.1,
    fill: "#4ade80",
    stroke: "#14532d",
    highlight: "#bbf7d0",
  },
  {
    id: 4,
    cx: 0.82,
    cy: 0.95,
    size: 24,
    tilt: 14,
    bob: 2.8,
    fill: "#c084fc",
    stroke: "#581c87",
    highlight: "#e9d5ff",
  },
];

const MAX_STEM = 36;
const BASE_STEM = 22;
const NEAR_PX = 150;
const EASE = "cubic-bezier(.34,1.56,.64,1)";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/* ── Quaver Head (the face — sits at BOTTOM) ──────────────── */
function QuaverHead({
  size,
  eyeX,
  eyeY,
  stretch,
  near,
  fill,
  stroke,
  highlight,
}: {
  size: number;
  eyeX: number;
  eyeY: number;
  stretch: number;
  near: boolean;
  fill: string;
  stroke: string;
  highlight: string;
}) {
  const w = size * 1.15;
  const h = size * 0.95;
  const cx = w * 0.50;
  const cy = h * 0.50;
  const rx = size * 0.52;
  const ry = size * 0.38;

  // big cartoon eyes
  const eyeR = size * (0.15 + stretch * 0.02);
  const pupilR = size * (near ? 0.065 : 0.085);
  const shineR = size * 0.035;
  const eyeGap = size * 0.19;
  const eyeCY = cy - size * 0.02;
  const maxMove = eyeR * 0.42;

  // mouth
  const mouthCY = cy + size * 0.22;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="overflow-visible block">
      {/* drop shadow */}
      <ellipse
        cx={cx + 1.5}
        cy={cy + 2}
        rx={rx}
        ry={ry}
        transform={`rotate(-20, ${cx + 1.5}, ${cy + 2})`}
        fill="rgba(0,0,0,0.22)"
      />

      {/* note head — solid, chunky, tilted oval */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        transform={`rotate(-20, ${cx}, ${cy})`}
        fill={fill}
        stroke={stroke}
        strokeWidth={2.5}
      />

      {/* glossy highlight */}
      <ellipse
        cx={cx - rx * 0.22}
        cy={cy - ry * 0.30}
        rx={rx * 0.32}
        ry={ry * 0.25}
        transform={`rotate(-20, ${cx - rx * 0.22}, ${cy - ry * 0.30})`}
        fill={highlight}
        opacity={0.55}
      />

      {/* left eye */}
      <circle cx={cx - eyeGap} cy={eyeCY} r={eyeR} fill="white" stroke={stroke} strokeWidth={1.3} />
      <circle
        cx={cx - eyeGap + eyeX * maxMove}
        cy={eyeCY + eyeY * maxMove}
        r={pupilR}
        fill="#0f0a1a"
      />
      <circle
        cx={cx - eyeGap + eyeX * maxMove * 0.1 + shineR * 0.5}
        cy={eyeCY + eyeY * maxMove * 0.1 - shineR}
        r={shineR}
        fill="white"
      />

      {/* right eye */}
      <circle cx={cx + eyeGap} cy={eyeCY} r={eyeR} fill="white" stroke={stroke} strokeWidth={1.3} />
      <circle
        cx={cx + eyeGap + eyeX * maxMove}
        cy={eyeCY + eyeY * maxMove}
        r={pupilR}
        fill="#0f0a1a"
      />
      <circle
        cx={cx + eyeGap + eyeX * maxMove * 0.1 + shineR * 0.5}
        cy={eyeCY + eyeY * maxMove * 0.1 - shineR}
        r={shineR}
        fill="white"
      />

      {/* blush */}
      {near && (
        <>
          <ellipse
            cx={cx - eyeGap - eyeR * 0.5}
            cy={eyeCY + eyeR * 1.1}
            rx={size * 0.055}
            ry={size * 0.035}
            fill="rgba(255,100,150,0.40)"
          />
          <ellipse
            cx={cx + eyeGap + eyeR * 0.5}
            cy={eyeCY + eyeR * 1.1}
            rx={size * 0.055}
            ry={size * 0.035}
            fill="rgba(255,100,150,0.40)"
          />
        </>
      )}

      {/* mouth */}
      {stretch > 0.2 ? (
        <ellipse
          cx={cx}
          cy={mouthCY}
          rx={size * 0.055 + stretch * size * 0.03}
          ry={size * 0.045 + stretch * size * 0.025}
          fill={stroke}
          opacity={0.65}
        />
      ) : (
        <path
          d={`M ${cx - size * 0.06} ${mouthCY} Q ${cx} ${mouthCY + size * 0.06} ${cx + size * 0.06} ${mouthCY}`}
          fill="none"
          stroke={stroke}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/* ── Stem going UP + curly flag at top (proper ♪ quaver) ──── */
function QuaverStem({
  size,
  stemH,
  headX,
  fill,
  stroke,
}: {
  size: number;
  stemH: number;
  headX: number;
  fill: string;
  stroke: string;
}) {
  const stemW = 3;
  const w = size * 1.6;
  const h = stemH + 4;
  // stem attaches to right side of note head
  const stemX = w * 0.55;

  // stem bows when head shifts
  const bowX = headX * 0.3;
  const midY = h * 0.5;

  // flag starts at TOP of stem (y=0) and curls to the right
  const flagStartX = stemX + headX * 0.6;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className="overflow-visible block"
      style={{ marginBottom: -4 }}
    >
      {/* stem shadow */}
      <path
        d={`M ${stemX + 1.5} ${h} Q ${stemX + bowX + 1.5} ${midY} ${flagStartX + 1.5} 1.5`}
        fill="none"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth={stemW + 1}
        strokeLinecap="round"
      />
      {/* stem */}
      <path
        d={`M ${stemX} ${h} Q ${stemX + bowX} ${midY} ${flagStartX} 0`}
        fill="none"
        stroke={stroke}
        strokeWidth={stemW}
        strokeLinecap="round"
      />

      {/* curly flag at TOP — curves right then down */}
      {/* flag shadow */}
      <path
        d={`M ${flagStartX + 1} 1 C ${flagStartX + size * 0.6} ${size * 0.05}, ${flagStartX + size * 0.55} ${size * 0.4}, ${flagStartX + size * 0.15} ${size * 0.6}`}
        fill="none"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      {/* flag colored */}
      <path
        d={`M ${flagStartX} 0 C ${flagStartX + size * 0.6} ${size * 0.05}, ${flagStartX + size * 0.55} ${size * 0.4}, ${flagStartX + size * 0.15} ${size * 0.6}`}
        fill="none"
        stroke={fill}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Full quaver character ────────────────────────────────── */
function QuaverCharacter({
  size,
  tilt,
  eyeX,
  eyeY,
  stemExtra,
  headX,
  near,
  bobDelay,
  fill,
  stroke,
  highlight,
}: {
  size: number;
  tilt: number;
  eyeX: number;
  eyeY: number;
  stemExtra: number;
  headX: number;
  near: boolean;
  bobDelay: number;
  fill: string;
  stroke: string;
  highlight: string;
}) {
  const stretch = stemExtra / MAX_STEM;
  const totalStem = BASE_STEM + stemExtra;

  return (
    /* idle bob */
    <div
      style={{
        animationName: "speaker-idle",
        animationDuration: "3.2s",
        animationTimingFunction: "ease-in-out",
        animationDelay: `${bobDelay}s`,
        animationIterationCount: "infinite",
      }}
    >
      {/* tilt */}
      <div style={{ transform: `rotate(${tilt}deg)` }}>
        {/* proximity scale */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: near ? "scale(1.15)" : "scale(1)",
            transition: `transform 0.4s ${EASE}`,
            willChange: "transform",
          }}
        >
          {/* stem + flag on TOP (grows upward) */}
          <div
            style={{
              height: totalStem,
              transition: `height 0.5s ${EASE}`,
              willChange: "height",
              overflow: "visible",
            }}
          >
            <QuaverStem
              size={size}
              stemH={totalStem}
              headX={headX}
              fill={fill}
              stroke={stroke}
            />
          </div>

          {/* note head (face) at BOTTOM — shifts + tilts */}
          <div
            style={{
              transform: `translateX(${headX}px) rotate(${headX * 0.4}deg)`,
              transition: `transform 0.5s ${EASE}`,
              willChange: "transform",
            }}
          >
            <QuaverHead
              size={size}
              eyeX={eyeX}
              eyeY={eyeY}
              stretch={stretch}
              near={near}
              fill={fill}
              stroke={stroke}
              highlight={highlight}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── main export ───────────────────────────────────────────── */
export function SpeakerBuddies() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: -9999, y: -9999 });
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafId = useRef<number | null>(null);
  const latest = useRef({ x: -9999, y: -9999 });

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

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {NOTES.map((note) => {
        let eyeX = 0;
        let eyeY = 0;
        let stemExtra = 0;
        let headX = 0;
        let near = false;

        if (rect) {
          const sx = rect.left + note.cx * rect.width;
          const sy = rect.top + note.cy * rect.height;
          const dx = mouse.x - sx;
          const dy = mouse.y - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 1) {
            eyeX = dx / dist;
            eyeY = dy / dist;
          }

          const relX = (mouse.x - rect.left) / rect.width;
          if (relX < 0) {
            const factor = clamp(Math.abs(relX), 0, 0.55);
            stemExtra = factor * (MAX_STEM / 0.55);
            headX = clamp(-factor * 25, -18, 0);
          }

          near = dist < NEAR_PX;
        }

        return (
          <div
            key={note.id}
            className="absolute"
            style={{
              left: `${note.cx * 100}%`,
              top: `${note.cy * 100}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <QuaverCharacter
              size={note.size}
              tilt={note.tilt}
              eyeX={eyeX}
              eyeY={eyeY}
              stemExtra={stemExtra}
              headX={headX}
              near={near}
              bobDelay={note.bob}
              fill={note.fill}
              stroke={note.stroke}
              highlight={note.highlight}
            />
          </div>
        );
      })}
    </div>
  );
}
