"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
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

  const [activeKind, setActiveKind] = useState<Slide["kind"]>("analytics");
  const [index, setIndex] = useState(0);

  const filteredSlides = useMemo(
    () => slides.filter((s) => s.kind === activeKind),
    [slides, activeKind]
  );

  const current = filteredSlides[Math.min(index, Math.max(0, filteredSlides.length - 1))];

  return (
    <div className="min-h-screen bg-black text-white">
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
            Get real listener feedback on your track.
          </h1>
          <p className="mt-5 text-neutral-300 text-base sm:text-lg max-w-2xl mx-auto">
            5–20 genre-matched listeners leave structured reviews with timestamps. We highlight the patterns so you know what to change.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button
                className="w-full sm:w-auto h-11 text-base font-black bg-lime-500 text-black border-2 border-lime-500 hover:bg-lime-400"
              >
                Start trial
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto h-11 text-base font-black border-2 border-neutral-600 text-white hover:bg-neutral-900"
              onClick={() => {
                document.getElementById("examples")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Learn more
            </Button>
          </div>
        </section>

        <section id="examples" className="mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black">What you get</h2>
              <p className="text-neutral-300 mt-2 max-w-2xl">
                Big, bold summaries + clean reviews that make it obvious what to fix.
              </p>
            </div>

            <div className="inline-flex border-2 border-neutral-700 bg-neutral-900">
              <button
                type="button"
                className={`px-3 py-2 text-sm font-black ${
                  activeKind === "analytics" ? "bg-lime-500 text-black" : "text-white"
                }`}
                onClick={() => {
                  setActiveKind("analytics");
                  setIndex(0);
                }}
              >
                Analytics
              </button>
              <button
                type="button"
                className={`px-3 py-2 text-sm font-black border-l-2 border-neutral-700 ${
                  activeKind === "review" ? "bg-lime-500 text-black" : "text-white"
                }`}
                onClick={() => {
                  setActiveKind("review");
                  setIndex(0);
                }}
              >
                Reviews
              </button>
            </div>
          </div>

          <div className="mt-6 border-2 border-neutral-700 bg-neutral-900">
            <div className="p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-black text-neutral-400">EXAMPLE</div>
                  <div className="text-xl sm:text-2xl font-black mt-1 truncate">{current?.title}</div>
                  <div className="text-neutral-300 mt-2">{current?.subtitle}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10 p-0 border-2 border-neutral-700 text-white hover:bg-neutral-800"
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                    disabled={index <= 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10 p-0 border-2 border-neutral-700 text-white hover:bg-neutral-800"
                    onClick={() => setIndex((i) => Math.min(filteredSlides.length - 1, i + 1))}
                    disabled={index >= filteredSlides.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {activeKind === "analytics" ? (
                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  <div className="border-2 border-neutral-700 bg-black p-4">
                    <div className="text-xs font-black text-neutral-400">TOP PATTERNS</div>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="border-l-4 border-lime-500 pl-3">
                        "Intro is too long" (8/12)
                      </div>
                      <div className="border-l-4 border-orange-400 pl-3">
                        "Hook hits hard" (9/12)
                      </div>
                      <div className="border-l-4 border-sky-400 pl-3">
                        "Vocals too loud" (6/12)
                      </div>
                    </div>
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

                  <div className="border-2 border-neutral-700 bg-black p-4">
                    <div className="text-xs font-black text-neutral-400">LISTENER SIGNALS</div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Would listen again</span>
                        <span className="font-black">83%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Would playlist</span>
                        <span className="font-black">67%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Would share</span>
                        <span className="font-black">52%</span>
                      </div>
                    </div>
                  </div>
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

          <div className="mt-10 flex items-center justify-center">
            <Link href="/signup">
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
