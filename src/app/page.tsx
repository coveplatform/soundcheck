import Link from "next/link";
import { Caveat } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Headphones, ArrowRight, CheckCircle2, Lock, Upload, MessageSquare, Music } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { TrackReportDemo } from "@/components/landing/track-report-demo";
import { ActivityFeed } from "@/components/landing/activity-feed";
import { BrowserMockup } from "@/components/landing/browser-mockup";
import { TrackPageMockup } from "@/components/landing/track-page-mockup";
import { DiscoverMockup } from "@/components/landing/discover-mockup";
import { Sparkle, Star, Squiggle, Dots } from "@/components/landing/doodles";
import { AnimatedSection } from "@/components/landing/animated-section";
import { OnlineListeners } from "@/components/landing/online-listeners";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

const DAW_TRACKS = [
  {
    name: "Kick & Snare",
    color: "#fb923c",
    clips: [
      { label: "Beat A", startBeat: 0, lengthBeats: 8 },
      { label: "Fill", startBeat: 10, lengthBeats: 2 },
      { label: "Beat B", startBeat: 12, lengthBeats: 8 },
    ],
  },
  {
    name: "Sub Bass",
    color: "#a3e635",
    clips: [
      { label: "Sub", startBeat: 4, lengthBeats: 8 },
      { label: "Riff", startBeat: 12, lengthBeats: 8 },
    ],
  },
  {
    name: "Main Synth",
    color: "#60a5fa",
    clips: [
      { label: "Pad", startBeat: 0, lengthBeats: 16 },
      { label: "Lead", startBeat: 16, lengthBeats: 8 },
    ],
  },
  {
    name: "Lead Vocal",
    color: "#f472b6",
    clips: [
      { label: "Verse", startBeat: 8, lengthBeats: 8 },
      { label: "Hook", startBeat: 16, lengthBeats: 8 },
    ],
  },
  {
    name: "FX & Risers",
    color: "#a78bfa",
    clips: [
      { label: "Riser", startBeat: 6, lengthBeats: 2 },
      { label: "Impact", startBeat: 8, lengthBeats: 1 },
      { label: "Sweep", startBeat: 15, lengthBeats: 1 },
    ],
  },
  {
    name: "Hi-Hats",
    color: "#fbbf24",
    clips: [
      { label: "Pattern A", startBeat: 4, lengthBeats: 12 },
      { label: "Rolls", startBeat: 18, lengthBeats: 6 },
    ],
  },
  {
    name: "Backing Vox",
    color: "#ec4899",
    clips: [
      { label: "Ahhs", startBeat: 12, lengthBeats: 4 },
      { label: "Harmony", startBeat: 16, lengthBeats: 8 },
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
      <section className="overflow-visible bg-gradient-to-b from-purple-50 to-[#faf8f5]">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-200 rounded-full px-4 py-2 mb-8">
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-sm font-semibold text-purple-700">1,200+ artists giving each other feedback right now</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-950 leading-[1.05]">
            Get real feedback.<br />
            <span className="text-purple-600">From real artists.</span>
          </h1>

          <p className="mt-8 text-neutral-700 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            Upload your track and get detailed reviews from fellow producers in your genre. No bots, no randos—just artists who actually know what they're talking about.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-black text-lg px-8 py-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[6px] active:translate-y-[6px] transition-all duration-150 ease-out"
              >
                Start for free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#examples">
              <Button
                variant="outline"
                size="lg"
                className="bg-white border-2 border-neutral-300 text-neutral-950 hover:bg-neutral-50 font-bold text-lg px-8 py-6"
              >
                See examples
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-neutral-500">
            Start with <span className="font-bold text-purple-600">1 free credit</span> • Earn more by reviewing • No credit card required
          </p>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-8 bg-[#faf8f5]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 sm:gap-12">
            <div className="text-center">
              <p className="text-2xl sm:text-4xl font-bold text-neutral-950 mb-1">2,847</p>
              <p className="text-[10px] sm:text-xs text-neutral-500">Tracks reviewed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-4xl font-bold text-purple-600 mb-1">&lt;4hrs</p>
              <p className="text-[10px] sm:text-xs text-neutral-500">Avg turnaround</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-4xl font-bold text-neutral-950 mb-1">1,200+</p>
              <p className="text-[10px] sm:text-xs text-neutral-500">Artists in the community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stem Upload Feature - MOVED UP */}
      <section className="pb-12 sm:pb-16 pt-8 bg-neutral-900 text-neutral-50 overflow-visible">
        <div className="w-full overflow-hidden bg-purple-400/10">
          <div className="h-12 flex items-center">
            <div
              className={`${caveat.className} w-full flex gap-6 whitespace-nowrap text-purple-300 text-3xl font-bold leading-none`}
            >
              {Array.from({ length: 60 }).map((_, i) => (
                <span key={i}>new</span>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8">
          <AnimatedSection className="is-visible max-w-4xl mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold">Drop in your DAW file. Get feedback on every layer.</h2>
            <p className="mt-3 text-neutral-300">
              Upload your Ableton Live Set (.als), Logic project, or exported stems.
              Fellow artists can mute/solo each element to give you precise feedback on your mix.
            </p>
          </AnimatedSection>

          <AnimatedSection className="is-visible">
            <div className="bg-neutral-800 border-2 border-neutral-700 rounded-lg p-6 sm:p-8">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3 text-xs font-mono">
                  <span className="px-3 py-1.5 bg-neutral-700 text-neutral-300 rounded">Ableton .als</span>
                  <span className="px-3 py-1.5 bg-neutral-700 text-neutral-300 rounded">Logic .logicx</span>
                  <span className="px-3 py-1.5 bg-neutral-700 text-neutral-300 rounded">FL Studio .flp</span>
                  <span className="px-3 py-1.5 bg-neutral-700 text-neutral-300 rounded">or export stems</span>
                </div>

                <div className="relative">
                  <div className="bg-neutral-950/30 border-2 border-neutral-700/80 rounded-xl p-4 sm:p-5 space-y-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="text-xs text-neutral-400 uppercase tracking-wider">Example Arrangement</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-400/10 border border-purple-400/20 rounded-full px-2 py-1">
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
                          </div>
                        </div>

                        <div className="divide-y divide-white/10">
                          {DAW_TRACKS.map((track) => (
                            <div key={track.name} className="grid grid-cols-[160px_1fr]">
                              <div className="h-6 px-3 flex items-center" style={{ backgroundColor: track.color }}>
                                <div className="w-full flex items-center justify-between gap-2">
                                  <div className="text-[9px] font-bold text-black truncate">
                                    {track.name}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      className="h-4 w-5 text-[8px] font-bold border border-black/20 bg-black/10 rounded text-black hover:bg-black/15 active:bg-black/20 transition-colors duration-150 ease-out"
                                    >
                                      M
                                    </button>
                                    <button
                                      type="button"
                                      className="h-4 w-5 text-[8px] font-bold border border-black/20 bg-black/10 rounded text-black hover:bg-black/15 active:bg-black/20 transition-colors duration-150 ease-out"
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

                                <div className="relative h-6 px-3">
                                  {track.clips.map((clip) => (
                                    <div
                                      key={`${track.name}-${clip.label}-${clip.startBeat}`}
                                      className="absolute top-0 h-full rounded-sm border border-black/20 hover:opacity-90 transition-opacity duration-150 ease-out shadow-[1px_1px_0px_0px_rgba(0,0,0,0.35)] flex items-center"
                                      style={{
                                        backgroundColor: track.color,
                                        left: `${clip.startBeat * 16}px`,
                                        width: `${clip.lengthBeats * 16}px`,
                                      }}
                                    >
                                      <div className="px-1.5 w-full">
                                        <div className="text-[8px] font-bold text-black truncate">
                                          {clip.label}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-purple-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                        <span className="font-mono">Live stem preview</span>
                      </div>
                      <span className="text-neutral-500 font-mono">Click M/S to mute or solo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-700">
                <p className="text-sm text-neutral-400 text-center">
                  No special software needed. Upload stems directly from your DAW, and fellow artists use our built-in stem player to give precise feedback.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Track Report - "See what's working" - MOVED UP */}
      <section id="examples" className="py-12 sm:py-16  bg-[#faf8f5] overflow-visible">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">See what&apos;s working</h2>
            <p className="mt-3 text-neutral-600">
              Get multiple reviews on your track. We show you patterns. When 4 out of 5 people say the same thing, that&apos;s not taste -- that&apos;s signal.
            </p>
          </AnimatedSection>

          <AnimatedSection className="relative">
            {/* Decorative doodles */}
            <Sparkle className="pointer-events-none absolute top-6 -right-10 sm:-right-28 lg:-right-44 w-14 h-14 sm:w-20 sm:h-20 text-orange-300 opacity-90 -rotate-12" />
            <img
              src="/doodles/report-doodle.png"
              alt=""
              className="pointer-events-none absolute top-56 -left-24 sm:-left-40 lg:-left-56 w-48 h-48 sm:w-56 sm:h-56 rotate-[-8deg] hidden lg:block"
            />
            <Squiggle className="pointer-events-none absolute -top-10 -right-10 sm:-right-24 lg:-right-40 w-16 h-16 sm:w-28 sm:h-28 text-orange-300 opacity-70 rotate-12" />
            <Dots className="pointer-events-none absolute -bottom-10 right-2 sm:right-6 w-12 h-12 sm:w-16 sm:h-16 text-purple-400 opacity-80 rotate-6" />

            <TrackReportDemo />
          </AnimatedSection>
        </div>
      </section>

      {/* Live Activity - STAYS HERE */}
      <section className="py-10  overflow-hidden bg-[#faf8f5]">
        <div className="mb-6">
          <OnlineListeners />
        </div>
        <ActivityFeed />
      </section>

      {/* How It Works - MOVED DOWN */}
      <section className="py-12 sm:py-16 bg-[#faf8f5]">
        <div className="max-w-5xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">How it works</h2>
            <p className="mt-3 text-neutral-600 max-w-2xl mx-auto">
              A simple credit system that keeps feedback flowing. Give a review, get a review.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {/* Step 1 */}
              <div className="bg-white border-2 border-neutral-200 rounded-2xl p-6 text-center shadow-sm">
                <div className="h-14 w-14 bg-purple-100 border-2 border-purple-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-7 w-7 text-purple-600" />
                </div>
                <div className={`${caveat.className} text-purple-600 text-lg mb-1`}>Step 1</div>
                <h3 className="text-lg font-bold mb-2">Upload your track</h3>
                <p className="text-sm text-neutral-600">
                  Drop in your mix or stems. We match it with artists who know your genre.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white border-2 border-neutral-200 rounded-2xl p-6 text-center shadow-sm">
                <div className="h-14 w-14 bg-purple-100 border-2 border-purple-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Headphones className="h-7 w-7 text-purple-600" />
                </div>
                <div className={`${caveat.className} text-purple-600 text-lg mb-1`}>Step 2</div>
                <h3 className="text-lg font-bold mb-2">Review others</h3>
                <p className="text-sm text-neutral-600">
                  Listen to tracks in your genre and give honest, structured feedback. Each review earns you a credit.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white border-2 border-neutral-200 rounded-2xl p-6 text-center shadow-sm">
                <div className="h-14 w-14 bg-purple-100 border-2 border-purple-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-7 w-7 text-purple-600" />
                </div>
                <div className={`${caveat.className} text-purple-600 text-lg mb-1`}>Step 3</div>
                <h3 className="text-lg font-bold mb-2">Get feedback</h3>
                <p className="text-sm text-neutral-600">
                  Spend credits to get reviews on your own tracks. The more you give, the more you get.
                </p>
              </div>
            </div>

            {/* Credit cycle reminder */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-5 py-2.5">
                <Music className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">Give a review, earn a credit. Spend a credit, get a review.</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>


      {/* Artist Earnings */}
      <section className="pb-12 sm:pb-16 pt-0 bg-neutral-900 text-neutral-50 overflow-visible font-sans">
        <div className="w-full overflow-hidden bg-purple-400/10">
          <div className="h-12 flex items-center">
            <div
              className={`${caveat.className} w-full flex gap-6 whitespace-nowrap text-purple-300 text-3xl font-bold leading-none`}
            >
              {Array.from({ length: 60 }).map((_, i) => (
                <span key={i}>new</span>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-6 sm:pt-8">
          <div className="grid gap-8 md:gap-10 md:grid-cols-2 lg:grid-cols-[1fr_380px] items-center">
            <AnimatedSection className="is-visible max-w-xl text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold">PRO artists sell their music</h2>
              <p className="mt-3 text-neutral-300">
                Every track gets a public page. Share it anywhere. When listeners buy through your link, you keep 85% of the sale. Upgrade to PRO to unlock selling and get your music discovered by the right people.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-colors transition-shadow transition-transform duration-150 ease-out active:transition-none motion-reduce:transition-none motion-reduce:transform-none"
                  >
                    Get started free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#pricing">
                  <Button variant="outline" size="lg" className="bg-white/10 text-neutral-50 border-white/20 hover:bg-white/15">
                    See pricing
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection className="is-visible w-full max-w-sm mx-auto md:mx-0 md:max-w-none">
              <div className="bg-neutral-800 border-2 border-neutral-700 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                {/* Header with balance */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 px-3 py-2 border-b-2 border-black/20">
                  <div className="text-[9px] font-bold text-white/80 uppercase tracking-wider">Your Balance</div>
                  <div className="text-lg font-extrabold text-white">$12.50</div>
                </div>

                {/* Recent sales list */}
                <div className="p-3 space-y-1.5">
                  <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-1 mb-2">Recent Sales</div>

                  <div className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 rounded-lg p-2 transition-colors duration-150">
                    <img src="/activity-artwork/1.jpg" alt="" className="h-8 w-8 rounded-md object-cover shadow" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-white truncate">Neon Pulse</div>
                      <div className="text-[11px] text-neutral-500">2 min ago</div>
                    </div>
                    <div className="text-[13px] font-bold text-blue-400">+$0.50</div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 rounded-lg p-2 transition-colors duration-150">
                    <img src="/activity-artwork/5.jpg" alt="" className="h-8 w-8 rounded-md object-cover shadow" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-white truncate">Late Night Taxi</div>
                      <div className="text-[11px] text-neutral-500">via @lofi_curator · 8 min ago</div>
                    </div>
                    <div className="text-[13px] font-bold text-blue-400">+$0.50</div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 rounded-lg p-2 transition-colors duration-150">
                    <img src="/activity-artwork/9.jpg" alt="" className="h-8 w-8 rounded-md object-cover shadow" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-white truncate">Golden Hour</div>
                      <div className="text-[11px] text-neutral-500">15 min ago</div>
                    </div>
                    <div className="text-[13px] font-bold text-blue-400">+$0.50</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 bg-black/20 border-t border-white/5 text-center">
                  <span className="text-[11px] text-neutral-400">PRO feature: Keep <span className="text-blue-400 font-semibold">85%</span> of every sale</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
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
            <Star className="pointer-events-none absolute top-6 -left-6 sm:-left-16 lg:-left-24 w-12 h-12 sm:w-14 sm:h-14 text-purple-400 opacity-90 -rotate-12" />
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
            <h2 className="text-2xl sm:text-3xl font-bold">A community of artists helping artists</h2>
            <p className="mt-3 text-neutral-600">
              Your tracks are automatically shown to artists who share your genre. Everyone reviews, everyone gets reviewed. Quality stays high because every reviewer is rated after each review.
            </p>
          </AnimatedSection>

          <AnimatedSection className="relative">
            {/* Decorative doodles */}
            <Dots className="pointer-events-none absolute -top-10 -right-10 sm:-right-24 lg:-right-44 w-16 h-16 sm:w-24 sm:h-24 text-neutral-950 opacity-80 rotate-12" />
            <Sparkle className="pointer-events-none absolute -top-2 right-2 sm:-right-12 lg:-right-20 w-12 h-12 sm:w-14 sm:h-14 text-orange-300 opacity-85 -rotate-6" />
            <Squiggle className="pointer-events-none absolute -bottom-8 -left-12 sm:-left-24 lg:-left-36 w-32 h-10 sm:w-44 sm:h-12 text-purple-400 opacity-90 rotate-6" />

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
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-4">Simple Pricing</h2>
          <p className="text-center text-neutral-400 mb-12 max-w-xl mx-auto">
            Start free and earn feedback by reviewing. Or go PRO to skip the queue and unlock premium features.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Tier */}
            <div className="bg-neutral-800 border-2 border-neutral-700 rounded-2xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-purple-400 mb-2">Free</h3>
                <div className="text-4xl font-extrabold">$0</div>
                <p className="text-sm text-neutral-400 mt-2">Forever free</p>
              </div>

              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50">Upload tracks</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50">Earn credits by reviewing others</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50">Peer feedback from fellow artists</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50">Genre matching</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50">Public track pages</span>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/signup">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full bg-neutral-700 border-2 border-neutral-600 text-neutral-50 hover:bg-neutral-600"
                  >
                    Get started free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="bg-purple-600 text-white border-2 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative rounded-2xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-black px-3 py-1 border-2 border-black">
                MOST POPULAR
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-black mb-2">Pro</h3>
                <div className="text-5xl font-black">
                  $9.95<span className="text-xl font-black">/mo</span>
                </div>
                <p className="text-sm text-purple-100 mt-2 font-semibold">For serious artists</p>
              </div>

              <div className="space-y-3 text-left mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-purple-600 flex-shrink-0" />
                  <span className="text-sm font-bold">10 credits/month (no reviewing required)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-purple-600 flex-shrink-0" />
                  <span className="text-sm font-semibold">PRO-tier artist reviews</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-purple-600 flex-shrink-0" />
                  <span className="text-sm font-semibold">Priority queue (24h turnaround)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-purple-600 flex-shrink-0" />
                  <span className="text-sm font-semibold">Sell your music (keep 85%)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-purple-600 flex-shrink-0" />
                  <span className="text-sm font-semibold">Analytics dashboard</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-purple-600 flex-shrink-0" />
                  <span className="text-sm font-semibold">Unlimited uploads</span>
                </div>
              </div>

              <Link href="/signup">
                <Button
                  size="lg"
                  className="w-full bg-purple-600 text-white hover:bg-purple-500 active:bg-purple-700 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 ease-out"
                >
                  Get started free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
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
                a: "A peer-to-peer feedback platform for music creators. Upload your tracks, review other artists in your genre, and earn credits you can spend to get feedback on your own music. It's artists helping artists -- no middlemen, no gatekeepers.",
              },
              {
                q: "How do credits work?",
                a: "Every time you review another artist's track, you earn a credit. Spend that credit to get a review on one of your own tracks. It's a simple give-one-get-one system that keeps quality feedback flowing. PRO members get 10 credits per month included, no reviewing required.",
              },
              {
                q: "Is it really free?",
                a: "Yes. Free users can upload tracks and earn unlimited credits by reviewing others. There's no cap on how much feedback you can get -- just keep reviewing and keep earning. PRO is for artists who want credits without reviewing, plus premium features like selling music and analytics.",
              },
              {
                q: "Who reviews my tracks?",
                a: "Other artists on the platform who share your genre. Everyone is both an artist and a reviewer. After each review, you rate the quality -- low-rated reviewers lose access, so the feedback stays useful and honest.",
              },
              {
                q: "Why do I need multiple reviews?",
                a: "One person's feedback is just their taste. With multiple reviews, patterns emerge. If one person says your intro is too long, maybe they're wrong. If most reviewers say it, that's signal worth acting on.",
              },
              {
                q: "What does PRO include?",
                a: "PRO ($9.95/mo) gives you 10 credits every month without reviewing, access to PRO-tier artist reviews, priority queue with 24-hour turnaround, the ability to sell your music and keep 85%, an analytics dashboard, and unlimited uploads.",
              },
              {
                q: "Is my music safe?",
                a: "Yes. Your unreleased tracks are only heard by genre-matched artists reviewing your work. We never share, publish, or leak anything. Once you're ready to release, your track page becomes public.",
              },
              {
                q: "Can I cancel PRO?",
                a: "Yes, anytime. Your tracks and any unspent credits stay on the platform. You can still earn credits by reviewing -- you just lose PRO perks like the monthly credit grant and priority queue.",
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
            <span className="hidden sm:inline text-neutral-600">&bull;</span>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
