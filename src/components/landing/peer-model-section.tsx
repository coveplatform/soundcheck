"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Headphones, MessageSquare, ArrowDown, Shield, Users, Disc3 } from "lucide-react";
import { Caveat } from "next/font/google";
import { cn } from "@/lib/utils";
import { Sparkle, Squiggle } from "@/components/landing/doodles";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.3) {
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
        {/* Heading — left-aligned, not centered, feels editorial */}
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

        {/* The loop — visual, warm, tactile */}
        <div
          className={cn(
            "mt-12 sm:mt-16 relative transition-all duration-700 ease-out delay-150",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* Doodle accents */}
          <Sparkle className="pointer-events-none absolute -top-8 right-8 sm:right-16 w-10 h-10 sm:w-14 sm:h-14 text-purple-400 opacity-70 rotate-12" />
          <Squiggle className="pointer-events-none absolute -bottom-6 left-4 sm:left-12 w-20 h-6 sm:w-28 sm:h-8 text-orange-300 opacity-60 -rotate-3" />

          {/* The two-column exchange visual */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: You as artist */}
            <div className="bg-white border-2 border-neutral-200 rounded-2xl p-6 sm:p-8 relative">
              <span className={`${caveat.className} absolute -top-4 left-6 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-lg border border-purple-200`}>
                You, the artist
              </span>
              <div className="mt-4 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center flex-shrink-0">
                    <Upload className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-950">Upload your track</p>
                    <p className="text-sm text-neutral-500 mt-0.5">Link your SoundCloud, Bandcamp, or upload directly</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-950">Get structured feedback</p>
                    <p className="text-sm text-neutral-500 mt-0.5">Scores, written notes, timestamp markers — from multiple reviewers</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: You as reviewer */}
            <div className="bg-white border-2 border-neutral-200 rounded-2xl p-6 sm:p-8 relative">
              <span className={`${caveat.className} absolute -top-4 left-6 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-lg border border-orange-200`}>
                You, the reviewer
              </span>
              <div className="mt-4 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center flex-shrink-0">
                    <Headphones className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-950">Listen to tracks in your genre</p>
                    <p className="text-sm text-neutral-500 mt-0.5">We match you with music you actually understand</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center flex-shrink-0">
                    <Disc3 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-950">Earn a credit for each review</p>
                    <p className="text-sm text-neutral-500 mt-0.5">Spend credits to get feedback on your own tracks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connecting statement */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-3 bg-neutral-950 text-white rounded-full px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
              <span className={`${caveat.className} text-xl text-purple-300`}>↻</span>
              <span className="text-sm font-bold">
                Same person, two roles — that&apos;s what keeps feedback honest
              </span>
            </div>
          </div>
        </div>

        {/* Trust signals — horizontal, compact, tactile */}
        <div
          className={cn(
            "mt-14 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 transition-all duration-700 ease-out delay-300",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {[
            {
              icon: Users,
              title: "100% peer-to-peer",
              detail: "Every reviewer is a producer too — they have skin in the game",
              color: "bg-purple-100 border-purple-200 text-purple-600",
            },
            {
              icon: Disc3,
              title: "Genre-matched",
              detail: "Your hip-hop track goes to hip-hop producers, not metal guitarists",
              color: "bg-orange-100 border-orange-200 text-orange-600",
            },
            {
              icon: Shield,
              title: "Quality-rated",
              detail: "Artists rate every review — lazy feedback gets you restricted",
              color: "bg-neutral-100 border-neutral-200 text-neutral-600",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3.5 bg-white border-2 border-neutral-200 rounded-2xl p-5"
            >
              <div className={cn("h-10 w-10 rounded-lg border flex items-center justify-center flex-shrink-0", item.color)}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-neutral-950 text-sm">{item.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
