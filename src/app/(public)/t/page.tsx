"use client";

import { useMemo } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  ArrowRight,
  ListMusic,
  Share2,
  Star,
} from "lucide-react";

export default function TrialLandingPage() {
  const Donut = useMemo(() => {
    return function Donut({ percent, label, color }: { percent: number; label: string; color: string }) {
      const size = 112;
      const stroke = 12;
      const r = (size - stroke) / 2;
      const c = 2 * Math.PI * r;
      const p = Math.max(0, Math.min(100, percent));
      const dash = (p / 100) * c;

      return (
        <div className="border-2 border-black bg-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xs font-black text-neutral-400">{label}</div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle cx={size / 2} cy={size / 2} r={r} stroke="#262626" strokeWidth={stroke} fill="none" />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={color}
                strokeWidth={stroke}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${c - dash}`}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
              <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="900">
                {Math.round(p)}%
              </text>
            </svg>
            <div className="min-w-0">
              <div className="text-xl font-black">{Math.round(p)}%</div>
              <div className="text-sm text-neutral-300">of listeners</div>
            </div>
          </div>
        </div>
      );
    };
  }, []);

  const Line = useMemo(() => {
    return function Line({ points, label }: { points: number[]; label: string }) {
      const w = 520;
      const h = 140;
      const padding = 16;
      const max = Math.max(...points, 1);
      const min = Math.min(...points, 0);
      const range = Math.max(max - min, 1);
      const step = (w - padding * 2) / Math.max(points.length - 1, 1);
      const d = points
        .map((v, i) => {
          const x = padding + i * step;
          const y = padding + (h - padding * 2) * (1 - (v - min) / range);
          return `${x},${y}`;
        })
        .join(" ");

      return (
        <div className="border-2 border-black bg-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xs font-black text-neutral-400">{label}</div>
          <div className="mt-3 overflow-x-auto">
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
              <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke="#262626" strokeWidth="2" />
              <polyline points={d} fill="none" stroke="#fb923c" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={d} fill="none" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
            </svg>
          </div>
          <div className="mt-3 text-sm text-neutral-300">
            See where attention drops. Fix the moment that loses people.
          </div>
        </div>
      );
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-white">
      <header className="border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="text-white" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <section className="text-center">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">
            Get <span className="text-lime-500">real listener feedback</span> on your tracks.
          </h1>
          <p className="mt-5 text-neutral-300 text-base sm:text-lg max-w-2xl mx-auto">
            5–20 genre-matched listeners leave structured reviews with timestamps. We highlight the patterns so you know what to change.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup?callbackUrl=%2Fartist%2Fonboarding">
              <Button
                className="w-full sm:w-auto h-11 text-base font-black bg-lime-500 text-black border-2 border-lime-500 hover:bg-lime-400"
              >
                Start trial
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-14 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-orange-400 text-black border-y-2 border-black py-12">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              See exactly what you&apos;ll get.
            </h2>
            <p className="mt-3 text-base sm:text-lg font-bold max-w-2xl mx-auto">
              Clear visuals + real reviews — so you know what to change.
            </p>
          </div>
        </section>

        <section id="examples" className="mt-14 space-y-10">
          <div className="border-2 border-black bg-neutral-900 shadow-[6px_6px_0px_0px_rgba(251,146,60,1)]">
            <div className="p-6 sm:p-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <div className="text-xs font-black text-neutral-400">ANALYTICS</div>
                  <h3 className="mt-2 text-2xl sm:text-3xl font-black">
                    Find the moment listeners drop off.
                  </h3>
                  <p className="mt-3 text-neutral-300 max-w-2xl">
                    A simple timeline makes it obvious where attention dips — so you can fix the exact section.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-3 py-1 border-2 border-black bg-lime-500 text-black font-black">
                    Example
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <Line points={[95, 88, 76, 40, 52, 70, 82, 78, 84]} label="ENGAGEMENT OVER TIME" />
              </div>
            </div>
          </div>

          <div className="border-2 border-black bg-neutral-900 shadow-[6px_6px_0px_0px_rgba(132,204,22,1)]">
            <div className="p-6 sm:p-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <div className="text-xs font-black text-neutral-400">ANALYTICS</div>
                  <h3 className="mt-2 text-2xl sm:text-3xl font-black">
                    See if it&apos;s replay-worthy.
                  </h3>
                  <p className="mt-3 text-neutral-300 max-w-2xl">
                    Donut charts show intent at a glance — replay, playlist, share.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid md:grid-cols-3 gap-4">
                <Donut percent={83} label="WOULD LISTEN AGAIN" color="#84cc16" />
                <Donut percent={67} label="WOULD PLAYLIST" color="#fb923c" />
                <Donut percent={52} label="WOULD SHARE" color="#38bdf8" />
              </div>
            </div>
          </div>

          <div className="border-2 border-black bg-neutral-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-6 sm:p-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <div className="text-xs font-black text-neutral-400">REVIEWS</div>
                  <h3 className="mt-2 text-2xl sm:text-3xl font-black">
                    Get a clean, structured review.
                  </h3>
                  <p className="mt-3 text-neutral-300 max-w-2xl">
                    Not “sounds good”. Real notes, clear sections, and timestamps.
                  </p>
                </div>
              </div>

              <div className="mt-8 border-2 border-neutral-700 bg-black">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center font-black">
                        S
                      </div>
                      <div>
                        <div className="font-black">Sarah</div>
                        <div className="text-xs text-neutral-400">Strong Hook</div>
                      </div>
                    </div>
                    <div className="text-sm font-black">4.2/5</div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-black border-2 bg-lime-50 border-lime-500 text-lime-700">
                      <ListMusic className="h-3 w-3" />
                      Would playlist
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-black border-2 bg-lime-50 border-lime-500 text-lime-700">
                      <Share2 className="h-3 w-3" />
                      Would share
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-black border-2 bg-neutral-900 border-neutral-700 text-neutral-300">
                      <Star className="h-3 w-3" />
                      Good mix
                    </span>
                  </div>

                  <div className="mt-6 grid gap-5">
                    <div>
                      <div className="text-xs font-black text-lime-500 uppercase tracking-wide mb-1">What worked</div>
                      <div className="pl-3 border-l-4 border-lime-500 text-neutral-200">
                        The hook hits hard and feels memorable. Drums feel punchy and clean.
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-red-400 uppercase tracking-wide mb-1">To improve</div>
                      <div className="pl-3 border-l-4 border-red-400 text-neutral-200">
                        Intro drags a bit — I wanted the hook earlier. Vocal sits slightly loud at 1:30.
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-purple-300 uppercase tracking-wide mb-1">Timestamps</div>
                      <div className="space-y-2">
                        <div className="pl-3 border-l-4 border-purple-400">
                          <div className="text-xs font-mono text-neutral-400">0:45</div>
                          <div className="text-neutral-200">Best moment — hook melody lands here</div>
                        </div>
                        <div className="pl-3 border-l-4 border-purple-400">
                          <div className="text-xs font-mono text-neutral-400">1:30</div>
                          <div className="text-neutral-200">Vocal a touch loud vs lead synth</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center">
            <Link href="/signup?callbackUrl=%2Fartist%2Fonboarding">
              <Button className="h-11 text-base font-black bg-lime-500 text-black border-2 border-lime-500 hover:bg-lime-400">
                Start trial
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
