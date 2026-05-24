"use client";

import { ArrowLeft, ArrowRight, BarChart3, MessageSquare, Settings, CheckCircle2, Play } from "lucide-react";

export function TrackPageMockup() {
  return (
    <div className="bg-[#faf7f2] font-sans text-black overflow-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black px-4 pt-4 pb-5">
        <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-black/30 mb-3">
          <ArrowLeft className="h-2.5 w-2.5" />
          My Music
        </div>

        <div className="flex gap-4">
          {/* Artwork */}
          <div className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] flex-shrink-0 rounded-2xl overflow-hidden border-2 border-black/8 shadow-md bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight leading-none">Midnight Drive</span>
                <span className="inline-flex items-center gap-0.5 text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-lime-400 text-black">
                  <CheckCircle2 className="h-2 w-2" />
                  Done
                </span>
              </div>
              <div className="flex gap-1.5 mb-2">
                <span className="px-2 py-0.5 bg-black/[0.04] rounded-full text-[9px] font-bold text-black/50">Electronic</span>
                <span className="px-2 py-0.5 bg-black/[0.04] rounded-full text-[9px] font-bold text-black/50">Lo-Fi</span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-black/[0.04] rounded-full text-[9px] font-bold text-black/50">
                  <Play className="w-2 h-2 fill-black/40 text-black/40" />
                  1.2k plays
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base font-black tabular-nums">5</span>
                  <span className="text-[9px] text-black/40 font-medium">/ 5</span>
                </div>
                <div className="w-16 h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div className="h-full w-full rounded-full bg-lime-400" />
                </div>
                <span className="text-[9px] font-black text-black/30">100%</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="inline-flex items-center gap-1 bg-purple-600 text-white text-[9px] font-black px-2.5 py-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                  More reviews <ArrowRight className="h-2.5 w-2.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── AUDIO PLAYER STRIP ───────────────────────────────── */}
      <div className="bg-neutral-900 px-4 py-2.5 flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <Play className="w-2.5 h-2.5 fill-white/60 text-white/60" />
        </div>
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-[38%] bg-purple-400 rounded-full" />
        </div>
        <span className="text-[9px] text-white/30 font-mono tabular-nums">1:24 / 3:42</span>
      </div>

      {/* ── TABS ─────────────────────────────────────────────── */}
      <div className="px-4 py-4">
        <div className="flex gap-2 mb-5">
          {[
            { label: "Track Stats", icon: BarChart3, active: false },
            { label: "Reviews", icon: MessageSquare, active: true },
            { label: "Settings", icon: Settings, active: false },
          ].map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-black text-[8px] uppercase tracking-wider border-2 whitespace-nowrap ${
                active
                  ? "bg-black text-white border-black"
                  : "bg-white text-black/40 border-black/10"
              }`}
            >
              <Icon className="h-2.5 w-2.5" />
              {label}
            </div>
          ))}
        </div>

        {/* ── VERDICT BANNER ─────────────────────────────────── */}
        <div className="rounded-2xl bg-white border border-black/10 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.06)] mb-4">
          <div className="h-1.5 bg-gradient-to-r from-lime-500 to-emerald-600" />
          <div className="p-4">
            <p className="text-[8px] font-mono tracking-[0.2em] uppercase text-black/40 mb-2">
              Listener Verdict · 5 reviews
            </p>
            <h2 className="text-2xl font-black tracking-tight leading-tight mb-1">Release Ready</h2>
            <p className="text-[10px] text-black/60 mb-3">
              4 of 5 listeners hooked ·{" "}
              <span className="text-purple-600 font-semibold">5/5 would replay</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">Highs harsh</span>
              <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800">Over-compressed</span>
            </div>
          </div>
        </div>

        {/* ── REVIEW CARDS ───────────────────────────────────── */}
        <div className="space-y-3">
          {[
            {
              initial: "A",
              name: "Alex Rivera",
              quality: "Release Ready",
              qualityBg: "bg-lime-50 border-lime-300 text-lime-800",
              dot: "bg-lime-500",
              issues: [],
              bestPart: "the groove locks in really well when it hits the chorus — that part carries the whole track",
              feedback: "on my setup it comes across a bit harsh in the upper mids, something around 3-5k sitting a little hot. light eq pass would smooth it out. overall solid tho",
            },
            {
              initial: "M",
              name: "Maya Chen",
              quality: "Almost There",
              qualityBg: "bg-amber-50 border-amber-200 text-amber-800",
              dot: "bg-amber-400",
              issues: ["Highs harsh"],
              bestPart: "the momentum builds nicely through the song and doesn't lose you along the way",
              feedback: "not usually my thing but i get the vibe. sounds a bit sharp on my speakers — some brightness in the highs that could be dialed back. small eq job, nothing major",
            },
          ].map((r) => (
            <article key={r.name} className="bg-white rounded-2xl border border-black/10 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.06)] px-4 py-4">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-[10px] font-black text-purple-700">
                  {r.initial}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-black text-black">{r.name}</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full border ${r.qualityBg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.dot}`} />
                  {r.quality}
                </span>
              </div>

              {r.issues.length > 0 && (
                <div className="flex gap-1 mb-2 flex-wrap">
                  {r.issues.map((issue) => (
                    <span key={issue} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">{issue}</span>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-black/30 mb-0.5">Best Moment</p>
                  <p className="text-[10px] text-black/80 leading-relaxed">{r.bestPart}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-black/30 mb-0.5">Main Feedback</p>
                  <p className="text-[10px] text-black/60 leading-relaxed">{r.feedback}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
