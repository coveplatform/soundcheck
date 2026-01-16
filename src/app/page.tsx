import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Headphones, Shield, ArrowRight, Target, Clock, Quote, CheckCircle2, Lock, Users, MessageCircle, Flame, Music, DollarSign } from "lucide-react";
import { ACTIVE_PACKAGE_TYPES, PACKAGES } from "@/lib/metadata";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { TrackReportDemo } from "@/components/landing/track-report-demo";

export default function Home() {
  const pricing = ACTIVE_PACKAGE_TYPES.map((key) => ({ key, ...PACKAGES[key] }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-black/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="text-white" />
            </Link>
            <div className="flex items-center gap-3">
              <AuthButtons theme="dark" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-[calc(100vh-3.5rem)] border-b border-neutral-800 relative overflow-hidden flex flex-col justify-center">
        <div className="absolute top-20 right-10 w-32 h-32 bg-lime-500 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-orange-400 rounded-full blur-2xl opacity-20" />
        <div className="flex items-center justify-center px-4 py-16 sm:py-20 relative">
          <div className="max-w-4xl text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
              Get track feedback from <span className="text-lime-500">artists + listeners</span> in your music community.
            </h1>

            <p className="mt-6 text-neutral-300 text-base sm:text-lg max-w-2xl mx-auto">
              A <span className="text-white font-bold">private feedback marketplace</span> where genre-matched reviewers give you honest, structured feedback on your unreleased tracks.
            </p>

            <p className="mt-4 text-neutral-200 text-lg sm:text-xl font-bold leading-snug">
              <span className="text-orange-400">Reviewers earn $0.50–$1.50 per review.</span> You rate every review to keep quality high.
            </p>

            <p className="mt-3 text-neutral-400 text-sm">
              Upload your track and <span className="text-lime-400 font-bold">earn $0.50</span> every time a reviewer buys it.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-bold text-base px-10 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none">
                  Start trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#examples" className="text-sm font-bold text-black bg-white px-4 py-2 border-2 border-black hover:bg-neutral-50 active:bg-neutral-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none">
                See example report
              </Link>
            </div>

            {/* Social Proof - Inline */}
            <p className="mt-8 text-sm text-neutral-400">
              <span className="text-lime-500 font-bold">500+ reviews</span> delivered
              <span className="mx-2 text-neutral-600">•</span>
              <span className="text-white font-bold">&lt;12h</span> turnaround
              <span className="mx-2 text-neutral-600">•</span>
              <span className="text-lime-500 font-bold">$12,600+</span> in artist sales
            </p>
          </div>
        </div>
      </section>

      {/* Your Track Report Section */}
      <section className="mt-0 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-orange-400 text-black border-y-2 border-black py-12 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Your Track Report
          </h2>
          <p className="mt-3 text-base sm:text-lg font-medium max-w-xl mx-auto text-black/80">
            Analytics, consensus insights, and detailed reviews — all in one place
          </p>
        </div>
      </section>

      <section id="examples" className="py-20 sm:py-24 border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4">
          <TrackReportDemo />

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link href="/signup">
              <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-bold text-base px-10 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none">
                Get your Track Report <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="border-b-2 border-black py-16 bg-lime-500 text-black overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-12 text-center">How it works</h2>

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
                  <div className="h-20 w-20 border-3 border-black bg-black text-lime-500 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                    <step.icon className="h-9 w-9" />
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-xs font-black text-black/60">STEP {step.num}</div>
                    <div className="text-xl font-black">{step.title}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="mx-6 flex items-center">
                    <div className="w-12 h-1 bg-black/30" />
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-black/30" />
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
                  <div className="h-16 w-16 border-2 border-black bg-black text-lime-500 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-black/60">STEP {step.num}</div>
                    <div className="text-xl font-black">{step.title}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="my-4 flex flex-col items-center">
                    <div className="w-1 h-6 bg-black/30" />
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-black/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-neutral-800 py-16 bg-neutral-950">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-8 text-center text-white">Artists who stopped guessing</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border-2 border-black p-6 bg-black/80 backdrop-blur text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <Quote className="h-8 w-8 text-lime-500 mb-4" />
              <p className="text-neutral-200 mb-4">
                &ldquo;I was about to release a track I wasn&apos;t sure about. 4 of 5 reviewers mentioned the intro was too long. Cut it down, and it&apos;s now my best performing release.&rdquo;
              </p>
              <p className="font-bold text-sm">Marcus T.</p>
              <p className="text-xs text-neutral-300">Electronic Producer</p>
            </div>

            <div className="border-2 border-black p-6 bg-black/80 backdrop-blur text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <Quote className="h-8 w-8 text-orange-400 mb-4" />
              <p className="text-neutral-200 mb-4">
                &ldquo;Finally, feedback I can actually use. Not &apos;sounds good&apos; or random hate—specific timestamps, specific suggestions. Worth every penny.&rdquo;
              </p>
              <p className="font-bold text-sm">Jade K.</p>
              <p className="text-xs text-neutral-300">Singer-Songwriter</p>
            </div>

            <div className="border-2 border-black p-6 bg-black/80 backdrop-blur text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <Quote className="h-8 w-8 text-lime-500 mb-4" />
              <p className="text-neutral-200 mb-4">
                &ldquo;The consensus thing is real. When 8 people independently say the same thing, you stop arguing with yourself and just fix it.&rdquo;
              </p>
              <p className="font-bold text-sm">Devon R.</p>
              <p className="text-xs text-neutral-300">Hip-Hop Artist</p>
            </div>

            <div className="border-2 border-black p-6 bg-black/80 backdrop-blur text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <Quote className="h-8 w-8 text-orange-400 mb-4" />
              <p className="text-neutral-200 mb-4">
                &ldquo;I&apos;ve used this for my last 3 releases. The confidence of knowing it&apos;s actually ready before I put it out is priceless.&rdquo;
              </p>
              <p className="font-bold text-sm">Alex M.</p>
              <p className="text-xs text-neutral-300">Indie Rock</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y-2 border-black py-16 bg-orange-400 text-black">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-10 text-center">Why artists choose MixReflect</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-orange-400 border-2 border-black flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h3 className="font-black text-lg mb-1">Genre-matched reviewers</h3>
                  <p className="text-sm text-neutral-600">
                    Your trap beat won&apos;t be reviewed by someone who only listens to country. We match by genre.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-orange-400 border-2 border-black flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h3 className="font-black text-lg mb-1">Results in under 24 hours</h3>
                  <p className="text-sm text-neutral-600">
                    No waiting weeks for feedback. Most reviews complete within hours, not days.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-orange-400 border-2 border-black flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h3 className="font-black text-lg mb-1">Private & secure</h3>
                  <p className="text-sm text-neutral-600">
                    Only assigned reviewers hear your track. We never share, publish, or leak your unreleased work.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-lime-400 border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-black border-2 border-black flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-lime-400" />
                </div>
                <div>
                  <h3 className="font-black text-lg mb-1">Earn from your uploads</h3>
                  <p className="text-sm text-black/70">
                    Reviewers who love your track can buy it for $0.50. You keep the money. Turn feedback into revenue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b border-neutral-800 py-16 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-2">Simple pricing. Real results.</h2>
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
                  className={`relative border-2 border-black bg-white p-8 text-black ${
                    isPopular
                      ? "shadow-[8px_8px_0px_0px_rgba(132,204,22,1)] md:-translate-y-2"
                      : "shadow-[6px_6px_0px_0px_rgba(64,64,64,1)]"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-6 text-xs font-bold bg-lime-500 text-black px-3 py-1 border-2 border-black">
                      RECOMMENDED
                    </span>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl">{p.name}</h3>
                      <p className="text-sm text-neutral-500 mt-1">{p.description}</p>
                    </div>
                    <div className={`h-12 w-12 ${isPopular ? 'bg-lime-500' : 'bg-neutral-100'} border-2 border-black flex items-center justify-center font-black text-lg`}>
                      {p.reviews}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-5xl font-black">${price}<span className="text-lg font-bold text-neutral-400 ml-1">AUD</span></div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {p.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${
                          feature.includes("Consensus") || feature.includes("Pattern")
                            ? "text-orange-500"
                            : "text-lime-600"
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
                    <Button className={`w-full border-2 border-black font-bold py-6 text-base ${
                      isPopular
                        ? "bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600"
                        : "bg-black text-white hover:bg-neutral-800 active:bg-neutral-900"
                    }`}>
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
      <section className="bg-lime-500 text-black py-20 border-y-2 border-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Stop wondering.<br />Start knowing.
          </h2>
          <p className="text-black/70 mb-10 text-lg">
            Your track deserves more than a guess. Get real feedback from real listeners.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-orange-400 text-black hover:bg-orange-300 active:bg-orange-500 font-bold text-base px-10 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none"
              >
                Get Feedback <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <span className="text-sm font-bold text-black bg-orange-400 px-3 py-1 border-2 border-black">First one&apos;s free</span>
          </div>
          <p className="mt-6 text-sm text-black/60">
            No card required • Results in under 12 hours
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-b border-neutral-800 bg-black">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-10 text-white">Questions</h2>
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
                className={`p-4 ${i < arr.length - 1 ? "border-b-2 border-black" : ""}`}
              >
                <summary className="font-black cursor-pointer hover:text-neutral-300 text-white">
                  {item.q}
                </summary>
                <p className="mt-3 text-neutral-300">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* For Reviewers - Compact */}
      <section id="for-reviewers" className="border-b border-neutral-800 py-12 bg-orange-400 text-black">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-orange-400 border-2 border-black flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-black" />
                </div>
                <h2 className="text-2xl font-black">Want to get paid for reviewing?</h2>
              </div>
              <p className="text-black/80">
                Earn $0.50–$1.50 per review. Artists rate your feedback—high ratings unlock PRO tier (3x pay).
              </p>
            </div>
            <Link href="/signup" className="shrink-0">
              <Button className="bg-orange-400 text-black hover:bg-orange-300 active:bg-orange-500 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none">
                Become a Reviewer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-black text-white border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Logo className="text-white" />
            </div>
            <p className="text-neutral-400">
              &copy; {new Date().getFullYear()} MixReflect
            </p>
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
          {/* Payment Trust Badge */}
          <div className="mt-6 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              <span>Secure payments powered by</span>
              <span className="font-bold text-neutral-300 tracking-tight">Stripe</span>
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
