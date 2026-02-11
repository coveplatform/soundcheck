"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Music, Play, TrendingUp, MessageSquare, BarChart3 } from "lucide-react";

type Tab = "analytics" | "consensus" | "reviews";

export function TrackReportDemo() {
  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [missingArtwork, setMissingArtwork] = useState(false);

  return (
    <div className="bg-white border border-neutral-200 shadow-sm">
      {/* Track Header with Waveform */}
      <div className="bg-[#faf8f5] border-b border-neutral-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 sm:flex-shrink-0">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 border border-neutral-200 flex-shrink-0 group cursor-pointer overflow-hidden">
              {!missingArtwork ? (
                <img
                  src="/track-artwork/midnight-drive.jpg"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                  onError={() => setMissingArtwork(true)}
                />
              ) : null}
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-50 fill-neutral-50" />
              </div>
              <Music className={`h-5 w-5 sm:h-7 sm:w-7 text-neutral-950/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity ${missingArtwork ? "opacity-100" : "opacity-0 group-hover:opacity-0"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-neutral-950 text-sm sm:text-lg truncate">Midnight Drive</h4>
              <p className="text-xs sm:text-sm text-neutral-600">by <span className="text-neutral-950 font-semibold">You</span> • <span className="text-orange-700 font-semibold">Electronic</span></p>
            </div>
            <div className="flex-shrink-0 bg-purple-100 border border-purple-200 px-2 sm:px-3 py-1 sm:py-1.5 text-center">
              <div className="text-lg sm:text-2xl font-extrabold text-purple-900 leading-none">20</div>
              <div className="text-[8px] sm:text-[10px] font-semibold text-purple-900/70 uppercase tracking-wide">Reviews</div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-end gap-[1px] h-8 sm:h-12 overflow-hidden">
              {[
                // Intro - quiet, building
                8, 12, 10, 15, 12, 18, 14, 20, 16, 22, 18, 25, 20, 28, 22, 30, 25, 32, 28, 35,
                // Build up
                30, 35, 32, 38, 35, 42, 38, 45, 42, 48, 45, 52, 48, 55, 52, 58, 55, 62, 58, 65,
                62, 68, 65, 72, 68, 75, 72, 78, 75, 82,
                // First drop - loud, punchy
                95, 75, 92, 78, 98, 72, 95, 80, 100, 70, 95, 82, 98, 75, 92, 85, 95, 78, 100, 72,
                92, 80, 95, 75, 98, 82, 92, 78, 95, 85, 98, 72, 95, 80, 92, 75, 98, 82, 95, 78,
                // Breakdown - quieter
                65, 55, 60, 50, 58, 48, 55, 45, 52, 42, 50, 40, 48, 38, 45, 35, 42, 38, 45, 42,
                48, 45, 52, 48, 55, 52, 58, 55, 62, 58, 65, 62, 68, 65, 72, 68, 75, 72, 78, 75,
                // Second drop - even louder
                100, 78, 95, 82, 98, 75, 100, 85, 95, 72, 98, 80, 100, 75, 95, 85, 98, 78, 100, 72,
                95, 82, 98, 78, 100, 85, 95, 75, 98, 82, 95, 80, 100, 75, 98, 82, 95, 78, 100, 85,
                // Outro - fade out
                88, 82, 85, 78, 82, 75, 78, 70, 75, 65, 70, 60, 65, 55, 60, 50, 55, 45, 50, 40,
                45, 35, 40, 30, 35, 25, 30, 20, 25, 15, 20, 12, 15, 10, 12, 8, 10, 6, 8, 5
              ].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-[1px] bg-neutral-300 rounded-[1px]"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] sm:text-[10px] text-neutral-500 font-mono">0:00</span>
              <span className="text-[9px] sm:text-[10px] text-neutral-500 font-mono">3:24</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Responsive: compact on mobile, full on desktop */}
      <div className="bg-white border-b border-neutral-200 px-1 sm:px-2 pt-1 sm:pt-2">
        <div className="flex gap-1">
          {/* Analytics Tab */}
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 transition-colors rounded-t-lg relative border border-transparent ${
              activeTab === "analytics"
                ? "bg-[#faf8f5] text-neutral-950 border-neutral-200"
                : "bg-white text-neutral-600 hover:bg-[#faf8f5] hover:text-neutral-950"
            }`}
          >
            {activeTab === "analytics" && (
              <div className="absolute top-0 left-2 right-2 sm:left-3 sm:right-3 h-1 bg-purple-500 rounded-b" />
            )}
            {/* Mobile: Icon + short label */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div
                className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border ${
                  activeTab === "analytics"
                    ? "bg-purple-100 text-purple-900 border-purple-200"
                    : "bg-neutral-100 text-neutral-500 border-neutral-200"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="text-center sm:text-left">
                <div className="font-semibold text-[10px] sm:text-sm">Analytics</div>
                <div className={`hidden sm:block text-xs mt-0.5 ${activeTab === "analytics" ? "text-neutral-600" : "text-neutral-500"}`}>
                  Visual breakdown
                </div>
              </div>
            </div>
          </button>

          {/* Consensus Tab */}
          <button
            onClick={() => setActiveTab("consensus")}
            className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 transition-colors rounded-t-lg relative border border-transparent ${
              activeTab === "consensus"
                ? "bg-[#faf8f5] text-neutral-950 border-neutral-200"
                : "bg-white text-neutral-600 hover:bg-[#faf8f5] hover:text-neutral-950"
            }`}
          >
            {activeTab === "consensus" && (
              <div className="absolute top-0 left-2 right-2 sm:left-3 sm:right-3 h-1 bg-purple-500 rounded-b" />
            )}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div
                className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border ${
                  activeTab === "consensus"
                    ? "bg-purple-100 text-purple-900 border-purple-200"
                    : "bg-neutral-100 text-neutral-500 border-neutral-200"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-center sm:text-left">
                <div className="font-semibold text-[10px] sm:text-sm">Patterns</div>
                <div className={`hidden sm:block text-xs mt-0.5 ${activeTab === "consensus" ? "text-neutral-600" : "text-neutral-500"}`}>
                  What they agreed on
                </div>
              </div>
            </div>
          </button>

          {/* Reviews Tab */}
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 transition-colors rounded-t-lg relative border border-transparent ${
              activeTab === "reviews"
                ? "bg-[#faf8f5] text-neutral-950 border-neutral-200"
                : "bg-white text-neutral-600 hover:bg-[#faf8f5] hover:text-neutral-950"
            }`}
          >
            {activeTab === "reviews" && (
              <div className="absolute top-0 left-2 right-2 sm:left-3 sm:right-3 h-1 bg-purple-500 rounded-b" />
            )}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div
                className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border ${
                  activeTab === "reviews"
                    ? "bg-purple-100 text-purple-900 border-purple-200"
                    : "bg-neutral-100 text-neutral-500 border-neutral-200"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="text-center sm:text-left">
                <div className="font-semibold text-[10px] sm:text-sm">Reviews</div>
                <div className={`hidden sm:block text-xs mt-0.5 ${activeTab === "reviews" ? "text-neutral-600" : "text-neutral-500"}`}>
                  Individual feedback
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-5 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Subtle background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/[0.07] rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-400/[0.05] rounded-full blur-3xl" />
        </div>

        <div className="relative">
          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Big score + listener response stats */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Average score — hero number */}
                <div className="bg-purple-600 border-2 border-black rounded-2xl p-5 sm:p-6 text-center sm:text-left flex-shrink-0 sm:w-40 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-5xl sm:text-6xl font-black text-white leading-none tracking-tighter">4.2</div>
                  <div className="text-xs font-bold text-white/70 mt-1 uppercase tracking-wider">Avg rating</div>
                  <div className="flex items-center justify-center sm:justify-start gap-0.5 mt-2">
                    {[1,2,3,4].map(i => <div key={i} className="w-3 h-3 rounded-full bg-white" />)}
                    <div className="w-3 h-3 rounded-full bg-white/30" />
                  </div>
                </div>

                {/* Listener response — bold stat cards */}
                <div className="flex-1 grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-purple-700 leading-none">85%</div>
                    <div className="text-[10px] sm:text-xs font-bold text-purple-600/70 mt-1.5">Would replay</div>
                  </div>
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-purple-700 leading-none">67%</div>
                    <div className="text-[10px] sm:text-xs font-bold text-purple-600/70 mt-1.5">Would playlist</div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-orange-600 leading-none">52%</div>
                    <div className="text-[10px] sm:text-xs font-bold text-orange-500/70 mt-1.5">Would share</div>
                  </div>
                </div>
              </div>

              {/* Rating Distribution — chunky bars */}
              <div>
                <h4 className="text-[10px] font-bold text-neutral-400 mb-3 tracking-[0.15em] uppercase">Rating breakdown</h4>
                <div className="space-y-1.5">
                  {[
                    { stars: 5, count: 8, percent: 40, color: "bg-purple-600" },
                    { stars: 4, count: 7, percent: 35, color: "bg-purple-400" },
                    { stars: 3, count: 4, percent: 20, color: "bg-orange-400" },
                    { stars: 2, count: 1, percent: 5, color: "bg-orange-300" },
                    { stars: 1, count: 0, percent: 0, color: "bg-neutral-300" },
                  ].map((row) => (
                    <div key={row.stars} className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-neutral-400 w-5 text-right">{row.stars}</span>
                      <div className="flex-1 h-5 bg-neutral-100 rounded-md overflow-hidden">
                        <div
                          className={`h-full rounded-md ${row.color} transition-all duration-500 ease-out`}
                          style={{ width: `${Math.max(row.percent, 2)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-neutral-500 w-5">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom insight — replaces old quick stats */}
              <div className="bg-neutral-950 border-2 border-black rounded-xl p-4 flex items-center gap-4">
                <div className="text-3xl font-black text-white leading-none">75%</div>
                <div>
                  <p className="text-sm font-bold text-white">Positive sentiment</p>
                  <p className="text-xs text-neutral-500">3 areas flagged for improvement across 20 reviews</p>
                </div>
              </div>
            </div>
          )}

          {/* Consensus Tab */}
          {activeTab === "consensus" && (
            <div className="space-y-4">
              {/* What's Working */}
              <div className="bg-purple-500/10 border border-purple-500/30 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 bg-purple-500" />
                  <span className="text-xs font-semibold text-purple-800">WHAT&apos;S WORKING</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold bg-purple-200 text-purple-900 px-2 py-1 whitespace-nowrap border border-purple-300">15 of 20</span>
                    <div>
                      <div className="font-semibold text-sm text-neutral-950">Hook hits hard at 0:45</div>
                      <div className="text-xs text-neutral-600 leading-relaxed">The main melody is catchy and well-produced — multiple reviewers said it was stuck in their head after one listen. The drum pattern underneath locks in perfectly and gives the hook real momentum.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold bg-purple-100 text-purple-900 px-2 py-1 whitespace-nowrap border border-purple-200">12 of 20</span>
                    <div>
                      <div className="font-semibold text-sm text-neutral-950">Breakdown at 2:15 creates real tension</div>
                      <div className="text-xs text-neutral-600 leading-relaxed">Stripping back to just the vocal and pad was a smart arrangement choice. Reviewers noted it creates genuine anticipation before the second drop and makes the track feel dynamic rather than one-note.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold bg-purple-100 text-purple-900 px-2 py-1 whitespace-nowrap border border-purple-200">9 of 20</span>
                    <div>
                      <div className="font-semibold text-sm text-neutral-950">Bass and kick relationship is clean</div>
                      <div className="text-xs text-neutral-600 leading-relaxed">The low end is well-managed — the sidechain compression gives the bass room to breathe and the kick punches through without muddiness. Several reviewers called out the mix quality specifically.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What to Improve */}
              <div className="bg-orange-400/10 border border-orange-400/30 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 bg-orange-300" />
                  <span className="text-xs font-semibold text-orange-800">WHAT TO IMPROVE</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold bg-orange-200 text-orange-900 px-2 py-1 whitespace-nowrap border border-orange-300">14 of 20</span>
                    <div>
                      <div className="font-semibold text-sm text-neutral-950">Intro takes too long to reach the hook</div>
                      <div className="text-xs text-neutral-600 leading-relaxed">Most reviewers felt the first 45 seconds could be tightened. Suggestion: trim 8-12 seconds and tease the main melody earlier to keep listeners engaged. In this genre, the hook usually lands by 0:30.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold bg-orange-100 text-orange-900 px-2 py-1 whitespace-nowrap border border-orange-200">10 of 20</span>
                    <div>
                      <div className="font-semibold text-sm text-neutral-950">Vocal competes with lead synth around 1:30</div>
                      <div className="text-xs text-neutral-600 leading-relaxed">The vocal and synth are fighting for the same frequency space in the midrange. Try dipping the vocal 2-3dB in that section, or carve space with a mid-side EQ cut around 2-4kHz on the synth to let the vocal sit on top.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold bg-orange-100 text-orange-900 px-2 py-1 whitespace-nowrap border border-orange-200">7 of 20</span>
                    <div>
                      <div className="font-semibold text-sm text-neutral-950">Outro could use more variation</div>
                      <div className="text-xs text-neutral-600 leading-relaxed">The last 20 seconds feel like a copy of the first drop without enough change. Consider filtering the highs out gradually or introducing a new melodic element to give the ending its own identity.</div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-neutral-500 text-center pt-2">
                When multiple reviewers mention the same thing, you know it matters.
              </p>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div>
              {/* Navigation Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-neutral-600">Review</span>
                  <div className="flex items-center gap-1 bg-purple-100 text-purple-900 px-2.5 py-1 border border-purple-200 font-mono text-xs font-semibold">
                    <span>1</span>
                    <span className="text-black/50">/</span>
                    <span>20</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="h-8 w-8 flex items-center justify-center border border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button className="h-8 w-8 flex items-center justify-center border border-neutral-200 bg-white hover:bg-purple-100 hover:border-purple-200 hover:text-purple-900 text-neutral-700 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Review Content */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center font-extrabold text-purple-900">S</div>
                <div className="flex-1">
                  <div className="font-extrabold text-neutral-950">Sarah</div>
                  <div className="text-xs text-neutral-500">Electronic fan • 4.2/5 rating</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-200 px-2 py-1">Would replay</span>
                  <span className="hidden sm:inline text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-200 px-2 py-1">Would playlist</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-[#faf8f5] p-4 border border-neutral-200">
                  <div className="text-xs font-semibold text-purple-700 mb-2">WHAT WORKED</div>
                  <p className="text-neutral-700 text-sm leading-relaxed">
                    The hook at <span className="font-mono text-neutral-950 bg-white border border-neutral-200 px-1 rounded text-xs">0:45</span> is instantly memorable — I caught myself humming it after the first listen. The synth layering in the drop is really well done too, everything sits nicely in the mix and the sidechain on the bass gives it that professional bounce. The breakdown at <span className="font-mono text-neutral-950 bg-white border border-neutral-200 px-1 rounded text-xs">2:15</span> is a standout moment — stripping back to just the vocal and pad creates genuine tension before the second drop hits.
                  </p>
                </div>
                <div className="bg-[#faf8f5] p-4 border border-neutral-200">
                  <div className="text-xs font-semibold text-orange-700 mb-2">TO IMPROVE</div>
                  <p className="text-neutral-700 text-sm leading-relaxed">
                    The intro drags a bit — you don&apos;t reach the hook until <span className="font-mono text-neutral-950 bg-white border border-neutral-200 px-1 rounded text-xs">0:45</span> which is a long wait for a track in this genre. I&apos;d trim 8-12 seconds and tease the melody earlier to keep people locked in. The vocal around <span className="font-mono text-neutral-950 bg-white border border-neutral-200 px-1 rounded text-xs">1:30</span> competes with the lead synth — try dipping the vocal 2-3dB or carving some space with a mid-side EQ cut around 2-4kHz on the synth.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-1.5 rounded-full bg-purple-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  <span className="text-[10px] text-neutral-500 ml-1">+15 more</span>
                </div>
                <span className="text-xs font-semibold text-purple-700 flex items-center gap-1 cursor-pointer hover:text-purple-800">
                  Read full review <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
