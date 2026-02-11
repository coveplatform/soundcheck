"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Headphones, MessageSquare, Shield, Users, Disc3 } from "lucide-react";
import { Caveat } from "next/font/google";
import { cn } from "@/lib/utils";
import { Sparkle, Squiggle } from "@/components/landing/doodles";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.25) {
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
  const sectionRef = useRef<HTMLDivElement>(null);
  const visible = useInView(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="relative py-16 sm:py-24 bg-[#faf8f5] overflow-visible"
    >
      <div className="max-w-5xl mx-auto px-4">
        {/* Heading */}
        <div
          className={cn(
            "max-w-2xl transition-all duration-700 ease-out",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
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

        {/* The two roles — bold colored cards */}
        <div
          className={cn(
            "mt-12 sm:mt-16 relative transition-all duration-700 ease-out delay-150",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* Doodle accents */}
          <Sparkle className="pointer-events-none absolute -top-8 right-4 sm:right-12 w-10 h-10 sm:w-14 sm:h-14 text-orange-400 opacity-80 rotate-12" />
          <Squiggle className="pointer-events-none absolute -bottom-8 left-2 sm:left-8 w-24 h-7 sm:w-32 sm:h-9 text-purple-400 opacity-50 -rotate-2" />

          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            {/* You as artist — purple */}
            <div className="relative bg-gradient-to-br from-purple-600 to-purple-700 border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white">
              <span className={`${caveat.className} absolute -top-4 right-6 bg-white text-purple-700 px-4 py-1 rounded-full text-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                You, the artist
              </span>
              <div className="mt-3 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-[15px]">Upload your track</p>
                    <p className="text-sm text-white/70 mt-0.5">Link your SoundCloud, Bandcamp, or upload directly</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-[15px]">Get structured feedback</p>
                    <p className="text-sm text-white/70 mt-0.5">Scores, written notes, timestamp markers — from multiple reviewers</p>
                  </div>
                </div>
              </div>
            </div>

            {/* You as reviewer — warm orange */}
            <div className="relative bg-gradient-to-br from-orange-400 to-orange-500 border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black">
              <span className={`${caveat.className} absolute -top-4 right-6 bg-white text-orange-700 px-4 py-1 rounded-full text-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                You, the reviewer
              </span>
              <div className="mt-3 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-black/10 flex items-center justify-center flex-shrink-0">
                    <Headphones className="h-6 w-6 text-black/80" />
                  </div>
                  <div>
                    <p className="font-bold text-black text-[15px]">Listen to tracks in your genre</p>
                    <p className="text-sm text-black/60 mt-0.5">We match you with music you actually understand</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-black/10 flex items-center justify-center flex-shrink-0">
                    <Disc3 className="h-6 w-6 text-black/80" />
                  </div>
                  <div>
                    <p className="font-bold text-black text-[15px]">Earn a credit for each review</p>
                    <p className="text-sm text-black/60 mt-0.5">Spend credits to get feedback on your own tracks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connecting statement — bold, high-contrast */}
          <div className="mt-10 flex justify-center">
            <div className="relative inline-flex items-center gap-3 bg-black text-white rounded-full px-7 py-3.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(124,58,237,1)]">
              <span className={`${caveat.className} text-2xl text-purple-300 leading-none`}>↻</span>
              <span className="text-sm sm:text-base font-black tracking-tight">
                Same person, two roles — that&apos;s what keeps it honest
              </span>
            </div>
          </div>
        </div>

        {/* Trust signals — bold colored backgrounds, not white boxes */}
        <div
          className={cn(
            "mt-14 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 transition-all duration-700 ease-out delay-300",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <div className="bg-purple-100 border-2 border-purple-300 rounded-2xl p-5 sm:p-6">
            <div className="h-11 w-11 rounded-xl bg-purple-600 flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-white" />
            </div>
            <p className="font-black text-purple-900 text-base">100% peer-to-peer</p>
            <p className="text-sm text-purple-700/70 mt-1">Every reviewer is a producer too — they have skin in the game</p>
          </div>

          <div className="bg-orange-100 border-2 border-orange-300 rounded-2xl p-5 sm:p-6">
            <div className="h-11 w-11 rounded-xl bg-orange-500 flex items-center justify-center mb-3">
              <Disc3 className="h-5 w-5 text-white" />
            </div>
            <p className="font-black text-orange-900 text-base">Genre-matched</p>
            <p className="text-sm text-orange-700/70 mt-1">Your hip-hop track goes to hip-hop producers, not metal guitarists</p>
          </div>

          <div className="bg-neutral-900 border-2 border-black rounded-2xl p-5 sm:p-6">
            <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center mb-3">
              <Shield className="h-5 w-5 text-neutral-900" />
            </div>
            <p className="font-black text-white text-base">Quality-rated</p>
            <p className="text-sm text-neutral-400 mt-1">Artists rate every review — lazy feedback gets you restricted</p>
          </div>
        </div>
      </div>
    </section>
  );
}
