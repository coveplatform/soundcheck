import Link from "next/link";
import Image from "next/image";
import { Caveat } from "next/font/google";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { TrackReportDemo } from "@/components/landing/track-report-demo";
import { PeerModelSection } from "@/components/landing/peer-model-section";
import { ActivityFeed } from "@/components/landing/activity-feed";
import { BrowserMockup } from "@/components/landing/browser-mockup";
import { TrackPageMockup } from "@/components/landing/track-page-mockup";

import { Sparkle, Star, Squiggle, Dots } from "@/components/landing/doodles";
import { AnimatedSection } from "@/components/landing/animated-section";
import { OnlineListeners } from "@/components/landing/online-listeners";
import { HeroCTA } from "@/components/landing/hero-cta";
import { SignupLink } from "@/components/landing/signup-link";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

const discoverArtwork = [
  "/activity-artwork/1.jpg",
  "/activity-artwork/5.jpg",
  "/activity-artwork/9.jpg",
  "/activity-artwork/12.jpg",
  "/activity-artwork/18.jpg",
  "/activity-artwork/22.jpg",
  "/activity-artwork/27.jpg",
  "/activity-artwork/31.jpg",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-950" style={{ paddingTop: "56px" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8f5]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Logo />
              </Link>
              <Link
                href="/blog"
                className="hidden sm:block text-sm font-bold text-black/40 hover:text-black transition-colors"
              >
                Journal
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
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-950 leading-[1.05]">
            Find out what&apos;s working<br />
            <span className="text-purple-600">in your track.</span>
          </h1>

          <p className="mt-8 text-neutral-700 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            Real artists in your genre listen and tell you exactly what&apos;s landing — and what to change before you release.
          </p>

          <HeroCTA />

          <p className="mt-6 text-sm text-neutral-7000">
            Free to start • Earn credits by reviewing others • No credit card required
          </p>

        </div>

        {/* Listeners + Activity Feed */}
        <div className="mt-2 mb-6">
          <OnlineListeners />
        </div>
        <div className="pb-12">
          <ActivityFeed />
        </div>
      </section>

      {/* Track Report - "See what's working" */}
      <section id="examples" className="py-12 sm:py-16  bg-[#faf8f5] overflow-visible">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection className="mb-12">
            <div className="grid sm:grid-cols-2 gap-10 sm:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950 leading-[1.1]">See what&apos;s working</h2>
                <p className="mt-5 text-neutral-600 text-lg max-w-xl">
                  Get multiple reviews on your track and we surface the patterns. When 4 out of 5 people flag the same thing, that&apos;s not opinion — that&apos;s something worth fixing.
                </p>
              </div>
              <div className="relative rounded-2xl overflow-hidden shadow-xl" style={{ aspectRatio: "16/9" }}>
                <Image src="/whats-working.jpg" alt="See what's working" fill className="object-cover" sizes="50vw" />
              </div>
            </div>
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

      {/* Peer Model — why it works */}
      <PeerModelSection />


      {/* Weekly Discover — immersive dark section */}
      <section className="pb-16 sm:pb-24 pt-0 bg-black text-neutral-50 overflow-visible font-sans relative">
        {/* Radial glow background */}
        <div className="absolute inset-0 opacity-60 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(0,240,255,0.10) 0%, rgba(168,85,247,0.05) 40%, transparent 70%)",
        }} />

        <div className="w-full overflow-hidden bg-cyan-400/5">
          <div className="h-12 flex items-center">
            <div
              className={`${caveat.className} w-full flex gap-6 whitespace-nowrap text-cyan-400/40 text-3xl font-bold leading-none`}
            >
              {Array.from({ length: 60 }).map((_, i) => (
                <span key={i}>discover</span>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pt-12 sm:pt-16 relative">
          {/* Heading */}
          <AnimatedSection className="max-w-2xl mb-14 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]">
              Explore music{" "}
              <span className="relative inline-block">
                <span className="relative z-10">in 3D</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-cyan-400/30 -rotate-[0.5deg] z-0" />
              </span>
            </h2>
            <p className="mt-5 text-neutral-400 text-lg max-w-xl">
              Upload a track and it appears in the Discover space instantly. Float through a galaxy of independent music, click any album to listen.
            </p>
          </AnimatedSection>

          <AnimatedSection className="relative">
            <div className="relative max-w-3xl mx-auto">
              {/* Floating album artwork grid — simulating the 3D space */}
              <div className="relative h-[320px] sm:h-[380px] flex items-center justify-center">
                {/* Glow orb behind */}
                <div className="absolute w-64 h-64 rounded-full opacity-20 blur-3xl" style={{
                  background: "radial-gradient(circle, rgba(0,240,255,0.4) 0%, rgba(168,85,247,0.2) 50%, transparent 70%)",
                  top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                }} />

                {/* Album cards floating at different depths — real artwork */}
                {[
                  { x: "8%", y: "15%", rot: -8, size: 90, glow: "#00f0ff", z: 10 },
                  { x: "28%", y: "5%", rot: 4, size: 110, glow: "#a855f7", z: 30 },
                  { x: "52%", y: "12%", rot: -3, size: 100, glow: "#ff2d9b", z: 20 },
                  { x: "75%", y: "8%", rot: 6, size: 85, glow: "#fbbf24", z: 15 },
                  { x: "15%", y: "55%", rot: 5, size: 80, glow: "#10b981", z: 12 },
                  { x: "38%", y: "48%", rot: -6, size: 120, glow: "#00f0ff", z: 35 },
                  { x: "62%", y: "52%", rot: 3, size: 95, glow: "#a855f7", z: 25 },
                  { x: "82%", y: "45%", rot: -4, size: 75, glow: "#ff2d9b", z: 8 },
                ].map((card, i) => (
                  <div
                    key={i}
                    className="absolute rounded-xl overflow-hidden"
                    style={{
                      left: card.x,
                      top: card.y,
                      width: card.size,
                      height: card.size,
                      transform: `rotate(${card.rot}deg)`,
                      zIndex: card.z,
                      boxShadow: `0 0 25px ${card.glow}20, 0 8px 32px rgba(0,0,0,0.6)`,
                      border: `1px solid ${card.glow}30`,
                    }}
                  >
                    <Image
                      src={discoverArtwork[i]}
                      alt=""
                      fill
                      className="object-cover"
                      sizes={`${card.size}px`}
                    />
                  </div>
                ))}

                {/* Faint grid lines — holographic floor effect */}
                <div className="absolute bottom-0 left-0 right-0 h-24 opacity-10" style={{
                  background: "repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,240,255,0.3) 39px, rgba(0,240,255,0.3) 40px), repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,240,255,0.3) 39px, rgba(0,240,255,0.3) 40px)",
                  maskImage: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)",
                }} />
              </div>

              {/* CTA */}
              <div className="mt-8 text-center">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/discover">
                    <Button
                      size="lg"
                      className="bg-white/[0.08] text-white hover:bg-white/[0.14] font-black border border-white/[0.12] hover:border-white/[0.2] transition-all"
                    >
                      Enter the space <ArrowRight className="ml-2 h-4 w-4 text-cyan-400" />
                    </Button>
                  </Link>
                  <SignupLink>
                    <Button
                      size="lg"
                      className="bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all"
                    >
                      Get started free
                    </Button>
                  </SignupLink>
                </div>
                <p className="mt-4 text-sm text-neutral-7000">No account needed to explore • Upload a track to appear instantly</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Your Music Has a Home */}
      <section className="py-12 sm:py-16  bg-[#faf8f5] overflow-visible">
        <div className="max-w-5xl mx-auto px-4">
          <AnimatedSection className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950 leading-[1.1]">Your music has a home</h2>
            <p className="mt-5 text-neutral-600 text-lg max-w-xl">
              Every track you upload gets its own page. Listeners can discover it, listen, and share it with their audience.
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

      {/* Breakthrough */}
      <section className="bg-[#0f0a24] text-neutral-50 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 py-20 sm:py-28">
          <div className="grid sm:grid-cols-2 gap-12 sm:gap-20 items-center">
            {/* Left — editorial text */}
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1] mb-6">
                Break<br />through.
              </h2>
              <p style={{ fontSize: "16px", color: "rgba(196,179,247,0.55)", lineHeight: 1.8, marginBottom: 32, maxWidth: 380 }}>
                Every day, the highest-scored track from the community&apos;s peer reviews gets featured. No votes. No campaigns. Just the music that earned it.
              </p>
              <Link
                href="/breakthrough"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 28px",
                  borderRadius: 8,
                  backgroundColor: "#c4b3f7",
                  color: "#0f0a24",
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Today&apos;s pick
              </Link>
            </div>

            {/* Right — hero image */}
            <div
              style={{
                borderRadius: 20,
                overflow: "hidden",
                border: "1px solid rgba(196,179,247,0.12)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
                aspectRatio: "16/9",
                position: "relative",
              }}
            >
              <Image
                src="/charts-hero.jpg"
                alt="Breakthrough"
                fill
                className="object-cover"
                sizes="50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-neutral-900 text-neutral-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-4">Simple Pricing</h2>
          <p className="text-center text-neutral-400 mb-12 max-w-2xl mx-auto">
            Start free. Earn credits by reviewing others. Upgrade to Pro when you&apos;re ready to move faster.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free tier */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-purple-400 mb-1">Free</h3>
                <p className="text-sm text-neutral-400">For getting started</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-neutral-500 text-sm">/forever</span>
                </div>
              </div>

              <div className="space-y-3 text-left mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50"><span className="font-bold">1 track</span> in review at a time</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50"><span className="font-bold">Earn credits</span> by reviewing others</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50">Structured peer feedback</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50">Full analytics dashboard</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50">Public track sharing page</span>
                </div>
              </div>

              <SignupLink>
                <Button
                  size="lg"
                  className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all rounded-xl"
                >
                  Get started free
                </Button>
              </SignupLink>
            </div>

            {/* Pro tier */}
            <div className="bg-neutral-800 border-2 border-purple-500 rounded-2xl p-8 relative shadow-lg shadow-purple-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  RECOMMENDED
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-purple-400 mb-1">Pro</h3>
                <p className="text-sm text-neutral-400">For serious artists</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$24.95</span>
                  <span className="text-neutral-500 text-sm">/month</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">30 credits/month · cancel anytime</p>
              </div>

              <div className="space-y-3 text-left mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50"><span className="font-bold">30 credits</span> every month</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50"><span className="font-bold">Up to 10 reviews</span> per track</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50"><span className="font-bold">3 tracks</span> in review at once</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50"><span className="font-bold">Priority</span> placement</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50">Top up anytime with $9.95 credit packs</span>
                </div>
              </div>

              <SignupLink>
                <Button
                  size="lg"
                  className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all rounded-xl"
                >
                  Start free, upgrade later
                </Button>
              </SignupLink>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-[#faf8f5]">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-10 text-neutral-950">Questions</h2>
          <div className="space-y-0 rounded-2xl bg-white shadow-md overflow-hidden">
            {[
              {
                q: "Where can I get honest feedback on my music?",
                a: "MixReflect is built for exactly that. Upload your track and genre-matched artists review it with structured, honest feedback. You start with one free credit — no credit card required.",
              },
              {
                q: "What is MixReflect?",
                a: "MixReflect is the fastest way to find out what's actually working in your track before you release it. Upload your music, get honest structured feedback from genre-matched artists within hours, and see the patterns across multiple listens. Artists help each other improve — no middlemen, no gatekeepers.",
              },
              {
                q: "How do credits work?",
                a: "Every time you review another artist's track, you earn a credit. Spend that credit to get a review on one of your own tracks. It's a simple give-one-get-one system that keeps quality feedback flowing.",
              },
              {
                q: "Do I need to pay to get music feedback?",
                a: "No. MixReflect is free to use. You earn credits by reviewing other artists' tracks, then spend those credits to get reviews on your own music. No upfront cost, no credit card required. If you'd rather not grind, grab a 10-credit pack for $9.95, or go Pro ($24.95/month) for 30 credits every month plus perks.",
              },
              {
                q: "Is it really free?",
                a: "Yes. You can upload tracks, earn credits by reviewing, and access full analytics — all for free, forever. Pro is for artists who want to move faster with more tracks in review at once.",
              },
              {
                q: "What does Pro get me?",
                a: "Pro gives you 30 fresh credits every month — enough to submit several tracks with multiple reviews each. Up to 3 tracks in review at once, up to 10 reviews per track, plus priority placement. $24.95/month, cancel anytime. Need more in a busy month? Top up with a $9.95 credit pack any time.",
              },
              {
                q: "Who reviews my tracks?",
                a: "Other artists on the platform who share your genre. Everyone is both an artist and a reviewer. After each review, you rate the quality — low-rated reviewers lose access, so the feedback stays useful and honest.",
              },
              {
                q: "Why do I need multiple reviews?",
                a: "One person's feedback is just their taste. With multiple reviews, patterns emerge. If one person says your intro is too long, maybe they're wrong. If most reviewers say it, that's signal worth acting on.",
              },
              {
                q: "How do I know if my track is ready to release?",
                a: "When multiple people who don't know each other say the same thing — that's your signal. MixReflect shows you patterns across your reviews. If four out of five reviewers flag the same issue, it's not taste, it's something worth fixing before you put it out.",
              },
              {
                q: "Is my music safe?",
                a: "Yes. Your unreleased tracks are only heard by genre-matched artists reviewing your work. We never share, publish, or leak anything. You can choose to allow your music to be public and discoverable.",
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
