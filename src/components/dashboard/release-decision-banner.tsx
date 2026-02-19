"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, FileText, Check, Clock, Zap } from "lucide-react";

export function ReleaseDecisionBanner() {
  return (
    <section className="bg-neutral-900 text-neutral-50 overflow-hidden rounded-2xl mb-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
      <Link href="/submit?package=release-decision" className="block group">
        <div className="px-5 sm:px-7 py-6 sm:py-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] items-center">

            {/* ── Left: Copy ── */}
            <div className="max-w-lg">

              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <Target className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
                  Release Decision Report
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
                Is your track ready to release?{" "}
                <span className="text-purple-400">Get a verdict.</span>
              </h2>

              {/* Body */}
              <p className="text-sm text-neutral-400 leading-relaxed mb-4">
                Stop guessing. A panel of 10–12 expert reviewers analyzes your track and delivers a{" "}
                <strong className="text-neutral-200">PDF report</strong> with a Go/No-Go verdict,
                readiness score, and your top fixes — sent to your inbox in 24 hours.
              </p>

              {/* Bullets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-5">
                {[
                  "Go / No-Go verdict",
                  "Readiness score 0–100",
                  "Top 3 fixes by impact",
                  "PDF emailed in 24 hrs",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-neutral-300">
                    <Check className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                    <span className="text-[13px]">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button className="bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 ease-out h-11">
                Get Started · $9.95
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* ── Right: Mini Report Preview ── */}
            <div className="lg:w-[260px] xl:w-[290px] flex-shrink-0">
              <div className="relative bg-neutral-800 border border-neutral-700/70 rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_40px_rgba(0,0,0,0.5)]">

                {/* Report header bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700/60">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-neutral-500" />
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Sample Report</span>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-600">mixreflect.com</span>
                </div>

                <div className="p-4 space-y-4">

                  {/* Verdict */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Expert Panel Verdict</p>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wide">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Release
                      </span>
                      <div className="text-right">
                        <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Consensus</p>
                        <p className="text-xs font-bold text-neutral-300">9 of 11 reviewers</p>
                      </div>
                    </div>
                  </div>

                  {/* Readiness Score */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Readiness Score</p>
                      <p className="text-base font-black text-white leading-none">
                        74<span className="text-neutral-500 text-xs font-medium">/100</span>
                      </p>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-700 overflow-hidden">
                      <div className="h-full w-[74%] rounded-full bg-gradient-to-r from-purple-600 to-purple-400" />
                    </div>
                  </div>

                  {/* Priority Fixes */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Priority Fixes</p>
                    <div className="space-y-2">
                      {[
                        { label: "Low-end clarity", impact: "HIGH IMPACT", time: "~2h" },
                        { label: "Stereo width on chorus", impact: "MED IMPACT", time: "~1h" },
                      ].map((fix) => (
                        <div key={fix.label} className="flex items-start gap-2.5">
                          <span className="flex-shrink-0 h-4 w-4 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mt-0.5">
                            <Zap className="h-2.5 w-2.5 text-amber-400" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-neutral-200 leading-tight">{fix.label}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] text-neutral-500 bg-neutral-700/60 px-1.5 py-0.5 rounded">{fix.impact}</span>
                              <span className="text-[9px] text-neutral-600 flex items-center gap-0.5">
                                <Clock className="h-2 w-2" />{fix.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/50 border-t border-neutral-700/50">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-purple-400" />
                    <span className="text-[10px] text-purple-400 font-semibold">PDF Report</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Delivered in 24hrs
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Link>
    </section>
  );
}
