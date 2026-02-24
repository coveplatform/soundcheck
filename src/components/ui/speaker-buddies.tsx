"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ── Beamed quaver pair config (♫) ────────────────────────── */
// Each entry is a PAIR of notes joined by a beam.
// Positions: avoid the text content zone (roughly y 20%-80%).
// The cy is where the NOTE HEADS sit; stems + beam grow upward from there.
const PAIRS = [
  {
    id: 0,
    cx: 0.22,
    cy: 0.15,
    size: 22,
    tilt: -8,
    bob: 0,
    fill: "#facc15",
    stroke: "#92400e",
    highlight: "#fef08a",
  },
  {
    id: 1,
    cx: 0.78,
    cy: 0.14,
    size: 18,
    tilt: 10,
    bob: 0.8,
    fill: "#f472b6",
    stroke: "#881337",
    highlight: "#fbcfe8",
  },
  {
    id: 2,
    cx: 0.88,
    cy: 0.48,
    size: 20,
    tilt: 6,
    bob: 1.5,
    fill: "#60a5fa",
    stroke: "#1e3a8a",
    highlight: "#bfdbfe",
  },
  {
    id: 3,
    cx: 0.12,
    cy: 0.82,
    size: 20,
    tilt: -7,
    bob: 2.2,
    fill: "#4ade80",
    stroke: "#14532d",
    highlight: "#bbf7d0",
  },
  {
    id: 4,
    cx: 0.75,
    cy: 0.90,
    size: 16,
    tilt: 12,
    bob: 2.9,
    fill: "#c084fc",
    stroke: "#581c87",
    highlight: "#e9d5ff",
  },
];

