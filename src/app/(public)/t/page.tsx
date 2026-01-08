"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  ArrowRight,
  ListMusic,
  Share2,
  Star,
} from "lucide-react";

type Slide = {
  title: string;
  subtitle: string;
  kind: "analytics" | "review";
};

export default function TrialLandingPage() {
  const slides: Slide[] = useMemo(
    () => [
      {
        kind: "analytics",
        title: "Pattern summary (what most listeners agree on)",
        subtitle:
          "Stop guessing. When multiple people say the same thing, you know what to fix next.",
      },
      {
        kind: "analytics",
        title: "Scores + signals (hook, replay, playlist, share)",
        subtitle:
          "Get quick clarity on what's working and what isn't — without reading a wall of text.",
      },
      {
        kind: "analytics",
        title: "Consensus-driven next actions",
        subtitle:
          "We turn repeated feedback into a short checklist so your next session is focused.",
      },
      {
        kind: "review",
        title: "Structured review with timestamps",
        subtitle:
          "Actionable notes, not vague opinions. Each reviewer gives specific improvement points.",
      },
      {
        kind: "review",
        title: "Clear strengths vs improvements",
        subtitle:
          "Reviews are broken into what worked, what to improve, and exact moments in the track.",
      },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  const safeIndex = Math.min(Math.max(index, 0), Math.max(0, slides.length - 1));
  const current = slides[safeIndex];

  useEffect(() => {
    const elements = stepRefs.current.filter(Boolean) as HTMLDivElement[];
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        const top = visible[0];
        if (!top) return;

        const nextIndex = Number((top.target as HTMLElement).dataset.index);
        if (!Number.isNaN(nextIndex)) {
          setIndex(nextIndex);
        }
      },
      {
        threshold: [0.2, 0.35, 0.5, 0.65],
        rootMargin: "-20% 0px -55% 0px",
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const Preview = ({ slide }: { slide: Slide | undefined }) => {
    if (!slide) return null;

    const Donut = ({ percent, label }: { percent: number; label: string }) => {
      const size = 96;
      const stroke = 10;
      const r = (size - stroke) / 2;
      const c = 2 * Math.PI * r;
      const p = Math.max(0, Math.min(100, percent));
      const dash = (p / 100) * c;

      return (
        <div className="flex items-center gap-3">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="#262626"
              strokeWidth={stroke}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="#84cc16"
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="18"
              fontWeight="900"
            >
              {Math.round(p)}%
            </text>
          </svg>
          <div className="min-w-0">
            <div className="text-xs font-black text-neutral-400">{label}</div>
            <div className="text-sm font-black text-white">Would listen again</div>
          </div>
        </div>
      );
    };

    const Line = ({ points, label }: { points: number[]; label: string }) => {
      const w = 260;
      const h = 90;
      const padding = 10;
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
        <div>
          <div className="text-xs font-black text-neutral-400 mb-2">{label}</div>
          <div className="border-2 border-neutral-700 bg-black p-3">
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
              <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke="#262626" strokeWidth="2" />
              <polyline
                points={d}
                fill="none"
                stroke="#fb923c"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={d}
                fill="none"
                stroke="#84cc16"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />
            </svg>
          </div>
        </div>
      );
    };

    return (
      <div className="border-2 border-black bg-neutral-900 shadow-[6px_6px_0px_0px_rgba(251,146,60,1)]">
        <div className="p-5 sm:p-7">
          <div className="min-w-0">
            <div className="text-xs font-black text-neutral-400">EXAMPLE</div>
            <div className="text-xl sm:text-2xl font-black mt-1">{slide.title}</div>
            <div className="text-neutral-300 mt-2">{slide.subtitle}</div>
            <div className="mt-3 inline-flex items-center gap-2 text-xs font-black">
              <span className="px-2 py-1 border-2 border-neutral-700 bg-black text-white">
                {safeIndex + 1}/{slides.length}
              </span>
              <span
                className={`px-2 py-1 border-2 border-black ${
                  slide.kind === "analytics" ? "bg-lime-500 text-black" : "bg-orange-400 text-black"
                }`}
              >
                {slide.kind === "analytics" ? "Analytics" : "Review"}
              </span>
            </div>
          </div>

          {slide.kind === "analytics" ? (
            <div className="mt-6 grid gap-4">
              <div className="border-2 border-neutral-700 bg-black p-4">
                <div className="text-xs font-black text-neutral-400">THE CONSENSUS</div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="border-l-4 border-lime-500 pl-3">
                    Shorten the intro (8/12)
                  </div>
                  <div className="border-l-4 border-orange-400 pl-3">
                    Hook is the strongest moment (9/12)
                  </div>
                  <div className="border-l-4 border-sky-400 pl-3">
                    Vocal sits too loud (6/12)
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border-2 border-neutral-700 bg-black p-4">
                  <div className="text-xs font-black text-neutral-400 mb-3">LISTENER SIGNAL</div>
                  <Donut percent={83} label="REPLAY" />
                </div>
                <div className="border-2 border-neutral-700 bg-black p-4">
                  <div className="text-xs font-black text-neutral-400">SCORES</div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-3xl font-black text-lime-500">4.2</div>
                      <div className="text-xs text-neutral-400">Production</div>
                    </div>
                    <div>
                      <div className="text-3xl font-black">3.7</div>
                      <div className="text-xs text-neutral-400">Originality</div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-lime-500">4.5</div>
                      <div className="text-xs text-neutral-400">Vocals</div>
                    </div>
                  </div>
                </div>
              </div>

              <Line points={[12, 18, 35, 44, 58, 72, 66, 74]} label="ENGAGEMENT (EARLY DROP-OFF VS HOOK)" />
            </div>
          ) : (
            <div className="mt-6 border-2 border-neutral-700 bg-black">
              <div className="p-5 sm:p-6">
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

                <div className="mt-5 space-y-4 text-sm">
                  <div>
                    <div className="text-xs font-black text-lime-500 uppercase tracking-wide mb-1">
                      What worked
                    </div>
                    <div className="pl-3 border-l-4 border-lime-500 text-neutral-200">
                      The hook hits hard and feels memorable. Drums feel punchy and clean.
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-red-400 uppercase tracking-wide mb-1">
                      To improve
                    </div>
                    <div className="pl-3 border-l-4 border-red-400 text-neutral-200">
                      Intro drags a bit — I wanted the hook earlier. Vocal sits slightly loud at 1:30.
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-purple-300 uppercase tracking-wide mb-1">
                      Timestamps
                    </div>
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
          )}
        </div>
      </div>
    );
  };

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

        <section id="examples" className="mt-20">
          <div className="text-center">
            <h2 className="text-2xl sm:text-4xl font-black">
              Know what to fix next (with proof)
            </h2>
            <p className="text-neutral-300 mt-3 max-w-2xl mx-auto">
              Scroll the problems. Watch the solution update.
            </p>
          </div>

          <div className="mt-10 grid md:grid-cols-2 gap-8 md:gap-10 items-start">
            <div className="md:sticky md:top-24">
              <Preview slide={current} />
            </div>

            <div className="space-y-5">
              {slides.map((s, i) => (
                <div
                  key={`${s.kind}-${s.title}`}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  data-index={i}
                  className={`border-2 border-black p-5 sm:p-6 bg-neutral-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors ${
                    safeIndex === i ? "bg-neutral-900" : "bg-neutral-950"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-black text-neutral-400">{i + 1}</div>
                      <div className="text-lg sm:text-xl font-black mt-1">{s.title}</div>
                      <div className="text-neutral-300 mt-2">{s.subtitle}</div>
                    </div>
                    <span
                      className={`flex-shrink-0 px-2 py-1 border-2 border-black text-xs font-black ${
                        s.kind === "analytics" ? "bg-lime-500 text-black" : "bg-orange-400 text-black"
                      }`}
                    >
                      {s.kind === "analytics" ? "Analytics" : "Review"}
                    </span>
                  </div>

                  <div className="mt-4">
                    <Button
                      type="button"
                      className="bg-white text-black border-2 border-black hover:bg-neutral-100"
                      onClick={() => setIndex(i)}
                    >
                      Show this example
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex items-center justify-center">
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
