"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, BarChart2, MessageSquare, Settings } from "lucide-react";

export function TrackPageMockup() {
  const progress = 60;

  return (
    <div className="bg-[#faf7f2] font-sans">
      {/* Header — mirrors the real track dashboard */}
      <div className="bg-white border-b-2 border-black px-5 py-5">
        {/* Back link */}
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-black/30 mb-4">
          <ArrowLeft className="h-2.5 w-2.5" />
          My Music
        </div>

        <div className="flex gap-5">
          {/* Artwork */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-black/10 shadow-sm bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-black leading-none">
                  Midnight Drive
                </h1>
                <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime-400 text-black">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Done
                </span>
              </div>

              <div className="flex gap-1.5 mb-3">
                <span className="px-2 py-0.5 bg-black/[0.04] rounded-full text-[10px] font-bold text-black/50">Electronic</span>
                <span className="px-2 py-0.5 bg-black/[0.04] rounded-full text-[10px] font-bold text-black/50">Lo-Fi</span>
              </div>
            </div>

            {/* Progress + action row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-black text-black tabular-nums">3</span>
                  <span className="text-[10px] text-black/40 font-medium">/ 5</span>
                </div>
                <div className="w-16 h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] font-black text-black/30">60%</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-purple-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0_#000]">
                  More reviews <ArrowRight className="h-2.5 w-2.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-black/10 px-5">
        <div className="flex gap-5">
          {[
            { label: "Stats", icon: BarChart2, active: false },
            { label: "Reviews", icon: MessageSquare, active: true },
            { label: "Settings", icon: Settings, active: false },
          ].map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 py-3 text-[11px] font-black border-b-2 ${
                active ? "border-black text-black" : "border-transparent text-black/30"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div className="px-5 py-4 space-y-3">
        {[
          {
            name: "Alex Rivera",
            score: 4,
            tag: "Release Ready",
            tagColor: "bg-lime-400 text-black",
            text: "the groove on this actually locks in pretty well, especially when it kicks into the chorus. solid production throughout.",
          },
          {
            name: "Maya Chen",
            score: 3,
            tag: "Almost There",
            tagColor: "bg-amber-400 text-black",
            text: "not usually my style but i kinda get it. comes across a bit harsh on my setup around the high mids — light eq pass would sort it.",
          },
          {
            name: "Jordan Wells",
            score: 4,
            tag: "Release Ready",
            tagColor: "bg-lime-400 text-black",
            text: "liked the energy, the momentum builds nicely and doesn't lose you along the way. would listen again.",
          },
        ].map((r) => (
          <div key={r.name} className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0_#000]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0" />
                <span className="text-[11px] font-black text-black">{r.name}</span>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${r.tagColor}`}>{r.tag}</span>
            </div>
            <p className="text-[10px] text-black/60 leading-relaxed line-clamp-2">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
