"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Music, Play, TrendingUp, MessageSquare, BarChart3 } from "lucide-react";

type Tab = "analytics" | "consensus" | "reviews";

export function TrackReportDemo() {
  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [missingArtwork, setMissingArtwork] = useState(false);

  const tabs: { id: Tab; icon: typeof BarChart3; label: string; sub: string }[] = [
    { id: "analytics", icon: BarChart3, label: "Analytics", sub: "Visual breakdown" },
    { id: "consensus", icon: TrendingUp, label: "Patterns", sub: "What they agreed on" },
    { id: "reviews", icon: MessageSquare, label: "Reviews", sub: "Individual feedback" },
  ];

  return (
    /* Outer shell — elevated card that looks like a real product screenshot */
    <div className="rounded-3xl overflow-hidden border border-black/8 bg-white shadow-[0_24px_64px_-8px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.04)]">

      {/* ── Track Header ─────────────────────────────────── */}
      <div className="bg-[#faf7f2] border-b border-black/8 px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">

          {/* Artwork + title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-neutral-200 flex-shrink-0 border border-black/8 shadow-sm group cursor-pointer">
              {!missingArtwork ? (
                <img
                  src="/track-artwork/midnight-drive.jpg"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                  onError={() => setMissingArtwork(true)}
                />
              ) : null}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                <Play className="h-5 w-5 text-white fill-white" />
              </div>
              <Music className={`h-5 w-5 text-neutral-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${missingArtwork ? "opacity-100" : "opacity-0"}`} />
            </div>
            <div className="min-w-0">
              <p className="font-black text-neutral-950 text-sm sm:text-base leading-tight">Midnight Drive</p>
              <p className="text-xs text-neutral-500 mt-0.5">by <span className="text-neutral-800 font-semibold">You</span> · <span className="text-purple-600 font-semibold">Electronic</span></p>
            </div>
          </div>

          {/* Waveform */}
          <div className="flex-1 min-w-0">
            <div className="flex items-end gap-[1.5px] h-7 sm:h-10 overflow-hidden">
              {[
                8,12,10,15,12,18,14,20,16,22,18,25,20,28,22,30,25,32,28,35,
                30,35,32,38,35,42,38,45,42,48,45,52,48,55,52,58,55,62,58,65,
                62,68,65,72,68,75,72,78,75,82,
                95,75,92,78,98,72,95,80,100,70,95,82,98,75,92,85,95,78,100,72,
                92,80,95,75,98,82,92,78,95,85,98,72,95,80,92,75,98,82,95,78,
                65,55,60,50,58,48,55,45,52,42,50,40,48,38,45,35,42,38,45,42,
                48,45,52,48,55,52,58,55,62,58,65,62,68,65,72,68,75,72,78,75,
                100,78,95,82,98,75,100,85,95,72,98,80,100,75,95,85,98,78,100,72,
                88,82,85,78,82,75,78,70,75,65,70,60,65,55,60,50,55,45,50,40,
                45,35,40,30,35,25,30,20,25,15,20,12,15,10,12,8,10,6,8,5
              ].map((h, i) => (
                <div key={i} className="flex-1 min-w-[1px] bg-black/12 rounded-[1px]" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-neutral-400 font-mono">0:00</span>
              <span className="text-[9px] text-neutral-400 font-mono">3:24</span>
            </div>
          </div>

          {/* Review count badge */}
          <div className="flex-shrink-0 bg-purple-600 rounded-xl px-3 py-2 text-center shadow-sm">
            <p className="text-xl font-black text-white leading-none">20</p>
            <p className="text-[9px] font-bold text-purple-200 uppercase tracking-wider mt-0.5">Reviews</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="border-b border-black/8 bg-white px-2 pt-2">
        <div className="flex gap-1">
          {tabs.map(({ id, icon: Icon, label, sub }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-2.5 px-3 py-2.5 sm:py-3 rounded-t-xl transition-all relative ${
                activeTab === id
                  ? "bg-[#faf7f2] text-neutral-950"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
              }`}
            >
              {activeTab === id && (
                <div className="absolute top-0 left-3 right-3 h-0.5 bg-purple-500 rounded-b" />
              )}
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                activeTab === id ? "bg-purple-100 text-purple-700" : "bg-neutral-100 text-neutral-400"
              }`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="text-center sm:text-left">
                <p className={`text-[10px] sm:text-sm font-black leading-tight ${activeTab === id ? "text-neutral-950" : "text-neutral-500"}`}>{label}</p>
                <p className="hidden sm:block text-xs text-neutral-400 mt-0.5 font-medium">{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────── */}
      <div className="bg-[#faf7f2] p-4 sm:p-6">

        {/* Analytics */}
        {activeTab === "analytics" && (
          <div className="space-y-4">

            {/* Score + signals row */}
            <div className="flex flex-col sm:flex-row gap-4">

              {/* Radial gauge */}
              <div className="bg-white rounded-2xl border border-black/8 shadow-md p-5 flex flex-col items-center justify-center sm:w-44 flex-shrink-0">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#9333ea" />
                        <stop offset="100%" stopColor="#c084fc" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="42" stroke="#f3f4f6" strokeWidth="7" fill="none" />
                    <circle
                      cx="50" cy="50" r="42"
                      stroke="url(#scoreGrad)"
                      strokeWidth="7"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - 0.84)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-neutral-950 leading-none tracking-tighter">4.2</span>
                    <span className="text-[10px] font-bold text-neutral-400 mt-0.5 uppercase tracking-wider">/ 5</span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-neutral-400 mt-2">20 reviews</p>
              </div>

              {/* Listener signals */}
              <div className="bg-white rounded-2xl border border-black/8 shadow-md p-5 flex-1">
                <p className="text-[10px] font-black text-neutral-400 tracking-[0.15em] uppercase mb-3">Listener signals</p>
                <div className="space-y-3">
                  {[
                    { label: "Would listen again", value: 85 },
                    { label: "Would add to playlist", value: 67 },
                    { label: "Would share", value: 52 },
                    { label: "Would follow artist", value: 40 },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-neutral-600">{s.label}</span>
                        <span className="text-xs font-black text-neutral-950">{s.value}%</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${s.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rating bars + sentiment */}
            <div className="flex flex-col sm:flex-row gap-4">

              {/* Rating distribution */}
              <div className="bg-white rounded-2xl border border-black/8 shadow-md p-5 flex-1">
                <p className="text-[10px] font-black text-neutral-400 tracking-[0.15em] uppercase mb-3">Rating breakdown</p>
                <div className="space-y-2">
                  {[
                    { stars: 5, count: 8, percent: 40 },
                    { stars: 4, count: 7, percent: 35 },
                    { stars: 3, count: 4, percent: 20 },
                    { stars: 2, count: 1, percent: 5 },
                    { stars: 1, count: 0, percent: 0 },
                  ].map((row) => (
                    <div key={row.stars} className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-neutral-400 w-3 text-right tabular-nums">{row.stars}</span>
                      <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.max(row.percent, row.count > 0 ? 3 : 0)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-neutral-400 w-3 tabular-nums">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sentiment tiles */}
              <div className="sm:w-44 flex flex-col gap-3">
                <div className="bg-purple-600 rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-md">
                  <p className="text-3xl font-black text-white leading-none">75%</p>
                  <p className="text-xs font-semibold text-purple-200 mt-1">Positive sentiment</p>
                </div>
                <div className="bg-neutral-950 rounded-2xl p-4 flex-1 flex flex-col justify-center shadow-md">
                  <p className="text-3xl font-black text-orange-400 leading-none">3</p>
                  <p className="text-xs font-semibold text-neutral-500 mt-1">Areas to improve</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Consensus */}
        {activeTab === "consensus" && (
          <div className="space-y-4">

            {/* What's working */}
            <div className="bg-white rounded-2xl border border-black/8 shadow-md overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-black/6 bg-purple-50">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-[10px] font-black text-purple-700 uppercase tracking-[0.15em]">What&apos;s working</span>
              </div>
              <div className="divide-y divide-black/5">
                {[
                  { count: "15 of 20", title: "Hook hits hard at 0:45", body: "The main melody is instantly memorable — multiple reviewers said it was stuck in their head after one listen. The drum pattern underneath locks in perfectly." },
                  { count: "12 of 20", title: "Breakdown at 2:15 creates real tension", body: "Stripping back to just the vocal and pad was a smart arrangement choice. Creates genuine anticipation before the second drop." },
                  { count: "9 of 20", title: "Bass and kick relationship is clean", body: "The low end is well-managed — sidechain gives the bass room to breathe and the kick punches through without muddiness." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 px-5 py-4">
                    <span className="flex-shrink-0 text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded-lg whitespace-nowrap mt-0.5">{item.count}</span>
                    <div>
                      <p className="text-sm font-black text-neutral-950 leading-snug">{item.title}</p>
                      <p className="text-xs text-neutral-500 leading-relaxed mt-1">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What to improve */}
            <div className="bg-white rounded-2xl border border-black/8 shadow-md overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-black/6 bg-orange-50">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-[10px] font-black text-orange-700 uppercase tracking-[0.15em]">What to improve</span>
              </div>
              <div className="divide-y divide-black/5">
                {[
                  { count: "14 of 20", title: "Intro takes too long to reach the hook", body: "Most reviewers felt the first 45 seconds could be tightened. Trim 8–12 seconds and tease the main melody earlier." },
                  { count: "10 of 20", title: "Vocal competes with lead synth around 1:30", body: "The vocal and synth are fighting for the same frequency space in the midrange. Try dipping the vocal 2–3dB in that section." },
                  { count: "7 of 20", title: "Outro could use more variation", body: "The last 20 seconds feel like a repeat of the first drop. Consider filtering highs gradually or adding a new melodic element." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 px-5 py-4">
                    <span className="flex-shrink-0 text-[10px] font-black bg-orange-100 text-orange-700 border border-orange-200 px-2 py-1 rounded-lg whitespace-nowrap mt-0.5">{item.count}</span>
                    <div>
                      <p className="text-sm font-black text-neutral-950 leading-snug">{item.title}</p>
                      <p className="text-xs text-neutral-500 leading-relaxed mt-1">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-neutral-400 text-center font-medium pt-1">
              When multiple reviewers flag the same thing — that&apos;s signal, not taste.
            </p>
          </div>
        )}

        {/* Reviews */}
        {activeTab === "reviews" && (
          <div>
            {/* Nav row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-neutral-500">Review</span>
                <div className="bg-white border border-black/10 rounded-lg px-2.5 py-1 font-mono text-xs font-black text-neutral-950 shadow-sm">
                  1 / 20
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-black/10 bg-white text-neutral-300 cursor-not-allowed shadow-sm">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-black/10 bg-white hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 text-neutral-600 transition-colors shadow-sm">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Reviewer row */}
            <div className="bg-white rounded-2xl border border-black/8 shadow-md p-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center font-black text-purple-700 text-sm flex-shrink-0">S</div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-neutral-950 text-sm">Sarah</p>
                  <p className="text-xs text-neutral-500">Electronic fan · 4.2 / 5</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded-lg">Would replay</span>
                  <span className="hidden sm:inline text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded-lg">Would playlist</span>
                </div>
              </div>
            </div>

            {/* Feedback cards */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-black/8 shadow-md p-4">
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.15em] mb-2.5">What worked</p>
                <p className="text-neutral-700 text-sm leading-relaxed">
                  The hook at <span className="font-mono text-neutral-950 bg-neutral-100 border border-black/8 px-1 py-0.5 rounded text-xs">0:45</span> is instantly memorable — I caught myself humming it after the first listen. The synth layering in the drop is really well done, everything sits nicely and the sidechain on the bass gives it that professional bounce.
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-black/8 shadow-md p-4">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.15em] mb-2.5">To improve</p>
                <p className="text-neutral-700 text-sm leading-relaxed">
                  The intro drags a bit — you don&apos;t reach the hook until <span className="font-mono text-neutral-950 bg-neutral-100 border border-black/8 px-1 py-0.5 rounded text-xs">0:45</span> which is a long wait. I&apos;d trim 8–12 seconds. The vocal around <span className="font-mono text-neutral-950 bg-neutral-100 border border-black/8 px-1 py-0.5 rounded text-xs">1:30</span> competes with the lead synth — try carving some space with a mid-side EQ cut.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/6">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-1.5 rounded-full bg-purple-500" />
                {[0, 1, 2, 3].map((i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-black/10" />)}
                <span className="text-[10px] text-neutral-400 ml-1 font-medium">+15 more</span>
              </div>
              <button className="text-xs font-black text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors">
                Read full review <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
