"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  ArrowRight,
  Ear,
  Flame,
  ListMusic,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Share2,
  Star,
} from "lucide-react";

export default function TrialLandingPage() {
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

      <main className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
        <section className="text-center min-h-[62vh] flex flex-col justify-center">
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

        <section id="examples" className="mt-12 space-y-7">
          <div className="border-2 border-black bg-neutral-900 shadow-[6px_6px_0px_0px_rgba(132,204,22,1)]">
            <div className="p-5 sm:p-7">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <h3 className="mt-2 text-2xl sm:text-3xl font-black">
                    What listeners would do after hearing it.
                  </h3>
                  <p className="mt-3 text-neutral-300 max-w-2xl">
                    Plain numbers. Plain meaning. No fluff.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-3 py-1 border-2 border-black bg-white text-black font-black">
                    Based on 20 listeners
                  </span>
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                <div className="border-2 border-black bg-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-neutral-400">WOULD LISTEN AGAIN</div>
                      <div className="mt-1 text-2xl font-black text-white">83%</div>
                    </div>
                    <div className="text-xs font-black bg-lime-500 text-black border-2 border-black px-2 py-1">STRONG</div>
                  </div>
                  <div className="mt-3 h-3 border-2 border-black bg-neutral-800">
                    <div className="h-full bg-lime-500" style={{ width: "83%" }} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="border-2 border-black bg-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-xs font-black text-neutral-400">WOULD ADD TO PLAYLIST</div>
                    <div className="mt-1 text-2xl font-black text-white">67%</div>
                    <div className="mt-3 h-3 border-2 border-black bg-neutral-800">
                      <div className="h-full bg-orange-400" style={{ width: "67%" }} />
                    </div>
                  </div>
                  <div className="border-2 border-black bg-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-xs font-black text-neutral-400">WOULD SHARE</div>
                    <div className="mt-1 text-2xl font-black text-white">52%</div>
                    <div className="mt-3 h-3 border-2 border-black bg-neutral-800">
                      <div className="h-full bg-sky-400" style={{ width: "52%" }} />
                    </div>
                  </div>
                </div>

                <div className="border-2 border-black bg-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs font-black text-neutral-400">WHAT THIS MEANS</div>
                  <div className="mt-2 text-sm text-neutral-300">
                    Replay shows the core idea works. Playlist/share shows if it&apos;s something people would keep.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-2 border-black bg-neutral-900 shadow-[6px_6px_0px_0px_rgba(56,189,248,1)]">
            <div className="p-5 sm:p-7">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <h3 className="mt-2 text-2xl sm:text-3xl font-black">
                    The “most mentioned moments”.
                  </h3>
                  <p className="mt-3 text-neutral-300 max-w-2xl">
                    A ranked list of what people keep pointing at.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-3 py-1 border-2 border-black bg-white text-black font-black">
                    Based on 20 listeners
                  </span>
                </div>
              </div>

              <div className="mt-8 grid md:grid-cols-2 gap-4">
                <div className="border-2 border-black bg-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs font-black text-neutral-400">TOP PRAISE</div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black">0:45 Hook hits hard</div>
                        <div className="text-sm text-neutral-300">Melody lands + drums feel confident here.</div>
                      </div>
                      <span className="px-2 py-1 border-2 border-black bg-lime-500 text-black text-xs font-black">15/20</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black">2:15 Breakdown feels fresh</div>
                        <div className="text-sm text-neutral-300">Nice contrast, keeps attention.</div>
                      </div>
                      <span className="px-2 py-1 border-2 border-black bg-lime-500 text-black text-xs font-black">12/20</span>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-black bg-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-xs font-black text-neutral-400">TOP FIXES</div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black">0:00 Intro too long</div>
                        <div className="text-sm text-neutral-300">People want the hook sooner.</div>
                      </div>
                      <span className="px-2 py-1 border-2 border-black bg-orange-400 text-black text-xs font-black">14/20</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black">1:30 Vocal too loud</div>
                        <div className="text-sm text-neutral-300">Clashes with the lead synth.</div>
                      </div>
                      <span className="px-2 py-1 border-2 border-black bg-orange-400 text-black text-xs font-black">10/20</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-2 border-black bg-neutral-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-5 sm:p-7">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
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
                        The hook at 0:45 is instantly memorable. Drums and bass feel tight and controlled, which makes the drop hit harder. The 2:15 breakdown is a great reset that keeps the track from feeling repetitive.
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-red-400 uppercase tracking-wide mb-1">To improve</div>
                      <div className="pl-3 border-l-4 border-red-400 text-neutral-200">
                        The intro is a bit long — cut 8–12 seconds so the hook arrives sooner. Around 1:30 the vocal is slightly loud and masks the lead synth. Verse 2 hats feel static — add a small variation or automation.
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

        <section className="mt-16 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-lime-500 text-black border-y-2 border-black py-12">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center">
              Why get feedback on your music?
            </h2>

            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="border-2 border-black p-6">
                <div className="h-12 w-12 border-2 border-black flex items-center justify-center">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="mt-4 text-2xl font-black">Get noticed</div>
                <div className="mt-2 text-base font-medium">
                  Make the track stronger before you release.
                </div>
              </div>

              <div className="border-2 border-black p-6">
                <div className="h-12 w-12 border-2 border-black flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="mt-4 text-2xl font-black">Improve</div>
                <div className="mt-2 text-base font-medium">
                  Get clear fixes you can actually apply.
                </div>
              </div>

              <div className="border-2 border-black p-6">
                <div className="h-12 w-12 border-2 border-black flex items-center justify-center">
                  <Ear className="h-6 w-6" />
                </div>
                <div className="mt-4 text-2xl font-black">Fresh ears</div>
                <div className="mt-2 text-base font-medium">
                  Hear what listeners hear, not what you hope.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="max-w-5xl mx-auto px-0">
            <h2 className="text-3xl font-black mb-8">FAQ</h2>
            <div className="space-y-0 border-2 border-black bg-neutral-900 shadow-[6px_6px_0px_0px_rgba(251,146,60,1)]">
              {[
                {
                  q: "Why do I need multiple reviews instead of just one?",
                  a: "One person&apos;s feedback is just their taste. With multiple reviews, patterns emerge. Consensus separates taste from signal.",
                },
                {
                  q: "Who are these reviewers?",
                  a: "Real people who chose genres they genuinely love. You rate every review, so quality matters.",
                },
                {
                  q: "Is my unreleased music safe?",
                  a: "Yes. Only assigned reviewers hear your track. We never publish or share your music.",
                },
                {
                  q: "How fast do I get results?",
                  a: "All reviews within 24 hours, usually faster.",
                },
              ].map((item, i, arr) => (
                <details
                  key={item.q}
                  className={`p-5 ${i < arr.length - 1 ? "border-b-2 border-black" : ""}`}
                >
                  <summary className="font-black cursor-pointer hover:text-neutral-300">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-neutral-300">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-sky-400 text-black border-y-2 border-black py-12">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center">
              How it works
            </h2>

            <div className="mt-8 grid md:grid-cols-4 gap-4">
              <div className="border-2 border-black bg-black/80 backdrop-blur text-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-black">1</div>
                  <div className="h-10 w-10 border-2 border-black bg-lime-500 flex items-center justify-center">
                    <Target className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 font-black">Submit your track</div>
                <div className="mt-2 text-sm text-neutral-200">Upload or paste a link from your dashboard.</div>
              </div>
              <div className="border-2 border-black bg-black/80 backdrop-blur text-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-black">2</div>
                  <div className="h-10 w-10 border-2 border-black bg-lime-500 flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 font-black">We match listeners</div>
                <div className="mt-2 text-sm text-neutral-200">Genre-aware matching for better signal.</div>
              </div>
              <div className="border-2 border-black bg-black/80 backdrop-blur text-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-black">3</div>
                  <div className="h-10 w-10 border-2 border-black bg-lime-500 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 font-black">They review (with timestamps)</div>
                <div className="mt-2 text-sm text-neutral-200">Clear sections: what worked / what to fix.</div>
              </div>
              <div className="border-2 border-black bg-black/80 backdrop-blur text-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-black">4</div>
                  <div className="h-10 w-10 border-2 border-black bg-lime-500 flex items-center justify-center">
                    <Flame className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 font-black">You get clarity</div>
                <div className="mt-2 text-sm text-neutral-200">Charts + patterns to guide your next session.</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            <p className="text-neutral-500">&copy; {new Date().getFullYear()} MixReflect</p>
            <div className="flex items-center gap-4 text-neutral-400">
              <Link href="/terms" className="hover:text-white font-medium">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-white font-medium">
                Privacy
              </Link>
              <Link href="/support" className="hover:text-white font-medium">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
