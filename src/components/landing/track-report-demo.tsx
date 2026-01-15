"use client";

import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Music, Play } from "lucide-react";

type Tab = "consensus" | "reviews";

export function TrackReportDemo() {
  const [activeTab, setActiveTab] = useState<Tab>("consensus");

  return (
    <div className="bg-neutral-900 border-2 border-black shadow-[8px_8px_0px_0px_rgba(132,204,22,0.4)]">
      {/* Browser Chrome */}
      <div className="bg-black px-4 py-3 border-b-2 border-neutral-800 flex items-center gap-3">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-neutral-700" />
          <div className="w-3 h-3 rounded-full bg-neutral-700" />
          <div className="w-3 h-3 rounded-full bg-neutral-700" />
        </div>
        <div className="flex-1 bg-neutral-800 rounded px-3 py-1 ml-2">
          <span className="text-xs text-neutral-500 font-mono">mixreflect.com/tracks/midnight-drive/report</span>
        </div>
      </div>

      {/* Track Header with Waveform */}
      <div className="bg-black/80 border-b border-neutral-800 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 sm:flex-shrink-0">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-black flex-shrink-0 group cursor-pointer">
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-5 w-5 sm:h-6 sm:w-6 text-white fill-white" />
              </div>
              <Music className="h-5 w-5 sm:h-7 sm:w-7 text-white/80 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:opacity-0 transition-opacity" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-white text-sm sm:text-lg truncate">Midnight Drive</h4>
              <p className="text-xs sm:text-sm text-neutral-400">by <span className="text-white">You</span> • <span className="text-orange-400 font-bold">Electronic</span></p>
            </div>
            <div className="flex-shrink-0 bg-lime-500 border-2 border-black px-2 sm:px-3 py-1 sm:py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-lg sm:text-2xl font-black text-black leading-none">20</div>
              <div className="text-[8px] sm:text-[10px] font-bold text-black/70 uppercase tracking-wide">Reviews</div>
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
                  className="flex-1 bg-lime-500 rounded-sm"
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

      {/* Tabs */}
      <div className="flex border-b-2 border-neutral-800">
        <button
          onClick={() => setActiveTab("consensus")}
          className={`flex-1 px-4 py-3 sm:py-4 text-left transition-colors ${
            activeTab === "consensus"
              ? "bg-lime-500 text-black border-r-2 border-black"
              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-r border-neutral-700"
          }`}
        >
          <div className="font-black text-sm sm:text-base">What Patterns Emerged</div>
          <div className={`text-xs mt-0.5 ${activeTab === "consensus" ? "text-black/70" : "text-neutral-500"}`}>
            See what 20 reviewers agreed on
          </div>
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`flex-1 px-4 py-3 sm:py-4 text-left transition-colors ${
            activeTab === "reviews"
              ? "bg-lime-500 text-black"
              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          }`}
        >
          <div className="font-black text-sm sm:text-base">Individual Reviews</div>
          <div className={`text-xs mt-0.5 ${activeTab === "reviews" ? "text-black/70" : "text-neutral-500"}`}>
            Read detailed feedback from each
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-5 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Subtle background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-lime-500/[0.07] rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-400/[0.05] rounded-full blur-3xl" />
        </div>

        <div className="relative">
          {/* Consensus Tab */}
          {activeTab === "consensus" && (
            <div className="space-y-4">
              {/* What's Working */}
              <div className="bg-lime-500/10 border border-lime-500/30 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 bg-lime-500" />
                  <span className="text-xs font-black text-lime-500">WHAT&apos;S WORKING</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-black bg-lime-500 text-black px-2 py-1 whitespace-nowrap">15 of 20</span>
                    <div>
                      <div className="font-bold text-sm text-white">Hook hits hard at 0:45</div>
                      <div className="text-xs text-neutral-500">Melody lands, drums feel confident</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-black bg-lime-500/70 text-black px-2 py-1 whitespace-nowrap">12 of 20</span>
                    <div>
                      <div className="font-bold text-sm text-white">Breakdown feels fresh at 2:15</div>
                      <div className="text-xs text-neutral-500">Nice contrast, keeps attention</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What to Improve */}
              <div className="bg-orange-400/10 border border-orange-400/30 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 bg-orange-400" />
                  <span className="text-xs font-black text-orange-400">WHAT TO IMPROVE</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-black bg-orange-400 text-black px-2 py-1 whitespace-nowrap">14 of 20</span>
                    <div>
                      <div className="font-bold text-sm text-white">Intro too long</div>
                      <div className="text-xs text-neutral-500">Hook should arrive sooner</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-black bg-orange-400/70 text-black px-2 py-1 whitespace-nowrap">10 of 20</span>
                    <div>
                      <div className="font-bold text-sm text-white">Vocal too loud at 1:30</div>
                      <div className="text-xs text-neutral-500">Clashes with the lead synth</div>
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
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-700">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-400">Review</span>
                  <div className="flex items-center gap-1 bg-lime-500 text-black px-2.5 py-1 font-mono text-xs font-bold">
                    <span>1</span>
                    <span className="text-black/50">/</span>
                    <span>20</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="h-8 w-8 flex items-center justify-center border border-neutral-600 bg-neutral-700 text-neutral-500 cursor-not-allowed">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button className="h-8 w-8 flex items-center justify-center border border-neutral-600 bg-neutral-700 hover:bg-lime-500 hover:border-lime-500 hover:text-black text-white transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Review Content */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-lime-500 flex items-center justify-center font-black text-black">S</div>
                <div className="flex-1">
                  <div className="font-black text-white">Sarah</div>
                  <div className="text-xs text-neutral-500">Electronic fan • 4.2/5 rating</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black bg-lime-500/20 text-lime-400 px-2 py-1">Would replay</span>
                  <span className="hidden sm:inline text-xs font-black bg-lime-500/20 text-lime-400 px-2 py-1">Would playlist</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-black/30 p-4 border border-neutral-700/50">
                  <div className="text-xs font-black text-lime-500 mb-2">WHAT WORKED</div>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    The hook at <span className="font-mono text-white bg-neutral-800 px-1 rounded text-xs">0:45</span> is instantly memorable — I caught myself humming it after.
                  </p>
                </div>
                <div className="bg-black/30 p-4 border border-neutral-700/50">
                  <div className="text-xs font-black text-orange-400 mb-2">TO IMPROVE</div>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    Intro feels too long — I&apos;d cut 8-12 seconds to get to the action faster.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-700">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-1.5 rounded-full bg-lime-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                  <span className="text-[10px] text-neutral-600 ml-1">+15 more</span>
                </div>
                <span className="text-xs font-bold text-lime-500 flex items-center gap-1 cursor-pointer hover:text-lime-400">
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
