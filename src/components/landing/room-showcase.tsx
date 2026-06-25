"use client";

import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ScoreRing } from "@/components/score/score-ring";
import { ArrowRight } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

const SCORE = 82;
const BARS = [
  { label: "hook strength", v: 4.2 },
  { label: "production", v: 3.8 },
  { label: "retention", v: 3.4 },
  { label: "emotional impact", v: 4.0 },
  { label: "commercial pull", v: 3.6 },
];
const FIXES = [
  "get to the hook 8–12 seconds sooner",
  "add a small change in the mid-section",
  "give the outro a softer landing",
];

// The room — 5 real, named listeners, each at a different stage so it reads live.
type Listener =
  | { name: string; initial: string; tone: string; status: "done"; rating: number; quote: string }
  | { name: string; initial: string; tone: string; status: "listening"; progress: number }
  | { name: string; initial: string; tone: string; status: "queued" };

const ROOM: Listener[] = [
  { name: "nova reyes", initial: "N", tone: "#6ee7ff", status: "done", rating: 5, quote: "felt release-ready to me — that hook is sticky" },
  { name: "jules okafor", initial: "J", tone: "#a78bfa", status: "done", rating: 4, quote: "caught me straight away, love the groove" },
  { name: "mara linde", initial: "M", tone: "#fbbf24", status: "done", rating: 4, quote: "low end's a touch shy but the vibe's there" },
  { name: "theo brandt", initial: "T", tone: "#34d399", status: "listening", progress: 64 },
  { name: "kavi anand", initial: "K", tone: "#fb7185", status: "queued" },
];

function Dots({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-0.5 shrink-0">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className="w-1.5 h-1.5" style={{ background: i < count ? ACCENT : "rgba(255,255,255,0.16)" }} />
      ))}
    </div>
  );
}