const MAX_STEM_EXTRA = 60;
const BASE_STEM = 50;
const NEAR_PX = 150;
const EASE = "cubic-bezier(.34,1.56,.64,1)";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/* ── Beamed quaver pair: all-in-one SVG ♫ ─────────────────── */
// Two note heads at the bottom, two stems going up, one thick beam across the top.
// The whole thing is rendered as a single SVG so alignment is pixel-perfect.
function BeamedQuaverSvg({
  size,
  stemH,
  bend,
  eyeX,
  eyeY,
  stretch,
  near,
  fill,
  stroke,
  highlight,
}: {
  size: number;
  stemH: number;
  bend: number; // 0-1, how much the stems curve toward the form
  eyeX: number;
  eyeY: number;
  stretch: number;
  near: boolean;
  fill: string;
  stroke: string;
  highlight: string;
}) {
  // note head dimensions
  const headRx = size * 0.52;
  const headRy = size * 0.38;
  const headW = headRx * 2 + 4;
  const gap = size * 1.5;
  const headsW = headW + gap + 12;
  // extra space on left for bent stems, and extra vertical for beam rotation
  const stemGapX = gap + headRx; // horizontal distance between stem bases
  const bendRoom = stemH * bend * 1.1;
  const maxVGap = stemGapX * 0.25; // tight cap so beam stays compact
  const vertExtra = maxVGap * bend * 0.4;
  const totalW = headsW + bendRoom;
  const headAreaH = headRy * 2 + 6;
  const stemW = Math.max(2.5, size * 0.13);
  const beamH = Math.max(4, size * 0.18);
  const totalH = headAreaH + stemH + beamH + vertExtra;

  // heads are on the RIGHT side of the SVG (fixed, upright)
  const headOffset = bendRoom;
  const head1Cx = headOffset + headsW * 0.25;
  const head2Cx = headOffset + headsW * 0.75;
  const headCy = totalH - headAreaH / 2;
  const stemBot1 = headCy - headRy * 0.3;
  const stemBot2 = headCy - headRy * 0.3;
  const stem1BotX = head1Cx + headRx * 0.55;
  const stem2BotX = head2Cx + headRx * 0.55;

  // At rest: stem tops side by side horizontally, beam is horizontal
  // At full bend: stem tops stacked vertically on the left, beam is ~vertical
  // Each stem displaces from its OWN bottom to avoid crossing
  const topDisplace = stemH * bend * 1.05;
  const vGap = maxVGap * bend; // vertical separation grows but capped

  // Left head → lower beam point, Right head → upper beam point
  // This "fan" pattern keeps stems in their own lanes
  const stem1TopX = stem1BotX - topDisplace;
  const stem2TopX = stem2BotX - topDisplace;
  const baseStemTopY = beamH + vertExtra / 2;
  const stem1TopY = baseStemTopY + vGap / 2; // lower (left head fans down-left)
  const stem2TopY = baseStemTopY - vGap / 2; // upper (right head fans up-left)

  // L-bend bezier: stem goes straight UP then curves to its target
  function stemPath(botX: number, botY: number, topX: number, topY: number) {
    const cp1x = botX;
    const cp1y = topY; // directly above bottom = vertical lower portion
    const cp2x = botX;
    const cp2y = topY; // creates sharp L-corner
    return `M ${botX} ${botY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${topX} ${topY}`;
  }

  // eye params
  const eyeR = size * (0.16 + stretch * 0.02);
  const pupilR = size * (near ? 0.07 : 0.09);
  const shineR = size * 0.035;
  const eyeGap = size * 0.17;
  const maxMove = eyeR * 0.40;

  function renderHead(hcx: number) {
    const hcy = headCy;
    return (
      <>
        {/* shadow */}
        <ellipse
          cx={hcx + 1.5}
          cy={hcy + 1.5}
          rx={headRx}
          ry={headRy}
          transform={`rotate(-18, ${hcx + 1.5}, ${hcy + 1.5})`}
          fill="rgba(0,0,0,0.20)"
        />
        {/* head fill */}
        <ellipse
          cx={hcx}
          cy={hcy}
          rx={headRx}
          ry={headRy}
          transform={`rotate(-18, ${hcx}, ${hcy})`}
          fill={fill}
          stroke={stroke}
          strokeWidth={2.2}
        />
        {/* highlight */}
        <ellipse
          cx={hcx - headRx * 0.20}
          cy={hcy - headRy * 0.28}
          rx={headRx * 0.30}
          ry={headRy * 0.22}
          transform={`rotate(-18, ${hcx - headRx * 0.20}, ${hcy - headRy * 0.28})`}
          fill={highlight}
          opacity={0.50}
        />
        {/* left eye */}
        <circle cx={hcx - eyeGap} cy={hcy} r={eyeR} fill="white" stroke={stroke} strokeWidth={1.1} />
        <circle
          cx={hcx - eyeGap + eyeX * maxMove}
          cy={hcy + eyeY * maxMove}
          r={pupilR}
          fill="#0f0a1a"
        />
        <circle
          cx={hcx - eyeGap + eyeX * maxMove * 0.1 + shineR * 0.5}
          cy={hcy + eyeY * maxMove * 0.1 - shineR}
          r={shineR}
          fill="white"
        />
        {/* right eye */}
        <circle cx={hcx + eyeGap} cy={hcy} r={eyeR} fill="white" stroke={stroke} strokeWidth={1.1} />
        <circle
          cx={hcx + eyeGap + eyeX * maxMove}
          cy={hcy + eyeY * maxMove}
          r={pupilR}
          fill="#0f0a1a"
        />
        <circle
          cx={hcx + eyeGap + eyeX * maxMove * 0.1 + shineR * 0.5}
          cy={hcy + eyeY * maxMove * 0.1 - shineR}
          r={shineR}
          fill="white"
        />
        {/* blush */}
        {near && (
          <>
            <ellipse
              cx={hcx - eyeGap - eyeR * 0.4}
              cy={hcy + eyeR * 1.05}
              rx={size * 0.05}
              ry={size * 0.03}
              fill="rgba(255,100,150,0.40)"
            />
            <ellipse
              cx={hcx + eyeGap + eyeR * 0.4}
              cy={hcy + eyeR * 1.05}
              rx={size * 0.05}
              ry={size * 0.03}
              fill="rgba(255,100,150,0.40)"
            />
          </>
        )}
        {/* mouth */}
        {stretch > 0.2 ? (
          <ellipse
            cx={hcx}
            cy={hcy + size * 0.22}
            rx={size * 0.05 + stretch * size * 0.025}
            ry={size * 0.04 + stretch * size * 0.02}
            fill={stroke}
            opacity={0.6}
          />
        ) : (
          <path
            d={`M ${hcx - size * 0.05} ${hcy + size * 0.20} Q ${hcx} ${hcy + size * 0.26} ${hcx + size * 0.05} ${hcy + size * 0.20}`}
            fill="none"
            stroke={stroke}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        )}
      </>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      width={totalW}
      height={totalH}
      className="overflow-visible block"
    >
      {/* stem shadows */}
      <path d={stemPath(stem1BotX + 1, stemBot1 + 1, stem1TopX + 1, stem1TopY + 1)} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={stemW + 1} strokeLinecap="round" />
      <path d={stemPath(stem2BotX + 1, stemBot2 + 1, stem2TopX + 1, stem2TopY + 1)} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={stemW + 1} strokeLinecap="round" />

      {/* stems — L-bend curves that bow left */}
      <path d={stemPath(stem1BotX, stemBot1, stem1TopX, stem1TopY)} fill="none" stroke={stroke} strokeWidth={stemW} strokeLinecap="round" />
      <path d={stemPath(stem2BotX, stemBot2, stem2TopX, stem2TopY)} fill="none" stroke={stroke} strokeWidth={stemW} strokeLinecap="round" />

      {/* beam — connects two stem tops, rotates from horizontal to vertical */}
      <line x1={stem1TopX + 1} y1={stem1TopY + 1} x2={stem2TopX + 1} y2={stem2TopY + 1} stroke="rgba(0,0,0,0.15)" strokeWidth={beamH + 1} strokeLinecap="round" />
      <line x1={stem1TopX} y1={stem1TopY} x2={stem2TopX} y2={stem2TopY} stroke={fill} strokeWidth={beamH} strokeLinecap="round" />
      <line x1={stem1TopX} y1={stem1TopY} x2={stem2TopX} y2={stem2TopY} stroke={stroke} strokeWidth={beamH} strokeLinecap="round" opacity={0.3} />

      {/* note heads */}
      {renderHead(head1Cx)}
      {renderHead(head2Cx)}
    </svg>
  );
}

/* ── Full beamed quaver character ─────────────────────────── */
function BeamedQuaver({
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
  const stretch = stemExtra / MAX_STEM_EXTRA;
  const totalStem = BASE_STEM + stemExtra;

  return (
    <div
      style={{
        animationName: "speaker-idle",
        animationDuration: "3.2s",
        animationTimingFunction: "ease-in-out",
        animationDelay: `${bobDelay}s`,
        animationIterationCount: "infinite",
      }}
    >
      <div style={{ transform: `rotate(${tilt}deg)` }}>
        <div
          style={{
            transform: near ? "scale(1.15)" : "scale(1)",
            transition: `transform 0.4s ${EASE}`,
            willChange: "transform",
          }}
        >
          <BeamedQuaverSvg
            size={size}
            stemH={totalStem}
            bend={stretch}
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
      {PAIRS.map((p) => {
        let eyeX = 0;
        let eyeY = 0;
        let stemExtra = 0;
        let headX = 0;
        let near = false;

        if (rect) {
          const sx = rect.left + p.cx * rect.width;
          const sy = rect.top + p.cy * rect.height;
          const dx = mouse.x - sx;
          const dy = mouse.y - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 1) {
            eyeX = dx / dist;
            eyeY = dy / dist;
          }

          const relX = (mouse.x - rect.left) / rect.width;
          if (relX < 0) {
            // wider range (1.2) so full extend needs cursor far into the form
            // easeIn power curve so it starts slow and accelerates
            const raw = clamp(Math.abs(relX), 0, 1.2);
            const factor = Math.pow(raw / 1.2, 1.8); // 0-1 with easeIn
            stemExtra = factor * MAX_STEM_EXTRA;
            headX = clamp(-factor * 28, -28, 0);
          }

          near = dist < NEAR_PX;
        }

        return (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.cx * 100}%`,
              top: `${p.cy * 100}%`,
              transform: "translate(-50%, -100%)",
              transformOrigin: "right bottom",
            }}
          >
            <BeamedQuaver
              size={p.size}
              tilt={p.tilt}
              eyeX={eyeX}
              eyeY={eyeY}
              stemExtra={stemExtra}
              headX={headX}
              near={near}
              bobDelay={p.bob}
              fill={p.fill}
              stroke={p.stroke}
              highlight={p.highlight}
            />
          </div>
        );
      })}
    </div>
  );
}
