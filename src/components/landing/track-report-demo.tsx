"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Music, Play, TrendingUp, MessageSquare, BarChart3 } from "lucide-react";

type Tab = "analytics" | "consensus" | "reviews";

// Circular progress component
function CircleProgress({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-neutral-200"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-extrabold text-neutral-950">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-neutral-600 mt-2 text-center">{label}</span>
    </div>
  );
}

export function TrackReportDemo() {
  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [missingArtwork, setMissingArtwork] = useState(false);

  return (
    <div className="bg-white border border-neutral-200 shadow-sm">
      {/* Track Header with Waveform */}
      <div className="bg-[#f7f7f5] border-b border-neutral-200 p-4 sm:p-5">
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
            <div className="flex-shrink-0 bg-lime-100 border border-lime-200 px-2 sm:px-3 py-1 sm:py-1.5">
              <div className="text-lg sm:text-2xl font-extrabold text-lime-900 leading-none">20</div>
              <div className="text-[8px] sm:text-[10px] font-semibold text-lime-900/70 uppercase tracking-wide">Reviews</div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-[1px] sm:gap-[2px] h-8 sm:h-12 overflow-hidden">
              {[
                15, 22, 18, 25, 20, 28, 24, 30, 26, 32,
                30, 35, 38, 42, 48, 52, 58, 65, 72, 78,
                95, 88, 92, 85, 98, 82, 95, 78, 92, 85, 98, 90, 85, 92, 88,
                45, 52, 48, 55, 42, 50, 45, 52, 48, 40,
                45, 55, 62, 70, 78, 85,
                100, 92, 95, 88, 98, 85, 95, 90, 98, 92, 88, 95, 90, 85,
                75, 65, 55, 48, 40, 32, 25, 18, 12, 8
              ].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-neutral-300 rounded-sm"
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
                ? "bg-[#f7f7f5] text-neutral-950 border-neutral-200"
                : "bg-white text-neutral-600 hover:bg-[#f7f7f5] hover:text-neutral-950"
            }`}
          >
            {activeTab === "analytics" && (
              <div className="absolute top-0 left-2 right-2 sm:left-3 sm:right-3 h-1 bg-lime-400 rounded-b" />
            )}
            {/* Mobile: Icon + short label */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div
                className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border ${
                  activeTab === "analytics"
                    ? "bg-lime-100 text-lime-900 border-lime-200"
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
                ? "bg-[#f7f7f5] text-neutral-950 border-neutral-200"
                : "bg-white text-neutral-600 hover:bg-[#f7f7f5] hover:text-neutral-950"
            }`}
          >
            {activeTab === "consensus" && (
              <div className="absolute top-0 left-2 right-2 sm:left-3 sm:right-3 h-1 bg-lime-400 rounded-b" />
            )}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div
                className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border ${
                  activeTab === "consensus"
                    ? "bg-lime-100 text-lime-900 border-lime-200"
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
                ? "bg-[#f7f7f5] text-neutral-950 border-neutral-200"
                : "bg-white text-neutral-600 hover:bg-[#f7f7f5] hover:text-neutral-950"
            }`}
          >
            {activeTab === "reviews" && (
              <div className="absolute top-0 left-2 right-2 sm:left-3 sm:right-3 h-1 bg-lime-400 rounded-b" />
            )}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div
                className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border ${
                  activeTab === "reviews"
                    ? "bg-lime-100 text-lime-900 border-lime-200"
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
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-lime-500/[0.07] rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-400/[0.05] rounded-full blur-3xl" />
        </div>

        <div className="relative">
          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Listener Response - Circle Charts */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-500 mb-4 tracking-wider">LISTENER RESPONSE</h4>
                <div className="grid grid-cols-3 gap-4 sm:gap-6">
                  <CircleProgress value={85} label="Would Replay" color="#84cc16" />
                  <CircleProgress value={67} label="Would Playlist" color="#84cc16" />
                  <CircleProgress value={52} label="Would Share" color="#fb923c" />
                </div>
              </div>

              {/* Rating Distribution - Bar Chart */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-500 mb-4 tracking-wider">RATING DISTRIBUTION</h4>
                <div className="bg-[#f7f7f5] border border-neutral-200 p-4">
                  <div className="space-y-2">
                    {[
                      { stars: 5, count: 8, percent: 40 },
                      { stars: 4, count: 7, percent: 35 },
                      { stars: 3, count: 4, percent: 20 },
                      { stars: 2, count: 1, percent: 5 },
                      { stars: 1, count: 0, percent: 0 },
                    ].map((row) => (
                      <div key={row.stars} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-neutral-500 w-12">{row.stars} star</span>
                        <div className="flex-1 h-4 bg-neutral-200 rounded-sm overflow-hidden">
                          <div
                            className={`h-full ${row.stars >= 4 ? 'bg-lime-500' : row.stars === 3 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                            style={{ width: `${row.percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-neutral-600 w-8">{row.count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-neutral-200 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">Average Rating</span>
                    <span className="text-lg font-extrabold text-neutral-950">4.2<span className="text-neutral-500 text-sm">/5</span></span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-lime-500/10 border border-lime-500/30 p-4 text-center">
                  <div className="text-2xl font-extrabold text-lime-700">75%</div>
                  <div className="text-xs text-neutral-600 mt-1">Positive Sentiment</div>
                </div>
                <div className="bg-orange-400/10 border border-orange-400/30 p-4 text-center">
                  <div className="text-2xl font-extrabold text-orange-700">3</div>
                  <div className="text-xs text-neutral-600 mt-1">Areas to Improve</div>
                </div>
              </div>
            </div>
          )}

          {/* Consensus Tab */}
          {activeTab === "consensus" && (
            <div className="space-y-4">
              {/* What's Working */}
              <div className="bg-lime-500/10 border border-lime-500/30 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 bg-lime-400" />
                  <span className="text-xs font-semibold text-lime-800">WHAT&apos;S WORKING</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold bg-lime-200 text-lime-900 px-2 py-1 whitespace-nowrap border border-lime-300">15 of 20</span>
                    <div>
                      <div className="font-semibold text-sm text-neutral-950">Hook hits hard at 0:45</div>
                      <div className="text-xs text-neutral-600">Melody lands, drums feel confident</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold bg-lime-100 text-lime-900 px-2 py-1 whitespace-nowrap border border-lime-200">12 of 20</span>
                    <div>
                      <div className="font-semibold text-sm text-neutral-950">Breakdown feels fresh at 2:15</div>
                      <div className="text-xs text-neutral-600">Nice contrast, keeps attention</div>
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
                      <div className="font-semibold text-sm text-neutral-950">Intro too long</div>
                      <div className="text-xs text-neutral-600">Hook should arrive sooner</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold bg-orange-100 text-orange-900 px-2 py-1 whitespace-nowrap border border-orange-200">10 of 20</span>
                    <div>
                      <div className="font-semibold text-sm text-neutral-950">Vocal too loud at 1:30</div>
                      <div className="text-xs text-neutral-600">Clashes with the lead synth</div>
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
                  <div className="flex items-center gap-1 bg-lime-100 text-lime-900 px-2.5 py-1 border border-lime-200 font-mono text-xs font-semibold">
                    <span>1</span>
                    <span className="text-black/50">/</span>
                    <span>20</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="h-8 w-8 flex items-center justify-center border border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button className="h-8 w-8 flex items-center justify-center border border-neutral-200 bg-white hover:bg-lime-100 hover:border-lime-200 hover:text-lime-900 text-neutral-700 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Review Content */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-lime-100 border border-lime-200 flex items-center justify-center font-extrabold text-lime-900">S</div>
                <div className="flex-1">
                  <div className="font-extrabold text-neutral-950">Sarah</div>
                  <div className="text-xs text-neutral-500">Electronic fan • 4.2/5 rating</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-semibold bg-lime-100 text-lime-900 border border-lime-200 px-2 py-1">Would replay</span>
                  <span className="hidden sm:inline text-xs font-semibold bg-lime-100 text-lime-900 border border-lime-200 px-2 py-1">Would playlist</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-[#f7f7f5] p-4 border border-neutral-200">
                  <div className="text-xs font-semibold text-lime-700 mb-2">WHAT WORKED</div>
                  <p className="text-neutral-700 text-sm leading-relaxed">
                    The hook at <span className="font-mono text-neutral-950 bg-white border border-neutral-200 px-1 rounded text-xs">0:45</span> is instantly memorable — I caught myself humming it after.
                  </p>
                </div>
                <div className="bg-[#f7f7f5] p-4 border border-neutral-200">
                  <div className="text-xs font-semibold text-orange-700 mb-2">TO IMPROVE</div>
                  <p className="text-neutral-700 text-sm leading-relaxed">
                    Intro feels too long — I&apos;d cut 8-12 seconds to get to the action faster.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-1.5 rounded-full bg-lime-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  <span className="text-[10px] text-neutral-500 ml-1">+15 more</span>
                </div>
                <span className="text-xs font-semibold text-lime-700 flex items-center gap-1 cursor-pointer hover:text-lime-800">
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