export function RoomShowcase() {
  return (
    <section id="sample" className={`${jakarta.className} relative z-10 border-t border-white/10 scroll-mt-16 overflow-hidden`}>
      <style>{`
        @keyframes rowIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes eqb{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
        @keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes barGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>

      {/* soft cyan glow bleed */}
      <div className="absolute -top-32 right-1/4 w-[36rem] h-[36rem] rounded-full blur-3xl pointer-events-none" style={{ background: `radial-gradient(circle, ${ACCENT}1f, transparent 70%)` }} />

      <div className="relative max-w-6xl mx-auto px-5 py-20">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-5 mb-12">
          <div className="max-w-xl">
            <p className={`${mono.className} text-[13px] text-white/55 mb-3`}>[ the human layer ]</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.02em] leading-[1.0]">
              the verdict, backed by<br />
              <span style={{ color: ACCENT }}>real listeners</span>.
            </h2>
            <p className="text-white/55 text-base sm:text-lg mt-5 normal-case leading-relaxed">
              The measured verdict lands instantly. Then the same track goes to 5 real people who
              actually listen and react — so the call has human ears behind it, not just the numbers.
            </p>
          </div>
          <Link
            href="/report/demo"
            className={`${mono.className} group inline-flex items-center gap-1.5 text-[13px] text-black bg-[#6ee7ff] hover:bg-white px-4 py-2.5 transition-colors shrink-0`}
          >
            open the full sample
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-5 items-start">
          {/* ── THE ROOM (human proof) ── */}
          <div className="relative">
            {/* quirky hand label */}
            <div
              className={`${mono.className} hidden sm:block absolute -top-3 -left-2 z-20 text-[11px] text-black px-2.5 py-1 -rotate-3`}
              style={{ background: ACCENT }}
            >
              real humans, not bots ✦
            </div>

            <div className="border border-white/12 bg-[#0e0e0e]">
              {/* room header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full" style={{ background: ACCENT, animation: "pulseDot 1.4s ease-in-out infinite" }} />
                  </span>
                  <span className={`${mono.className} text-[12px] text-white/80`}>the room · live</span>
                </div>
                <span className={`${mono.className} text-[11px] text-black px-2 py-0.5`} style={{ background: ACCENT }}>
                  5 listeners assigned
                </span>
              </div>

              {/* the track being played */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                <div className="relative w-12 h-12 shrink-0 overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/activity-artwork/12.jpg" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold truncate normal-case">midnight drive</p>
                  <p className={`${mono.className} text-[11px] text-white/40 normal-case mt-0.5`}>now playing for the room</p>
                </div>
                {/* mini eq */}
                <div className="flex items-end gap-[3px] h-6 shrink-0">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className="w-[3px] origin-bottom" style={{ height: "100%", background: ACCENT, animation: `eqb ${0.6 + i * 0.16}s ease-in-out ${i * 0.1}s infinite` }} />
                  ))}
                </div>
              </div>

              {/* listeners */}
              <div className="divide-y divide-white/[0.06]">
                {ROOM.map((l, i) => (
                  <div key={l.name} className="flex items-start gap-3 px-5 py-3.5" style={{ animation: `rowIn .5s ease ${i * 0.12}s both` }}>
                    <span
                      className={`${mono.className} w-8 h-8 shrink-0 flex items-center justify-center text-[13px] font-bold text-black`}
                      style={{ background: l.tone }}
                    >
                      {l.initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`${mono.className} text-[12px] text-white/70 truncate`}>{l.name}</span>
                        {l.status === "done" && <span className="ml-auto shrink-0"><Dots count={l.rating} /></span>}
                        {l.status === "listening" && (
                          <span className={`${mono.className} ml-auto shrink-0 text-[10px]`} style={{ color: ACCENT }}>listening…</span>
                        )}
                        {l.status === "queued" && (
                          <span className={`${mono.className} ml-auto shrink-0 text-[10px] text-white/30`}>up next</span>
                        )}
                      </div>
                      {l.status === "done" && (
                        <p className="text-[13px] text-white/85 leading-snug normal-case">“{l.quote}”</p>
                      )}
                      {l.status === "listening" && (
                        <div className="h-1.5 bg-white/[0.07] overflow-hidden mt-1.5">
                          <div className="h-full" style={{ width: `${l.progress}%`, background: ACCENT }} />
                        </div>
                      )}
                      {l.status === "queued" && (
                        <p className={`${mono.className} text-[11px] text-white/25 normal-case`}>track queued — reacts shortly</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={`${mono.className} px-5 py-3 border-t border-white/10 text-[11px] text-white/45 normal-case`}>
                3 of 5 in — the rest are still listening.
              </div>
            </div>
          </div>

          {/* ── THE INSTANT READ (AI) ── */}
          <div className="space-y-5">
            <div className="border border-white/12 bg-[#0e0e0e] p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className={`${mono.className} text-[11px] text-black px-2 py-0.5`} style={{ background: ACCENT }}>instant</span>
                <span className={`${mono.className} text-[12px] text-white/55`}>ai read · lands in seconds</span>
              </div>

              <div className="flex items-center gap-6">
                <div className="shrink-0">
                  <ScoreRing score={SCORE} size="md" dark animate />
                </div>
                <div className="min-w-0">
                  <p className={`${mono.className} text-[11px] text-white/40 mb-1`}>verdict</p>
                  <p className="text-2xl font-extrabold leading-none">almost there<span style={{ color: ACCENT }}>.</span></p>
                  <p className="text-white/55 text-[13px] normal-case mt-2 leading-relaxed">
                    weighed across five dimensions a listener actually feels.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                {BARS.map((b, i) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-white/65 normal-case">{b.label}</span>
                      <span className={`${mono.className} text-[11px] font-bold`}>{b.v.toFixed(1)}<span className="text-white/30">/5</span></span>
                    </div>
                    <div className="h-1.5 bg-white/[0.07] overflow-hidden">
                      <div className="h-full origin-left" style={{ width: `${(b.v / 5) * 100}%`, background: `linear-gradient(90deg, ${ACCENT}, #a78bfa)`, animation: `barGrow .8s cubic-bezier(.2,.7,.2,1) ${0.2 + i * 0.1}s both` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* fixes */}
            <div className="border border-white/12 bg-[#0e0e0e] p-6">
              <p className={`${mono.className} text-[12px] text-white/55 mb-4`}>close these 3 and the verdict moves ↑</p>
              <div className="space-y-2.5">
                {FIXES.map((f, i) => (
                  <div key={f} className="flex items-start gap-3">
                    <span className={`${mono.className} shrink-0 w-6 h-6 flex items-center justify-center text-[12px] font-bold text-black`} style={{ background: ACCENT }}>{i + 1}</span>
                    <p className="text-[13.5px] font-semibold leading-snug pt-0.5 normal-case">{f}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
