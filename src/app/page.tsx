import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Headphones, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { TrackReportDemo } from "@/components/landing/track-report-demo";
import { ActivityFeed } from "@/components/landing/activity-feed";
import { BrowserMockup } from "@/components/landing/browser-mockup";
import { TrackPageMockup } from "@/components/landing/track-page-mockup";
import { DiscoverMockup } from "@/components/landing/discover-mockup";
import { EarningsMockup } from "@/components/landing/earnings-mockup";
import { Sparkle, MusicNote, Star, Squiggle, Circle, Dots } from "@/components/landing/doodles";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function Home() {
  return (
    <div className={`${spaceGrotesk.className} min-h-screen bg-[#f7f7f5] text-neutral-950`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-[#f7f7f5]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Logo />
              </Link>
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-700">
                <Link href="#examples" className="hover:text-neutral-950">
                  Example report
                </Link>
                <Link href="#pricing" className="hover:text-neutral-950">
                  Pricing
                </Link>
                <Link href="#for-reviewers" className="hover:text-neutral-950">
                  Reviewers
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <AuthButtons theme="light" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-neutral-200 overflow-visible">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center relative">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 leading-[1.05]">
            A home for your music to <span className="text-lime-700">grow</span>
          </h1>

          <p className="mt-6 text-neutral-700 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Upload your tracks. Get real feedback from people who love your genre. Earn when others discover and share your music.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" variant="primary">
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <span className="text-sm text-neutral-500">$9.95/mo · Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Live Activity */}
      <section className="py-10 border-b border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-500"></span>
          </span>
          <span className="text-sm font-medium text-neutral-600">Happening now</span>
        </div>
        <ActivityFeed />
      </section>

      {/* Your Music Has a Home */}
      <section className="py-16 sm:py-20 border-b border-neutral-200 bg-white overflow-visible">
        <div className="max-w-5xl mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">Your music has a home</h2>
            <p className="mt-3 text-neutral-600">
              Every track you upload gets its own page. Listeners can discover it, buy it, and share it with their audience.
            </p>
          </div>

          <div className="relative">
            {/* Decorative doodles */}
            <Sparkle className="pointer-events-none absolute -top-10 -left-10 sm:-left-24 lg:-left-40 w-16 h-16 sm:w-24 sm:h-24 text-neutral-950 opacity-90 rotate-12" />
            <Star className="pointer-events-none absolute top-6 -left-6 sm:-left-16 lg:-left-24 w-12 h-12 sm:w-14 sm:h-14 text-lime-500 opacity-90 -rotate-12" />
            <Squiggle className="pointer-events-none absolute -bottom-10 -right-10 sm:-right-28 lg:-right-44 w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 text-orange-300 opacity-60 rotate-6" />

            <BrowserMockup url="mixreflect.com/track/midnight-drive">
              <TrackPageMockup />
            </BrowserMockup>
          </div>
        </div>
      </section>

      {/* Discover & Review */}
      <section className="py-16 sm:py-20 border-b border-neutral-200 bg-[#f7f7f5] overflow-visible">
        <div className="max-w-5xl mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">A community of listeners</h2>
            <p className="mt-3 text-neutral-600">
              Reviewers browse by genre and discover tracks to review. They buy your track, listen deeply, and give structured feedback. When they love it, they share it with their fans.
            </p>
          </div>

          <div className="relative">
            {/* Decorative doodles */}
            <Dots className="pointer-events-none absolute -top-10 -right-10 sm:-right-24 lg:-right-44 w-16 h-16 sm:w-24 sm:h-24 text-neutral-950 opacity-80 rotate-12" />
            <Sparkle className="pointer-events-none absolute -top-2 right-2 sm:-right-12 lg:-right-20 w-12 h-12 sm:w-14 sm:h-14 text-orange-300 opacity-85 -rotate-6" />
            <Squiggle className="pointer-events-none absolute -bottom-8 -left-12 sm:-left-24 lg:-left-36 w-32 h-10 sm:w-44 sm:h-12 text-lime-400 opacity-90 rotate-6" />

            <BrowserMockup url="mixreflect.com/discover">
              <DiscoverMockup />
            </BrowserMockup>
          </div>
        </div>
      </section>

      {/* Earnings */}
      <section className="py-16 sm:py-20 border-b border-neutral-200 bg-[#f7f7f5] overflow-visible">
        <div className="max-w-5xl mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">Your music earns</h2>
            <p className="mt-3 text-neutral-600">
              You earn $0.50 every time someone buys your track. When reviewers share your music with their fans, they earn a commission—and you still get paid. Even if you&apos;re starting from zero, your first listeners are built in.
            </p>
          </div>

          <div className="relative">
            {/* Decorative doodles */}
            <Star className="pointer-events-none absolute top-10 -left-8 sm:-left-24 lg:-left-40 w-12 h-12 sm:w-14 sm:h-14 text-lime-500 opacity-90 rotate-12" />
            <MusicNote className="pointer-events-none absolute -top-8 -right-10 sm:-right-28 lg:-right-44 w-20 h-20 sm:w-28 sm:h-28 text-neutral-950 opacity-85 -rotate-12" />
            <Sparkle className="pointer-events-none absolute top-8 right-2 sm:-right-12 lg:-right-20 w-12 h-12 sm:w-16 sm:h-16 text-orange-300 opacity-90 rotate-6" />
            <Dots className="pointer-events-none absolute -bottom-10 left-1/3 w-14 h-14 sm:w-20 sm:h-20 text-neutral-950 opacity-80 -rotate-6" />

            <BrowserMockup url="mixreflect.com/earnings">
              <EarningsMockup />
            </BrowserMockup>
          </div>
        </div>
      </section>

      {/* Track Report */}
      <section id="examples" className="py-16 sm:py-20 border-b border-neutral-200 bg-white overflow-visible">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">See what&apos;s working</h2>
            <p className="mt-3 text-neutral-600">
              Your Track Report shows patterns across all your reviews. When multiple people say the same thing, that&apos;s not taste—that&apos;s signal.
            </p>
          </div>

          <div className="relative">
            {/* Decorative doodles */}
            <Sparkle className="pointer-events-none absolute top-6 -left-10 sm:-left-28 lg:-left-44 w-14 h-14 sm:w-20 sm:h-20 text-neutral-950 opacity-90 -rotate-12" />
            <Squiggle className="pointer-events-none absolute -top-10 -right-10 sm:-right-24 lg:-right-40 w-16 h-16 sm:w-28 sm:h-28 text-orange-300 opacity-70 rotate-12" />
            <Dots className="pointer-events-none absolute -bottom-10 right-2 sm:right-6 w-12 h-12 sm:w-16 sm:h-16 text-lime-500 opacity-80 rotate-6" />

            <TrackReportDemo />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-b border-neutral-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xl sm:text-2xl text-neutral-700 leading-relaxed">
            &ldquo;4 of 5 reviewers mentioned the intro was too long. Cut it down, and it&apos;s now my best performing release.&rdquo;
          </p>
          <p className="mt-4 text-sm text-neutral-500">Marcus T. · Electronic Producer</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-neutral-800 py-16 bg-neutral-900 text-neutral-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center">
            <div className="text-5xl sm:text-6xl font-extrabold">
              $9.95<span className="text-xl sm:text-2xl font-semibold text-neutral-400 ml-1">/mo</span>
            </div>

            <div className="mt-8 space-y-3 text-left max-w-sm mx-auto">
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
                <span>Earn from every sale</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-lime-400 flex-shrink-0" />
                <span>Your track links to share</span>
              </div>
            </div>

            <div className="mt-8">
              <Link href="/signup">
                <Button size="lg" className="bg-lime-400 text-black hover:bg-lime-300 active:bg-lime-500 border-0 font-bold">
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
      <section className="py-16 border-b border-neutral-200 bg-[#f7f7f5]">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-10 text-neutral-950">Questions</h2>
          <div className="space-y-0 rounded-2xl bg-white shadow-md overflow-hidden">
            {[
              {
                q: "What is MixReflect?",
                a: "A platform where your music has a home. Upload tracks, get structured feedback from genre-matched listeners, and earn money when people buy your music. It's part feedback tool, part discovery platform, part income stream.",
              },
              {
                q: "How do I earn money?",
                a: "You earn $0.50 every time someone buys your track—whether that's a reviewer choosing it for feedback or someone discovering it through the platform. Reviewers who love your track can share it with their fans, and when those fans buy, you still get paid.",
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
                a: "20 reviews per month, unlimited track uploads, your own track pages, and earnings from every sale. Need more reviews? Add them anytime for $5.",
              },
              {
                q: "Can I cancel?",
                a: "Yes, anytime. Your tracks stay on the platform and keep earning—you just won't get new reviews until you resubscribe.",
              },
            ].map((item, i, arr) => (
              <details
                key={item.q}
                className={`p-4 ${i < arr.length - 1 ? "border-b border-neutral-200" : ""}`}
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
      <section id="for-reviewers" className="border-b border-neutral-200 py-12 bg-white text-neutral-950">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center text-center md:text-left md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-orange-700" />
                </div>
                <h2 className="text-2xl font-bold">Love discovering new music?</h2>
              </div>
              <p className="text-neutral-600">
                Get paid to listen and give feedback. Earn $0.50–$1.50 per review.
              </p>
            </div>
            <Link href="/signup" className="shrink-0 self-stretch md:self-auto">
              <Button>
                Become a Reviewer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#f7f7f5] text-neutral-950 border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            <p className="text-neutral-500">
              &copy; {new Date().getFullYear()} MixReflect
            </p>
            <div className="flex items-center gap-4 text-neutral-700">
              <Link href="/terms" className="hover:text-neutral-950 font-medium">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-neutral-950 font-medium">
                Privacy
              </Link>
              <Link href="/support" className="hover:text-neutral-950 font-medium">
                Support
              </Link>
            </div>
          </div>
          {/* Payment Trust Badge */}
          <div className="mt-6 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              <span>Secure payments powered by</span>
              <span className="font-bold text-neutral-800 tracking-tight">Stripe</span>
            </div>
            <span className="hidden sm:inline text-neutral-300">•</span>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-lime-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
