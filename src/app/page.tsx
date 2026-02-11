import Link from "next/link";
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
import { DiscoverMockup } from "@/components/landing/discover-mockup";
import { Sparkle, Star, Squiggle, Dots } from "@/components/landing/doodles";
import { AnimatedSection } from "@/components/landing/animated-section";
import { OnlineListeners } from "@/components/landing/online-listeners";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

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
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-950 leading-[1.05]">
            Get real feedback.<br />
            <span className="text-purple-600">From real artists.</span>
          </h1>

          <p className="mt-8 text-neutral-700 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            Upload your track, review others in your genre, and get honest structured feedback from fellow producers. Genre-matched, artist-to-artist.
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
            Start with <span className="font-bold text-purple-600">2 free credits</span> • Earn more by reviewing • No credit card required
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
          <AnimatedSection className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950 leading-[1.1]">See what&apos;s working</h2>
            <p className="mt-5 text-neutral-600 text-lg max-w-xl">
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

      {/* Peer Model — why it works */}
      <PeerModelSection />

      {/* Social Proof Stats */}
      <section className="py-14 sm:py-20 bg-[#faf8f5]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 sm:gap-12">
            <div className="text-center">
              <p className="text-4xl sm:text-6xl lg:text-7xl font-black text-neutral-950 tracking-tight">2,847</p>
              <p className="text-xs sm:text-sm font-semibold text-neutral-500 mt-2">Tracks reviewed</p>
            </div>
            <div className="text-center">
              <p className="text-4xl sm:text-6xl lg:text-7xl font-black text-purple-600 tracking-tight">&lt;4hrs</p>
              <p className="text-xs sm:text-sm font-semibold text-neutral-500 mt-2">Avg turnaround</p>
            </div>
            <div className="text-center">
              <p className="text-4xl sm:text-6xl lg:text-7xl font-black text-neutral-950 tracking-tight">1,200+</p>
              <p className="text-xs sm:text-sm font-semibold text-neutral-500 mt-2">Artists in the community</p>
            </div>
          </div>
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950 leading-[1.1]">Your music has a home</h2>
            <p className="mt-5 text-neutral-600 text-lg max-w-xl">
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950 leading-[1.1]">A community of artists helping artists</h2>
            <p className="mt-5 text-neutral-600 text-lg max-w-xl">
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
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-purple-400 mb-2">Free</h3>
                <div className="text-4xl font-extrabold">$0</div>
                <p className="text-sm text-neutral-400 mt-2">Forever free</p>
              </div>

              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50"><span className="font-bold">2 free credits</span> to start</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50">Upload tracks &amp; get peer reviews</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50"><span className="font-bold">5 reviews per day</span> to earn credits</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50">Genre-matched feedback</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50">Buy credit packs anytime</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-50">Unlock <span className="font-bold">$1.50/review</span> as PRO Reviewer</span>
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
                    className="w-full bg-neutral-700 border border-neutral-600 text-neutral-50 hover:bg-neutral-600 rounded-xl"
                  >
                    Get started free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="bg-purple-600 text-white border border-purple-500 p-8 shadow-lg relative rounded-2xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-purple-300 text-xs font-black px-3 py-1 rounded-full">
                MOST POPULAR
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-black mb-2">Pro</h3>
                <div className="text-5xl font-black">
                  $9.95<span className="text-xl font-black">/mo</span>
                </div>
                <p className="text-sm text-white/60 mt-2 font-semibold">For serious artists</p>
              </div>

              <div className="space-y-3 text-left mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
                  <span className="text-sm font-bold">Everything in Free, plus:</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
                  <span className="text-sm font-bold">40 credits/month (no reviewing required)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
                  <span className="text-sm font-bold">Unlimited reviews per day</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
                  <span className="text-sm font-semibold">Sell your music &amp; keep 85%</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
                  <span className="text-sm font-semibold">Portfolio analytics dashboard</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
                  <span className="text-sm font-semibold">Business &amp; earnings dashboard</span>
                </div>
              </div>

              <Link href="/signup">
                <Button
                  size="lg"
                  className="w-full bg-white text-purple-700 hover:bg-purple-50 active:bg-purple-100 font-black rounded-xl border border-white shadow-lg transition-colors duration-150 ease-out"
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
                a: "Every time you review another artist's track, you earn a credit. Spend that credit to get a review on one of your own tracks. It's a simple give-one-get-one system that keeps quality feedback flowing. PRO members get 40 credits per month included, no reviewing required.",
              },
              {
                q: "Can I get paid for reviewing?",
                a: "Yes. Complete 25 reviews with an average artist rating of 4.5 or higher and you'll unlock PRO Reviewer status. PRO Reviewers earn $1.50 cash per review on top of the usual credit. You can track your progress in the review queue sidebar.",
              },
              {
                q: "Is it really free?",
                a: "Yes. Free users can upload tracks and earn credits by reviewing up to 5 tracks per day. There's no cap on how much feedback you can get -- just keep reviewing and keep earning. PRO unlocks unlimited daily reviews, 40 credits/month without reviewing, plus premium features like selling music and analytics.",
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
                a: "PRO ($9.95/mo) gives you 40 credits every month without reviewing, the ability to sell your music and keep 85%, a portfolio analytics dashboard to track your progress across tracks, and a business dashboard to manage your earnings. You can still earn extra credits by reviewing too.",
              },
              {
                q: "Is my music safe?",
                a: "Yes. Your unreleased tracks are only heard by genre-matched artists reviewing your work. We never share, publish, or leak anything. You can choose to allow your music to be public and discoverable.",
              },
              {
                q: "Can I cancel PRO?",
                a: "Yes, anytime. Your tracks and any unspent credits stay on the platform. You can still earn credits by reviewing -- you just lose PRO perks like the monthly credit grant, selling music, and analytics dashboards.",
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
