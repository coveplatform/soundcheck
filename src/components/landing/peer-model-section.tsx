"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Headphones, MessageSquare, Star } from "lucide-react";
import { Caveat } from "next/font/google";
import { cn } from "@/lib/utils";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.15) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return inView;
}

/* Hand-drawn wobbly arrow SVG */
function DoodleArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 24" fill="none" className={className}>
      <path
        d="M4 14C12 10 22 8 32 9C42 10 52 13 62 11C67 10 72 8 76 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M70 2L77 6L70 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Hand-drawn curved return arrow */
function DoodleCurveArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className}>
      <path
        d="M10 50C20 10 50 -5 80 10C95 18 105 35 110 50"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 4"
      />
      <path d="M105 44L111 52L103 54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Tiny scribble circle doodle */
function ScribbleCircle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M20 5C28 4 36 10 37 20C38 30 30 37 20 36C10 35 3 28 4 18C5 10 12 6 20 5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* Tiny star burst */
function TinyStarburst({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M16 4L17.5 13.5L16 10L14.5 13.5Z" fill="currentColor" />
      <path d="M16 4V12M16 20V28M4 16H12M20 16H28M7 7L13 13M19 19L25 25M25 7L19 13M13 19L7 25"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PeerModelSection() {
  const ref = useRef<HTMLDivElement>(null);
  const v = useInView(ref);

  return (
    <section ref={ref} className="relative py-16 sm:py-24 bg-[#faf8f5] overflow-visible">
      <div className="max-w-5xl mx-auto px-4">
        {/* Heading — original text restored */}
        <div
          className={cn(
            "max-w-2xl transition-all duration-700 ease-out",
            v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950 leading-[1.1]">
            Not a marketplace.<br />
            A community that{" "}
            <span className="relative inline-block">
              <span className="relative z-10">actually works</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-purple-200/60 -rotate-[0.5deg] z-0" />
            </span>
          </h2>
          <p className="mt-5 text-neutral-600 text-lg max-w-xl">
            No hired reviewers. No bots. Just artists in your genre — listening, scoring, and writing real feedback. You do the same for them.
          </p>
        </div>

        {/* The diagram — hand-drawn style flow */}
        <div
          className={cn(
            "mt-14 sm:mt-20 relative transition-all duration-700 ease-out delay-200",
            v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {/* Scattered doodles — loose, irregular placement */}
          <TinyStarburst className="pointer-events-none absolute -top-6 right-[15%] w-8 h-8 text-purple-400 opacity-70 rotate-[20deg]" />
          <ScribbleCircle className="pointer-events-none absolute top-[10%] -left-4 sm:-left-8 w-12 h-12 text-orange-300 opacity-50 -rotate-[15deg]" />
          <TinyStarburst className="pointer-events-none absolute bottom-[20%] right-[5%] sm:right-[8%] w-6 h-6 text-neutral-400 opacity-60 rotate-[45deg]" />
          <ScribbleCircle className="pointer-events-none absolute -bottom-4 left-[30%] w-10 h-10 text-purple-300 opacity-40 rotate-[25deg]" />
          <TinyStarburst className="pointer-events-none absolute top-[40%] -right-2 sm:-right-6 w-10 h-10 text-orange-400 opacity-50 -rotate-[10deg]" />

          {/* Main diagram area */}
          <div className="relative max-w-3xl mx-auto">

            {/* Three nodes in a row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-start">

              {/* Node 1: Upload */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 bg-purple-600 border-2 border-black rounded-2xl sm:rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-[-2deg]">
                    <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <span className={`${caveat.className} absolute -top-6 -right-2 sm:-right-4 text-purple-600 text-lg sm:text-2xl rotate-[8deg] whitespace-nowrap`}>
                    1 credit
                  </span>
                </div>
                <p className="font-black text-neutral-950 text-xs sm:text-sm mt-3">Upload</p>
                <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">Your track</p>
              </div>

              {/* Node 2: Review */}
              <div className="flex flex-col items-center text-center mt-6 sm:mt-8">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 bg-orange-400 border-2 border-black rounded-2xl sm:rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-[3deg]">
                    <Headphones className="h-8 w-8 sm:h-10 sm:w-10 text-black/80" />
                  </div>
                  <span className={`${caveat.className} absolute -bottom-6 sm:-bottom-7 left-1/2 -translate-x-1/2 text-orange-600 text-lg sm:text-2xl -rotate-[4deg] whitespace-nowrap`}>
                    genre-matched
                  </span>
                </div>
                <p className="font-black text-neutral-950 text-xs sm:text-sm mt-8 sm:mt-9">Peers review it</p>
                <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">Real artists, your genre</p>
              </div>

              {/* Node 3: Feedback */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 bg-neutral-950 border-2 border-black rounded-2xl sm:rounded-3xl shadow-[4px_4px_0px_0px_rgba(124,58,237,0.5)] flex items-center justify-center rotate-[-1deg]">
                    <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <span className={`${caveat.className} absolute -top-6 -left-4 sm:-left-8 text-neutral-600 text-lg sm:text-2xl rotate-[-6deg] whitespace-nowrap`}>
                    scores + notes
                  </span>
                </div>
                <p className="font-black text-neutral-950 text-xs sm:text-sm mt-3">Get feedback</p>
                <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">Patterns emerge</p>
              </div>
            </div>

            {/* Connecting arrows — hand-drawn style */}
            <div className="absolute top-10 sm:top-14 left-[20%] right-[20%] pointer-events-none hidden sm:block">
              {/* Arrow 1→2 */}
              <DoodleArrow className="absolute left-0 top-0 w-24 md:w-32 text-neutral-400 rotate-[6deg]" />
              {/* Arrow 2→3 */}
              <DoodleArrow className="absolute right-0 top-2 w-24 md:w-32 text-neutral-400 -rotate-[4deg]" />
            </div>

            {/* Return loop arrow — dashed curve going back */}
            <div className="hidden sm:block absolute -bottom-2 left-[15%] right-[15%] pointer-events-none">
              <DoodleCurveArrow className="w-full h-14 text-purple-400/60 rotate-180" />
            </div>

            {/* Loop label */}
            <div className="mt-8 sm:mt-6 flex justify-center">
              <div className="inline-flex items-center gap-2.5 bg-white border-2 border-neutral-200 rounded-full px-5 py-2.5 shadow-sm">
                <span className={`${caveat.className} text-xl text-purple-600`}>↻</span>
                <span className="text-sm font-bold text-neutral-700">
                  Review others to earn credits
                </span>
                <span className="text-sm text-neutral-400">— then spend them</span>
              </div>
            </div>

            {/* Bottom trust badges — small, punchy, scattered feel */}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <span className="bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-full rotate-[-1deg]">
                100% peer-to-peer
              </span>
              <span className="bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold px-3 py-1.5 rounded-full rotate-[2deg]">
                Genre-matched
              </span>
              <span className="bg-neutral-900 border border-black text-white text-xs font-bold px-3 py-1.5 rounded-full rotate-[-1.5deg]">
                <Star className="inline h-3 w-3 mr-1 fill-white" />Reviewers rated
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
