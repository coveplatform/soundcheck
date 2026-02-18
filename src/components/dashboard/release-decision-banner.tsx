"use client";

import Link from "next/link";
import { Caveat } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight } from "lucide-react";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

export function ReleaseDecisionBanner() {
  return (
    <section className="pb-6 pt-0 bg-neutral-900 text-neutral-50 overflow-hidden rounded-2xl mb-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
      {/* Scrolling "new" marquee */}
      <div className="w-full overflow-hidden bg-purple-400/10 border-b-2 border-purple-400/20">
        <div className="h-10 flex items-center">
          <div
            className={`${caveat.className} w-full flex gap-6 whitespace-nowrap text-purple-300 text-2xl font-bold leading-none`}
            style={{
              animation: 'marquee 20s linear infinite',
            }}
          >
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={i}>new</span>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <Link href="/submit" className="block group">
        <div className="px-6 py-6">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] items-center">
            {/* Left content */}
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-purple-600/20 border-2 border-purple-400/40 flex items-center justify-center flex-shrink-0 backdrop-blur-sm group-hover:scale-110 transition-transform duration-150">
                  <Target className="h-6 w-6 text-purple-300" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Release Decision</h2>
              </div>
              <p className="text-neutral-300 leading-relaxed">
                <strong className="text-white">Should you release this track?</strong> Get an expert panel verdict + AI-powered analysis. Clear Go/No-Go decision with top 3 actionable fixes delivered in 24 hours.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Button
                  className="bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 ease-out h-11"
                >
                  Get Started • $9.95
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Right badge */}
            <div className="hidden md:block">
              <div className="bg-neutral-800 border-2 border-neutral-700 rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] min-w-[200px]">
                <div className="text-center">
                  <div className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-2">Delivered in</div>
                  <div className="text-4xl font-black text-purple-400">24hrs</div>
                  <div className="text-xs text-neutral-500 mt-2">Expert panel + AI analysis</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
