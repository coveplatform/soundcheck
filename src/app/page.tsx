import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Headphones, Shield, ArrowRight, Target, Clock, Quote, CheckCircle2, Lock, Users, MessageCircle, Flame, Music, DollarSign } from "lucide-react";
import { ACTIVE_PACKAGE_TYPES, PACKAGES } from "@/lib/metadata";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { TrackReportDemo } from "@/components/landing/track-report-demo";
import { ActivityFeed } from "@/components/landing/activity-feed";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function Home() {
  const pricing = ACTIVE_PACKAGE_TYPES.map((key) => ({ key, ...PACKAGES[key] }));

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
      <section className="border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div className="max-w-xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 leading-[1.05]">
                Get track feedback from <span className="text-lime-700">artists + listeners</span> in your music community.
              </h1>

              <p className="mt-6 text-neutral-700 text-base sm:text-lg leading-relaxed">
                A <span className="text-neutral-950 font-semibold">private feedback marketplace</span> where genre-matched reviewers give you honest, structured feedback on your unreleased tracks.
              </p>

              <p className="mt-4 text-neutral-700 text-base sm:text-lg leading-relaxed">
                <span className="text-neutral-950 font-semibold">Reviewers earn $0.50–$1.50 per review.</span> You rate every review to keep quality high.
              </p>

              <p className="mt-4 text-neutral-600 text-sm">
                Upload your track and <span className="text-neutral-950 font-semibold">earn $0.50</span> every time a reviewer buys it.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/signup">
                  <Button size="lg" variant="primary">
                    Start trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link
                  href="#examples"
                  className="text-sm font-semibold text-neutral-950 underline underline-offset-4 hover:text-neutral-700"
                >
                  See example report
                </Link>
              </div>

              {/* Social Proof - Inline */}
              <p className="mt-8 text-sm text-neutral-600">
                <span className="text-lime-700 font-semibold">500+ reviews</span> delivered
                <span className="mx-2 text-neutral-400">•</span>
                <span className="text-neutral-950 font-semibold">&lt;12h</span> turnaround
                <span className="mx-2 text-neutral-400">•</span>
                <span className="text-orange-600 font-semibold">$12,600+</span> in artist sales
              </p>
            </div>

            <div className="lg:pt-2">
              <div className="border border-neutral-200 bg-white shadow-sm">
                <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-neutral-200">
                  <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Live activity</div>
                  <div className="mt-1 text-sm text-neutral-600">Recent reviews and sales happening now.</div>
                </div>
                <div className="p-4 sm:p-5">
                  <ActivityFeed />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Track Report Section */}
      <section className="py-12 sm:py-14 border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Your Track Report
          </h2>
          <p className="mt-3 text-base sm:text-lg font-medium max-w-xl mx-auto text-neutral-600">
            Analytics, consensus insights, and detailed reviews — all in one place
          </p>
        </div>
      </section>

      <section id="examples" className="py-16 sm:py-20 border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <TrackReportDemo />

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link href="/signup">
              <Button size="lg">
                Get your Track Report <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="border-b border-neutral-200 py-16 bg-[#f7f7f5] text-neutral-950 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-12 text-center">How it works</h2>

          {/* Desktop: Horizontal flow with arrows */}
          <div className="hidden lg:flex items-center justify-center gap-0">
            {[
              { num: "1", title: "Submit", icon: Music },
              { num: "2", title: "Match", icon: Users },
              { num: "3", title: "Review", icon: MessageCircle },
              { num: "4", title: "Clarity", icon: Flame },
            ].map((step, i, arr) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="h-20 w-20 border border-neutral-200 bg-white text-lime-700 flex items-center justify-center shadow-sm">
                    <step.icon className="h-9 w-9" />
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-xs font-semibold text-neutral-500">STEP {step.num}</div>
                    <div className="text-xl font-extrabold">{step.title}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="mx-6 flex items-center">
                    <div className="w-12 h-1 bg-neutral-300" />
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-neutral-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: Vertical flow with arrows */}
          <div className="lg:hidden flex flex-col items-center gap-0">
            {[
              { num: "1", title: "Submit", icon: Music },
              { num: "2", title: "Match", icon: Users },
              { num: "3", title: "Review", icon: MessageCircle },
              { num: "4", title: "Clarity", icon: Flame },
            ].map((step, i, arr) => (
              <div key={step.num} className="flex flex-col items-center">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 border border-neutral-200 bg-white text-lime-700 flex items-center justify-center shadow-sm">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-500">STEP {step.num}</div>
                    <div className="text-xl font-extrabold">{step.title}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="my-4 flex flex-col items-center">
                    <div className="w-1 h-6 bg-neutral-300" />
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-neutral-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-neutral-200 py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-8 text-center text-neutral-950">Artists who stopped guessing</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-neutral-200 p-6 bg-[#f7f7f5] text-neutral-950 shadow-sm">
              <Quote className="h-8 w-8 text-lime-700 mb-4" />
              <p className="text-neutral-700 mb-4">
                &ldquo;I was about to release a track I wasn&apos;t sure about. 4 of 5 reviewers mentioned the intro was too long. Cut it down, and it&apos;s now my best performing release.&rdquo;
              </p>
              <p className="font-bold text-sm">Marcus T.</p>
              <p className="text-xs text-neutral-600">Electronic Producer</p>
            </div>

            <div className="border border-neutral-200 p-6 bg-[#f7f7f5] text-neutral-950 shadow-sm">
              <Quote className="h-8 w-8 text-orange-600 mb-4" />
              <p className="text-neutral-700 mb-4">
                &ldquo;Finally, feedback I can actually use. Not &apos;sounds good&apos; or random hate—specific timestamps, specific suggestions. Worth every penny.&rdquo;
              </p>
              <p className="font-bold text-sm">Jade K.</p>
              <p className="text-xs text-neutral-600">Singer-Songwriter</p>
            </div>

            <div className="border border-neutral-200 p-6 bg-[#f7f7f5] text-neutral-950 shadow-sm">
              <Quote className="h-8 w-8 text-lime-700 mb-4" />
              <p className="text-neutral-700 mb-4">
                &ldquo;The consensus thing is real. When 8 people independently say the same thing, you stop arguing with yourself and just fix it.&rdquo;
              </p>
              <p className="font-bold text-sm">Devon R.</p>
              <p className="text-xs text-neutral-600">Hip-Hop Artist</p>
            </div>

            <div className="border border-neutral-200 p-6 bg-[#f7f7f5] text-neutral-950 shadow-sm">
              <Quote className="h-8 w-8 text-orange-600 mb-4" />
              <p className="text-neutral-700 mb-4">
                &ldquo;I&apos;ve used this for my last 3 releases. The confidence of knowing it&apos;s actually ready before I put it out is priceless.&rdquo;
              </p>
              <p className="font-bold text-sm">Alex M.</p>
              <p className="text-xs text-neutral-600">Indie Rock</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-neutral-200 py-16 bg-[#f7f7f5] text-neutral-950">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-10 text-center">Why artists choose MixReflect</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white border border-neutral-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-orange-100 border border-orange-200 flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-orange-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg mb-1">Genre-matched reviewers</h3>
                  <p className="text-sm text-neutral-700">
                    Your trap beat won&apos;t be reviewed by someone who only listens to country. We match by genre.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-orange-100 border border-orange-200 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-orange-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg mb-1">Results in under 24 hours</h3>
                  <p className="text-sm text-neutral-700">
                    No waiting weeks for feedback. Most reviews complete within hours, not days.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-orange-100 border border-orange-200 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-orange-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg mb-1">Private & secure</h3>
                  <p className="text-sm text-neutral-700">
                    Only assigned reviewers hear your track. We never share, publish, or leak your unreleased work.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-lime-50 border border-lime-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-lime-100 border border-lime-200 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-lime-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg mb-1">Earn from your uploads</h3>
                  <p className="text-sm text-neutral-700">
                    Reviewers who love your track can buy it for $0.50. You keep the money. Turn feedback into revenue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-neutral-800 py-16 bg-neutral-900 text-neutral-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-2">Simple pricing. Real results.</h2>
            <p className="text-neutral-300 mb-2">
              More reviews = clearer patterns = more confidence.
            </p>
            <p className="text-sm text-neutral-400">
              First review free, no card required
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {pricing.map((p) => {
              const price = (p.price / 100).toFixed(2);
              const isPopular = p.key === "STANDARD";

              return (
                <div
                  key={p.key}
                  className={`relative border border-neutral-700/70 bg-neutral-950/30 p-8 text-neutral-50 shadow-sm ${
                    isPopular ? "ring-1 ring-lime-400/30" : ""
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-6 text-xs font-semibold bg-lime-400/15 text-lime-200 px-3 py-1 border border-lime-400/30">
                      RECOMMENDED
                    </span>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl">{p.name}</h3>
                      <p className="text-sm text-neutral-300 mt-1">{p.description}</p>
                    </div>
                    <div className={`h-12 w-12 ${isPopular ? 'bg-lime-400/15' : 'bg-neutral-800/60'} border border-neutral-700/70 flex items-center justify-center font-extrabold text-lg`}>
                      {p.reviews}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-5xl font-extrabold">${price}<span className="text-lg font-semibold text-neutral-300 ml-1">AUD</span></div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {p.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${
                          feature.includes("Consensus") || feature.includes("Pattern")
                            ? "text-orange-300"
                            : "text-lime-300"
                        }`} />
                        <span className={`text-sm ${
                          feature.includes("Consensus") || feature.includes("Pattern")
                            ? "font-semibold"
                            : ""
                        }`}>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/signup">
                    <Button className={`w-full font-bold py-6 text-base ${
                      isPopular
                        ? "bg-lime-400 text-black hover:bg-lime-300 active:bg-lime-500 border-0"
                        : "bg-transparent text-neutral-50 hover:bg-neutral-800 active:bg-neutral-800 border border-neutral-500"
                    } focus-visible:ring-neutral-200 focus-visible:ring-offset-neutral-900`}>
                      Get {p.reviews} Reviews
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900 text-neutral-50 py-20 border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Stop wondering.<br />Start knowing.
          </h2>
          <p className="text-neutral-300 mb-10 text-lg">
            Your track deserves more than a guess. Get real feedback from real listeners.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                variant="primary"
                className="focus-visible:ring-neutral-200 focus-visible:ring-offset-neutral-900"
              >
                Get Feedback <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <span className="text-sm font-semibold text-lime-200 bg-lime-400/15 px-3 py-1 border border-lime-400/30">First one&apos;s free</span>
          </div>
          <p className="mt-6 text-sm text-neutral-400">
            No card required • Results in under 12 hours
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-b border-neutral-200 bg-[#f7f7f5]">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-10 text-neutral-950">Questions</h2>
          <div className="space-y-0 border border-neutral-200 bg-white shadow-sm">
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

      {/* For Reviewers - Compact */}
      <section id="for-reviewers" className="border-b border-neutral-200 py-12 bg-white text-neutral-950">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-orange-100 border border-orange-200 flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-orange-700" />
                </div>
                <h2 className="text-2xl font-extrabold">Want to get paid for reviewing?</h2>
              </div>
              <p className="text-neutral-700">
                Earn $0.50–$1.50 per review. Artists rate your feedback—high ratings unlock PRO tier (3x pay).
              </p>
            </div>
            <Link href="/signup" className="shrink-0">
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
