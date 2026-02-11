"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, MessageSquare, Shield, Disc3, ArrowUpRight } from "lucide-react";
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

export function PeerModelSection() {
  const ref = useRef<HTMLDivElement>(null);
  const v = useInView(ref);

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-[#faf8f5] overflow-hidden">
      <div className="max-w-5xl mx-auto px-4">

        {/* Bento grid */}
        <div
          className={cn(
            "grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 auto-rows-auto transition-all duration-700 ease-out",
            v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          {/* ── Row 1 ── */}

          {/* Big statement tile — spans 2 cols */}
          <div className="col-span-2 bg-neutral-950 text-white border-2 border-black rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="relative z-10">
              <p className={`${caveat.className} text-purple-400 text-xl mb-2`}>how it works</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-[1.1]">
                You review others.<br />
                Others review{" "}
                <span className="text-purple-400">you.</span>
              </h2>
            </div>
            {/* Decorative circle */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full border-[3px] border-purple-500/20" />
            <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full border-[3px] border-purple-500/10" />
          </div>

          {/* Cycle visual tile */}
          <div className="col-span-1 bg-purple-600 border-2 border-black rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-5xl sm:text-6xl font-black text-white leading-none">↻</div>
            <p className="text-xs font-bold text-white/80 mt-2 uppercase tracking-wider">Give one</p>
            <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Get one</p>
          </div>

          {/* Genre-matched tile */}
          <div className="col-span-1 bg-orange-400 border-2 border-black rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Disc3 className="h-7 w-7 text-black/70" />
            <div className="mt-4">
              <p className="font-black text-black text-lg leading-tight">Genre-matched</p>
              <p className="text-xs text-black/60 mt-1">Hip-hop → hip-hop producers</p>
            </div>
          </div>

          {/* ── Row 2 ── */}

          {/* 100% peer stat */}
          <div className="col-span-1 bg-purple-100 border-2 border-purple-300 rounded-2xl p-5 sm:p-6 flex flex-col justify-center">
            <p className="text-4xl sm:text-5xl font-black text-purple-700 leading-none tracking-tighter">100%</p>
            <p className="text-sm font-bold text-purple-600 mt-1">peer-to-peer</p>
          </div>

          {/* Subtext tile — spans 2 cols */}
          <div className="col-span-2 bg-white border-2 border-neutral-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-center">
            <p className="text-neutral-950 text-base sm:text-lg font-bold leading-snug">
              No hired reviewers. No bots. No algorithms.<br className="hidden sm:block" />
              <span className="text-neutral-400">Just artists with real ears and real opinions.</span>
            </p>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex -space-x-2">
                <div className="h-7 w-7 rounded-full bg-purple-500 border-2 border-white" />
                <div className="h-7 w-7 rounded-full bg-orange-400 border-2 border-white" />
                <div className="h-7 w-7 rounded-full bg-neutral-800 border-2 border-white" />
              </div>
              <span className="text-xs text-neutral-400 font-semibold">Same person, both roles</span>
            </div>
          </div>

          {/* Quality rated tile */}
          <div className="col-span-1 bg-neutral-900 border-2 border-black rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
            <Shield className="h-7 w-7 text-white/80" />
            <div className="mt-4">
              <p className="font-black text-white text-lg leading-tight">Rated</p>
              <p className="text-xs text-neutral-500 mt-1">Bad reviews = restricted</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
