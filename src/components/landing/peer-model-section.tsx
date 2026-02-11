"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Headphones, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
      className="relative py-20 sm:py-28 bg-neutral-950 text-white overflow-hidden"
    >
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />

      <div className="relative max-w-5xl mx-auto px-4">
        {/* Big statement */}
        <div
          className={cn(
            "text-center transition-all duration-700 ease-out",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <p className="text-sm font-mono tracking-[0.25em] uppercase text-purple-400 mb-6">
            How MixReflect is different
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
            You review others.<br />
            <span className="text-purple-400">Others review you.</span>
          </h2>
          <p className="mt-6 text-lg text-white/50 max-w-lg mx-auto">
            No hired reviewers. No algorithms. Just artists in your genre with real ears and real opinions.
          </p>
        </div>

        {/* The cycle — visual, not a wall of text */}
        <div
          className={cn(
            "mt-16 sm:mt-20 transition-all duration-700 ease-out delay-200",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {/* Desktop: horizontal flow */}
          <div className="hidden sm:flex items-center justify-center gap-0">
            {/* Step 1 */}
            <div className="flex-1 max-w-[220px]">
              <div className="relative group">
                <div className="h-20 w-20 mx-auto rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-105">
                  <Upload className="h-8 w-8 text-purple-400" />
                </div>
                <p className="mt-4 text-center text-sm font-bold text-white">You upload a track</p>
                <p className="mt-1 text-center text-xs text-white/40">Uses 1 credit</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="px-2 sm:px-4">
              <ArrowRight className="h-5 w-5 text-purple-500/50" />
            </div>

            {/* Step 2 */}
            <div className="flex-1 max-w-[220px]">
              <div className="relative group">
                <div className="h-20 w-20 mx-auto rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-105">
                  <Headphones className="h-8 w-8 text-white/70" />
                </div>
                <p className="mt-4 text-center text-sm font-bold text-white">Artists review your track</p>
                <p className="mt-1 text-center text-xs text-white/40">Genre-matched peers</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="px-2 sm:px-4">
              <ArrowRight className="h-5 w-5 text-purple-500/50" />
            </div>

            {/* Step 3 */}
            <div className="flex-1 max-w-[220px]">
              <div className="relative group">
                <div className="h-20 w-20 mx-auto rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-105">
                  <MessageSquare className="h-8 w-8 text-purple-400" />
                </div>
                <p className="mt-4 text-center text-sm font-bold text-white">You get structured feedback</p>
                <p className="mt-1 text-center text-xs text-white/40">Scores, notes, timestamps</p>
              </div>
            </div>
          </div>

          {/* Mobile: vertical flow */}
          <div className="flex sm:hidden flex-col items-center gap-4">
            {[
              { icon: Upload, label: "You upload a track", sub: "Uses 1 credit", accent: true },
              { icon: Headphones, label: "Artists review your track", sub: "Genre-matched peers", accent: false },
              { icon: MessageSquare, label: "You get structured feedback", sub: "Scores, notes, timestamps", accent: true },
            ].map((step, i) => (
              <div key={step.label} className="flex flex-col items-center">
                {i > 0 && (
                  <div className="h-6 w-px bg-purple-500/30 mb-4" />
                )}
                <div
                  className={cn(
                    "h-14 w-14 rounded-xl flex items-center justify-center",
                    step.accent
                      ? "bg-purple-500/20 border border-purple-500/30"
                      : "bg-white/10 border border-white/20"
                  )}
                >
                  <step.icon className={cn("h-6 w-6", step.accent ? "text-purple-400" : "text-white/70")} />
                </div>
                <p className="mt-2 text-sm font-bold text-white text-center">{step.label}</p>
                <p className="text-xs text-white/40 text-center">{step.sub}</p>
              </div>
            ))}
          </div>

          {/* The loop back — visual connection */}
          <div className="mt-10 sm:mt-12 flex justify-center">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2.5 backdrop-blur-sm">
              <div className="flex -space-x-1.5">
                <div className="h-5 w-5 rounded-full bg-purple-500 ring-2 ring-neutral-950" />
                <div className="h-5 w-5 rounded-full bg-white/40 ring-2 ring-neutral-950" />
                <div className="h-5 w-5 rounded-full bg-purple-500 ring-2 ring-neutral-950" />
              </div>
              <span className="text-xs font-semibold text-white/60">
                Review others to earn credits — then spend them on your tracks
              </span>
            </div>
          </div>
        </div>

        {/* Trust signals — compact, not wordy */}
        <div
          className={cn(
            "mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 transition-all duration-700 ease-out delay-300",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {[
            {
              stat: "100%",
              label: "peer-to-peer",
              detail: "Every reviewer is an artist too",
            },
            {
              stat: "Genre",
              label: "matched",
              detail: "Your hip-hop track won't go to a metal producer",
            },
            {
              stat: "Rated",
              label: "reviewers",
              detail: "Bad feedback = restricted access",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="text-center sm:text-left px-4 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
            >
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {item.stat} <span className="text-purple-400">{item.label}</span>
              </p>
              <p className="mt-1 text-sm text-white/40">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
