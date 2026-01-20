import Link from "next/link";
import { Caveat } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Headphones, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { TrackReportDemo } from "@/components/landing/track-report-demo";
import { ActivityFeed } from "@/components/landing/activity-feed";
import { BrowserMockup } from "@/components/landing/browser-mockup";
import { TrackPageMockup } from "@/components/landing/track-page-mockup";
import { DiscoverMockup } from "@/components/landing/discover-mockup";
import { Sparkle, Star, Squiggle, Dots } from "@/components/landing/doodles";
import { AnimatedSection } from "@/components/landing/animated-section";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

const DAW_TRACKS = [
  {
    name: "Drums 🥁",
    color: "#fb923c",
    clips: [
      { label: "Beat A", startBeat: 0, lengthBeats: 8 },
      { label: "Fill", startBeat: 10, lengthBeats: 2 },
      { label: "Beat B", startBeat: 12, lengthBeats: 8 },
    ],
  },
  {
    name: "Bass 🎸",
    color: "#a3e635",
    clips: [
      { label: "Sub", startBeat: 4, lengthBeats: 8 },
      { label: "Riff", startBeat: 12, lengthBeats: 8 },
    ],
  },
  {
    name: "Synths 🎹",
    color: "#60a5fa",
    clips: [
      { label: "Pad", startBeat: 0, lengthBeats: 16 },
      { label: "Lead", startBeat: 16, lengthBeats: 8 },
    ],
  },
  {
    name: "Vocals 🎤",
    color: "#f472b6",
    clips: [
      { label: "Verse", startBeat: 8, lengthBeats: 8 },
      { label: "Hook", startBeat: 16, lengthBeats: 8 },
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-950 pt-14">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50  bg-[#faf8f5]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Logo />
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <AuthButtons theme="light" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className=" overflow-visible bg-[#faf8f5]">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 text-center relative">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 leading-[1.05]">
            A home for your music to <span className="text-lime-700">grow</span>
          </h1>

          <p className="mt-6 text-neutral-700 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Upload your tracks. Get real feedback from people who love your genre. Earn when others discover and share your music.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="bg-lime-400 text-black border-2 border-black hover:bg-lime-300 active:bg-lime-500 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-colors transition-shadow transition-transform duration-150 ease-out active:transition-none motion-reduce:transition-none motion-reduce:transform-none">
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <span className="text-sm text-neutral-500">$9.95/mo · Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Live Activity */}
      <section className="py-10  overflow-hidden bg-[#faf8f5]">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-500"></span>
          </span>
          <span className="text-sm font-medium text-neutral-600">Happening now</span>
        </div>
        <ActivityFeed />
      </section>

      {/* Track Report */}
      <section id="examples" className="py-12 sm:py-16  bg-[#faf8f5] overflow-visible">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">See what&apos;s working</h2>
            <p className="mt-3 text-neutral-600">
              Your Track Report shows patterns across all your reviews. When multiple people say the same thing, that&apos;s not taste—that&apos;s signal.
            </p>
          </AnimatedSection>

          <AnimatedSection className="relative">
            {/* Decorative doodles */}
            <Sparkle className="pointer-events-none absolute top-6 -left-10 sm:-left-28 lg:-left-44 w-14 h-14 sm:w-20 sm:h-20 text-neutral-950 opacity-90 -rotate-12" />
            <Squiggle className="pointer-events-none absolute -top-10 -right-10 sm:-right-24 lg:-right-40 w-16 h-16 sm:w-28 sm:h-28 text-orange-300 opacity-70 rotate-12" />
            <Dots className="pointer-events-none absolute -bottom-10 right-2 sm:right-6 w-12 h-12 sm:w-16 sm:h-16 text-lime-500 opacity-80 rotate-6" />

            <TrackReportDemo />
          </AnimatedSection>
        </div>
      </section>

      {/* Stem Upload Feature - NEW */}
      <section className="pb-12 sm:pb-16 pt-0 bg-neutral-900 text-neutral-50 overflow-visible">
        <div className="w-full overflow-hidden bg-lime-400/10">
          <div className="h-12 flex items-center">
            <div
              className={`${caveat.className} w-full flex gap-6 whitespace-nowrap text-lime-300 text-3xl font-bold leading-none`}
            >
              {Array.from({ length: 60 }).map((_, i) => (
                <span key={i}>new</span>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8">
          <AnimatedSection className="is-visible max-w-4xl mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold">Upload stems for detailed feedback</h2>
            <p className="mt-3 text-neutral-300">
              Export stems straight from your DAW (Ableton, Logic, FL Studio, etc.) and upload them here.
              Reviewers can mute and solo each element (drums, bass, vocals, synths) to give you precise, actionable feedback on your production.
            </p>
          </AnimatedSection>

          <AnimatedSection className="is-visible">
            <div className="bg-neutral-800 border-2 border-neutral-700 rounded-lg p-6 sm:p-8">
              <div className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-lime-500/20 border border-lime-500 flex items-center justify-center">
                      <span className="text-lime-400 font-bold">🎛️</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Stem-by-stem control</h3>
                      <p className="text-sm text-neutral-400 mt-1">
                        Reviewers can mute your drums to hear if the bass is too loud, or solo your vocals to check if they sit right in the mix.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500 flex items-center justify-center">
                      <span className="text-orange-400 font-bold">🎯</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white">More precise feedback</h3>
                      <p className="text-sm text-neutral-400 mt-1">
                        Get comments like &quot;Your kick at 1:42 is masking the bass&quot; instead of vague &quot;mix needs work&quot; feedback.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center">
                      <span className="text-blue-400 font-bold">⚡</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Pro-level workflow</h3>
                      <p className="text-sm text-neutral-400 mt-1">
                        Upload master + stems just like sending to a mix engineer. Reviewers experience your track the way you built it.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-neutral-950/30 border-2 border-neutral-700/80 rounded-xl p-4 sm:p-5 space-y-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="text-xs text-neutral-400 uppercase tracking-wider">Example Arrangement</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-lime-300 bg-lime-400/10 border border-lime-400/20 rounded-full px-2 py-1">
                          Preview
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 bg-white/5 border border-white/10 rounded-full px-2 py-1">
                          Stereo
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <div className="min-w-[680px] rounded-lg border border-white/10 overflow-hidden bg-black/20">
                        <div className="grid grid-cols-[160px_1fr] border-b border-white/10">
                          <div className="bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                            Tracks
                          </div>
                          <div className="relative bg-black/20 px-3 py-2">
                            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                              {Array.from({ length: 9 }).map((_, i) => (
                                <span key={i}>{i + 1}</span>
                              ))}
                            </div>
                            <div className="pointer-events-none absolute inset-y-0 left-3 right-3">
                              <div className="h-full w-full grid grid-cols-9">
                                {Array.from({ length: 9 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={
                                      i === 0
                                        ? "border-l border-white/10"
                                        : "border-l border-white/10 border-dashed"
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="pointer-events-none absolute inset-y-0 left-[52%] w-px bg-lime-300/80" />
                            <div className="pointer-events-none absolute -top-1 left-[52%] -translate-x-1/2 h-0 w-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-lime-300/80" />
                          </div>
                        </div>

                        <div className="divide-y divide-white/10">
                          {DAW_TRACKS.map((track) => (
                            <div key={track.name} className="grid grid-cols-[160px_1fr]">
                              <div className="h-12 px-3 flex items-center" style={{ backgroundColor: track.color }}>
                                <div className="w-full flex items-center justify-between gap-3">
                                  <div className="text-[11px] font-extrabold text-black truncate">
                                    {track.name}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      className="h-6 w-7 text-[11px] font-extrabold border border-black/20 bg-black/10 rounded-md text-black hover:bg-black/15 active:bg-black/20 transition-colors duration-150 ease-out"
                                    >
                                      M
                                    </button>
                                    <button
                                      type="button"
                                      className="h-6 w-7 text-[11px] font-extrabold border border-black/20 bg-black/10 rounded-md text-black hover:bg-black/15 active:bg-black/20 transition-colors duration-150 ease-out"
                                    >
                                      S
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="relative bg-black/20">
                                <div className="pointer-events-none absolute inset-0">
                                  <div className="h-full w-full grid grid-cols-9">
                                    {Array.from({ length: 9 }).map((_, i) => (
                                      <div
                                        key={i}
                                        className={
                                          i === 0
                                            ? "border-l border-white/10"
                                            : "border-l border-white/10 border-dashed"
                                        }
                                      />
                                    ))}
                                  </div>
                                </div>

                                <div className="relative h-12 px-3 py-2">
                                  {track.clips.map((clip) => (
                                    <div
                                      key={`${track.name}-${clip.label}-${clip.startBeat}`}
                                      className="absolute top-2 h-8 rounded-md border border-black/20 hover:opacity-90 transition-opacity duration-150 ease-out shadow-[2px_2px_0px_0px_rgba(0,0,0,0.35)]"
                                      style={{
                                        backgroundColor: track.color,
                                        left: `${clip.startBeat * 16}px`,
                                        width: `${clip.lengthBeats * 16}px`,
                                      }}
                                    >
                                      <div className="px-2 py-1.5">
                                        <div className="text-[10px] font-bold text-black truncate">
                                          {clip.label}
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                  <div className="pointer-events-none absolute inset-y-0 left-[52%] w-px bg-lime-300/80" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-lime-500/10 border border-lime-500/30 rounded text-xs text-lime-300">
                      💡 Tip: Jump to the hook clip to hear what reviewers are reacting to
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-700">
                <p className="text-sm text-neutral-400 text-center">
                  No special software needed. Upload stems directly from your DAW, and reviewers use our built-in stem player.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Your Music Has a Home */}
      <section className="py-12 sm:py-16  bg-[#faf8f5] overflow-visible">
        <div className="max-w-5xl mx-auto px-4">
          <AnimatedSection className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">Your music has a home</h2>
            <p className="mt-3 text-neutral-600">
              Every track you upload gets its own page. Listeners can discover it, listen, and if they like it, buy it and share it with their audience.
            </p>
          </AnimatedSection>

          <AnimatedSection className="relative">
            {/* Decorative doodles */}
            <Sparkle className="pointer-events-none absolute -top-10 -left-10 sm:-left-24 lg:-left-40 w-16 h-16 sm:w-24 sm:h-24 text-neutral-950 opacity-90 rotate-12" />
            <Star className="pointer-events-none absolute top-6 -left-6 sm:-left-16 lg:-left-24 w-12 h-12 sm:w-14 sm:h-14 text-lime-500 opacity-90 -rotate-12" />
            <Squiggle className="pointer-events-none absolute -bottom-10 -right-10 sm:-right-28 lg:-right-44 w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 text-orange-300 opacity-60 rotate-6" />

            <BrowserMockup url="mixreflect.com/track/midnight-drive">
              <TrackPageMockup />
            </BrowserMockup>
          </AnimatedSection>
        </div>
      </section>

      {/* Discover & Review */}
      <section className="py-12 sm:py-16  bg-[#faf8f5] overflow-visible">
        <div className="max-w-5xl mx-auto px-4">
          <AnimatedSection className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">A community of listeners</h2>
            <p className="mt-3 text-neutral-600">
              Reviewers browse by genre and discover tracks to review. They buy your track, listen deeply, and give structured feedback. When they love it, they share it with their fans.
            </p>
          </AnimatedSection>

          <AnimatedSection className="relative">
            {/* Decorative doodles */}
            <Dots className="pointer-events-none absolute -top-10 -right-10 sm:-right-24 lg:-right-44 w-16 h-16 sm:w-24 sm:h-24 text-neutral-950 opacity-80 rotate-12" />
            <Sparkle className="pointer-events-none absolute -top-2 right-2 sm:-right-12 lg:-right-20 w-12 h-12 sm:w-14 sm:h-14 text-orange-300 opacity-85 -rotate-6" />
            <Squiggle className="pointer-events-none absolute -bottom-8 -left-12 sm:-left-24 lg:-left-36 w-32 h-10 sm:w-44 sm:h-12 text-lime-400 opacity-90 rotate-6" />

            <BrowserMockup url="mixreflect.com/discover">
              <DiscoverMockup />
            </BrowserMockup>
          </AnimatedSection>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16  bg-[#faf8f5]">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xl sm:text-2xl text-neutral-700 leading-relaxed">
            &ldquo;4 of 5 reviewers mentioned the intro was too long. Cut it down, and it&apos;s now my best performing release.&rdquo;
          </p>
          <p className="mt-4 text-sm text-neutral-500">Marcus T. · Electronic Producer</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-neutral-900 text-neutral-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center">
            <div className="text-5xl sm:text-6xl font-extrabold">
              $9.95<span className="text-xl sm:text-2xl font-semibold text-neutral-400 ml-1">/mo</span>
            </div>

            <AnimatedSection stagger className="mt-8 space-y-3 text-left max-w-sm mx-auto">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-lime-400 flex-shrink-0" />
                <span>20 reviews included every month</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-lime-400 flex-shrink-0" />
                <span>Unlimited track uploads</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-lime-400 flex-shrink-0" />
                <span>Upload stems for detailed feedback</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-lime-400 flex-shrink-0" />
                <span>Earn from every sale</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-lime-400 flex-shrink-0" />
                <span>Your track links to share</span>
              </div>
            </AnimatedSection>

            <div className="mt-8">
              <Link href="/signup">
                <Button size="lg" className="bg-lime-400 text-black hover:bg-lime-300 active:bg-lime-500 border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-colors transition-shadow transition-transform duration-150 ease-out active:transition-none motion-reduce:transition-none motion-reduce:transform-none">
                  Start free trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-neutral-400">
              Need more reviews? Add extra for $5 anytime.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16  bg-[#faf8f5]">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-10 text-neutral-950">Questions</h2>
          <div className="space-y-0 rounded-2xl bg-white shadow-md overflow-hidden">
            {[
              {
                q: "What is MixReflect?",
                a: "A platform where your music has a home. Upload tracks, get structured feedback from genre-matched listeners, and earn money when listeners choose to buy your music. It's part feedback tool, part discovery platform, part income stream.",
              },
              {
                q: "How do I earn money?",
                a: "You earn $0.50 whenever a listener buys your track. Reviewers who love your track can share it with their fans, and if those fans buy through that link, you still get paid.",
              },
              {
                q: "How does sharing work?",
                a: "When reviewers discover a track they love, they can share it with their audience. If their fans buy through that link, the reviewer earns a commission. It's a way for tastemakers to get rewarded for spreading good music—and artists benefit from the exposure.",
              },
              {
                q: "Why do I need multiple reviews?",
                a: "One person's feedback is just their taste. With multiple reviews, patterns emerge. If one person says your intro is too long, maybe they're wrong. If most reviewers say it, that's signal worth acting on.",
              },
              {
                q: "Who are the reviewers?",
                a: "Real listeners who selected genres they genuinely love. They're rated by artists after every review—low ratings mean they earn less and eventually lose access. Quality stays high because it has to.",
              },
              {
                q: "Is my music safe?",
                a: "Yes. Your unreleased tracks are only heard by reviewers you're matched with. We never share, publish, or leak anything. Once you're ready to release, your track page becomes public.",
              },
              {
                q: "What do I get with my subscription?",
                a: "20 reviews per month, unlimited track uploads, your own track pages, and earnings when listeners buy your track. Need more reviews? Add them anytime for $5.",
              },
              {
                q: "Can I cancel?",
                a: "Yes, anytime. Your tracks stay on the platform and keep earning—you just won't get new reviews until you resubscribe.",
              },
            ].map((item, i, arr) => (
              <details
                key={item.q}
                className={`p-4 ${i < arr.length - 1 ? "" : ""}`}
              >
                <summary className="font-extrabold cursor-pointer hover:text-neutral-700 text-neutral-950">
                  {item.q}
                </summary>
                <p className="mt-3 text-neutral-700">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* For Reviewers */}
      <section id="for-reviewers" className="py-12 bg-neutral-900 text-neutral-50 border-t border-neutral-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center text-center md:text-left md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <div className="h-10 w-10 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-orange-300" />
                </div>
                <h2 className="text-2xl font-bold">Love discovering new music?</h2>
              </div>
              <p className="text-neutral-300">
                Get paid to listen and give feedback. Earn $0.50–$1.50 per review.
              </p>
            </div>
            <Link href="/signup" className="shrink-0 self-stretch md:self-auto">
              <Button variant="primary">
                Become a Reviewer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-neutral-900 text-neutral-50 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Logo className="text-white" />
            </div>
            <p className="text-neutral-400">
              &copy; {new Date().getFullYear()} MixReflect
            </p>
            <div className="flex items-center gap-4 text-neutral-300">
              <Link href="/terms" className="hover:text-white font-medium transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-white font-medium transition-colors">
                Privacy
              </Link>
              <Link href="/support" className="hover:text-white font-medium transition-colors">
                Support
              </Link>
            </div>
          </div>
          {/* Payment Trust Badge */}
          <div className="mt-6 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              <span>Secure payments powered by</span>
              <span className="font-bold text-neutral-200 tracking-tight">Stripe</span>
            </div>
            <span className="hidden sm:inline text-neutral-600">•</span>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-lime-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
