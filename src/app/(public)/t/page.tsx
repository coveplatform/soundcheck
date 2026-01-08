"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  ArrowRight,
  Ear,
  Flame,
  ListMusic,
  Lock,
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
            Get up to <span className="text-lime-500">20</span> clean, structured reviews.
          </h1>
          <p className="mt-5 text-neutral-300 text-base sm:text-lg max-w-2xl mx-auto">
            From genre-matched artists + listeners in your music community.
            <br />
            MixReflect is a private feedback marketplace — you rate every review to keep quality high.
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
                    What people do after they hear your track.
                  </h3>
                  <p className="mt-3 text-neutral-300 max-w-2xl">
                    Plain numbers. Plain meaning. No fluff.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-3 py-1 border-2 border-black bg-white text-black font-black">
                    Based on 20 reviews
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
                    Based on 20 reviews
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
                  a: "One person's feedback is just their taste. With multiple reviews, patterns emerge. If one person says your intro is too long, maybe they're wrong. If most reviewers say it, that's something to fix. Consensus separates taste from truth.",
                },
                {
                  q: "If reviewers are paid, won't they just say nice things?",
                  a: "The opposite. You rate every review. Low ratings = reviewers earn less ($0.50 vs $1.50/review) and lose access to future work. The incentive is honest, useful feedback—not empty praise. Plus, with multiple reviews, one fake positive can't hide when everyone else disagrees.",
                },
                {
                  q: "Who are these reviewers?",
                  a: "Real people who passed a quality screening and selected genres they genuinely love. They're rated by artists after every review, so quality matters.",
                },
                {
                  q: "Is my unreleased music safe?",
                  a: "Yes. Only assigned reviewers hear your track. We never share, publish, or leak anything. Your music stays private.",
                },
                {
                  q: "How fast do I get results?",
                  a: "All reviews within 24 hours, usually faster. No waiting weeks.",
                },
                {
                  q: "What if I disagree with the feedback?",
                  a: "That's fine—and expected sometimes. The power is in patterns: if only 1 person mentions something, it might be taste. If multiple reviewers mention it, it's worth considering. You always make the final call.",
                },
                {
                  q: "Can I get a refund?",
                  a: "If reviews haven't started, yes. Contact support.",
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
                <div className="mt-2 text-sm text-neutral-200">
                  Your reviewers come from the MixReflect community marketplace (artists + listeners).
                  They pick the genres they actually listen to, then we match your track to them.
                </div>
              </div>
              <div className="border-2 border-black bg-black/80 backdrop-blur text-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-black">3</div>
                  <div className="h-10 w-10 border-2 border-black bg-lime-500 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 font-black">They review (with timestamps)</div>
                <div className="mt-2 text-sm text-neutral-200">
                  Clear sections: what worked / what to fix — and you rate the review so quality stays high.
                </div>
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

      <footer className="py-8 bg-black text-white border-t-2 border-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Logo className="text-white" />
            </div>
            <p className="text-neutral-400">&copy; {new Date().getFullYear()} MixReflect</p>
            <div className="flex items-center gap-4 text-neutral-300">
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

          <div className="mt-6 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              <span>Secure payments powered by</span>
              <svg className="h-5 w-auto text-neutral-300" viewBox="0 0 60 25" fill="currentColor">
                <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95l.3 2.92c-1.25.63-2.84 1.03-4.72 1.03-4.12 0-6.6-2.55-6.6-6.64 0-3.98 2.44-6.86 6.08-6.86 3.76 0 5.86 2.88 5.86 6.64 0 .42-.04.88-.11 1.31zm-5.73-5.2c-1.26 0-2.26.94-2.49 2.67h4.87c-.08-1.53-.86-2.67-2.38-2.67zM36.95 19.52V8.13l-2.2.49V5.94l5.88-1.32v14.9h-3.68zm-7.14 0V8.13l-2.2.49V5.94l5.88-1.32v14.9h-3.68zM15.97 6.33c3.9 0 6.05 2.88 6.05 6.64s-2.15 6.86-6.05 6.86-6.08-2.88-6.08-6.86 2.18-6.64 6.08-6.64zm0 10.46c1.49 0 2.37-1.34 2.37-3.82s-.88-3.6-2.37-3.6-2.4 1.12-2.4 3.6.91 3.82 2.4 3.82zM5.97 19.52c-2.15 0-3.87-1.12-3.87-3.98V9.38H0V6.55h2.1V3.11L5.82 2v4.55h2.79v2.83H5.82v5.72c0 1.08.45 1.46 1.19 1.46.56 0 1.08-.15 1.6-.45l.41 2.76c-.75.37-1.71.65-3.05.65z"/>
              </svg>
            </div>
            <span className="hidden sm:inline text-neutral-700">•</span>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-lime-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              <span>SSL encrypted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
