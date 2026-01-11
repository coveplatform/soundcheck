import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Headphones, DollarSign, Shield, ArrowRight, Target, Clock, Quote, CheckCircle2, Lock, Users, MessageCircle, Flame } from "lucide-react";
import { ACTIVE_PACKAGE_TYPES, PACKAGES } from "@/lib/metadata";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";

export default function Home() {
  const pricing = ACTIVE_PACKAGE_TYPES.map((key) => ({ key, ...PACKAGES[key] }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-800">
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
      <section className="border-b border-neutral-800 relative overflow-hidden min-h-[calc(100vh-3.5rem)] flex flex-col">
        <div className="absolute top-20 right-10 w-32 h-32 bg-lime-500 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-orange-400 rounded-full blur-2xl opacity-20" />
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 md:py-28 relative flex-1 flex flex-col">
          <div className="text-center flex-1 flex flex-col justify-center">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.08]">
              Get track feedback from <span className="text-lime-500">artists + listeners</span> in your music community.
            </h1>
            <p className="mt-6 text-neutral-200 text-lg sm:text-xl font-bold leading-snug max-w-3xl mx-auto">
              MixReflect is a <span className="text-orange-400">private feedback marketplace</span> — reviewers earn more for higher-quality reviews, and artists rate every review to keep quality high.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-bold text-base px-10 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none">
                  Start trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#examples" className="text-sm font-bold text-black bg-white px-3 py-1 border-2 border-black hover:bg-neutral-50 active:bg-neutral-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none">
                View examples
              </Link>
            </div>

            {/* Track Scorecard Preview */}
            <div className="mt-12 w-full max-w-2xl mx-auto">
              <div className="border-2 border-black bg-neutral-900 shadow-[6px_6px_0px_0px_rgba(132,204,22,1)]">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] sm:text-xs font-black text-lime-500 tracking-wider">TRACK ANALYSIS</span>
                    <span className="text-[10px] sm:text-xs font-black text-neutral-500">20 reviews</span>
                  </div>

                  {/* Main Score */}
                  <div className="flex items-center gap-4 sm:gap-6 mb-5">
                    <div className="text-center flex-shrink-0">
                      <div className="text-4xl sm:text-5xl font-black text-lime-500">82%</div>
                      <div className="text-[10px] sm:text-xs font-black text-neutral-400 mt-1">RELEASE READY</div>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 sm:h-4 border-2 border-black bg-neutral-800">
                        <div className="h-full bg-lime-500" style={{ width: "82%" }} />
                      </div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5">
                    <div className="text-center p-2 sm:p-3 border-2 border-neutral-700 bg-black">
                      <div className="text-lg sm:text-xl font-black text-white">83%</div>
                      <div className="text-[10px] sm:text-xs text-neutral-500">Replay</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 border-2 border-neutral-700 bg-black">
                      <div className="text-lg sm:text-xl font-black text-white">67%</div>
                      <div className="text-[10px] sm:text-xs text-neutral-500">Playlist</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 border-2 border-neutral-700 bg-black">
                      <div className="text-lg sm:text-xl font-black text-white">52%</div>
                      <div className="text-[10px] sm:text-xs text-neutral-500">Share</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 border-2 border-neutral-700 bg-black">
                      <div className="text-lg sm:text-xl font-black text-white">4.2</div>
                      <div className="text-[10px] sm:text-xs text-neutral-500">Avg Score</div>
                    </div>
                  </div>

                  {/* Top Insights */}
                  <div className="border-t-2 border-neutral-700 pt-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-lime-500 text-sm">✓</span>
                      <span className="text-xs sm:text-sm text-neutral-300">
                        <span className="font-black text-white">15/20</span> mentioned &quot;Hook hits hard at 0:45&quot;
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-orange-400 text-sm">!</span>
                      <span className="text-xs sm:text-sm text-neutral-300">
                        <span className="font-black text-white">14/20</span> said &quot;Intro could be shorter&quot;
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Bar - pinned to bottom of hero */}
        <div className="w-full bg-black text-white border-t border-neutral-800">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-700">
              <div className="p-4 md:p-6 text-center">
                <p className="text-2xl md:text-3xl font-black text-lime-400">500+</p>
                <p className="text-xs md:text-sm text-neutral-400 mt-1">Reviews Delivered</p>
              </div>
              <div className="p-4 md:p-6 text-center">
                <p className="text-2xl md:text-3xl font-black text-lime-400">&lt;12h</p>
                <p className="text-xs md:text-sm text-neutral-400 mt-1">Avg Turnaround</p>
              </div>
              <div className="p-4 md:p-6 text-center">
                <p className="text-2xl md:text-3xl font-black text-lime-400">180+</p>
                <p className="text-xs md:text-sm text-neutral-400 mt-1">Avg Words/Review</p>
              </div>
              <div className="p-4 md:p-6 text-center">
                <p className="text-2xl md:text-3xl font-black text-lime-400">100%</p>
                <p className="text-xs md:text-sm text-neutral-400 mt-1">Human Reviewers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviewer Value Prop */}
      <section className="bg-neutral-900 border-b border-neutral-800 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm sm:text-base text-neutral-300">
            <span className="text-orange-400 font-black">Reviewers earn $0.50–$1.50 per review</span>
            <span className="text-neutral-500 mx-2">•</span>
            <span>You rate every review — quality pays, lazy doesn&apos;t</span>
          </p>
        </div>
      </section>

      {/* Quality Guarantee Flow */}
      <section className="mt-0 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-orange-400 text-black border-y-2 border-black py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            See exactly what you&apos;ll get.
          </h2>
          <p className="mt-3 text-base sm:text-lg font-bold max-w-2xl mx-auto">
            Clear visuals + real reviews — so you know what to change.
          </p>
        </div>
      </section>

      <section id="examples" className="py-16 border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4">
          {/* Consensus Moments - Visual Timeline Style */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <h3 className="text-2xl font-black">Consensus moments</h3>
              <span className="text-xs font-black text-neutral-500 bg-neutral-800 px-2 py-1">from 20 reviews</span>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* What hit */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 bg-lime-500" />
                  <span className="text-sm font-black text-lime-500">WHAT HIT</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-neutral-900 border-l-4 border-lime-500">
                    <span className="text-2xl font-black text-lime-500">15</span>
                    <div>
                      <div className="font-black">0:45 — Hook hits hard</div>
                      <div className="text-sm text-neutral-400">Melody lands, drums feel confident</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-neutral-900 border-l-4 border-lime-500/50">
                    <span className="text-2xl font-black text-lime-500/70">12</span>
                    <div>
                      <div className="font-black">2:15 — Breakdown feels fresh</div>
                      <div className="text-sm text-neutral-400">Nice contrast, keeps attention</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What to fix */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 w-3 bg-orange-400" />
                  <span className="text-sm font-black text-orange-400">WHAT TO FIX</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-neutral-900 border-l-4 border-orange-400">
                    <span className="text-2xl font-black text-orange-400">14</span>
                    <div>
                      <div className="font-black">0:00 — Intro too long</div>
                      <div className="text-sm text-neutral-400">Hook should arrive sooner</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-neutral-900 border-l-4 border-orange-400/50">
                    <span className="text-2xl font-black text-orange-400/70">10</span>
                    <div>
                      <div className="font-black">1:30 — Vocal too loud</div>
                      <div className="text-sm text-neutral-400">Clashes with the lead synth</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sample Review - Cleaner */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <h3 className="text-2xl font-black">Sample review</h3>
              <span className="text-xs font-black text-neutral-500 bg-neutral-800 px-2 py-1">1 of 20</span>
            </div>

            <div className="bg-neutral-900 border-2 border-neutral-800 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-lime-500 flex items-center justify-center font-black text-black">S</div>
                  <div>
                    <div className="font-black">Sarah</div>
                    <div className="text-xs text-neutral-500">Electronic • Verified reviewer</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-lime-500/20 text-lime-400 px-2 py-1">Would replay</span>
                  <span className="text-xs font-black bg-lime-500/20 text-lime-400 px-2 py-1">Would playlist</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-black text-lime-500 mb-2">WHAT WORKED</div>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    The hook at 0:45 is instantly memorable. Drums and bass feel tight — the drop hits hard. The 2:15 breakdown keeps it from feeling repetitive.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-black text-orange-400 mb-2">TO IMPROVE</div>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    Intro is too long — cut 8-12 seconds. Around 1:30 the vocal masks the lead synth. Verse 2 hats feel static.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="border-b border-neutral-800 py-12 bg-orange-400 text-black">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-lg font-bold">
            <span>Can&apos;t hear it objectively anymore?</span>
            <span className="text-black/50">•</span>
            <span>Friends just say &quot;it&apos;s good&quot;?</span>
            <span className="text-black/50">•</span>
            <span>Online feedback is noise?</span>
            <span className="text-black/50">•</span>
            <span className="font-black">Get signal instead.</span>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="border-b-2 border-black py-16 bg-lime-500 text-black">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-2">How feedback works</h2>
          <p className="text-black/70 mb-8">Fast, structured feedback—so you know what to change next.</p>

          <div className="mt-8 grid md:grid-cols-4 gap-6">
            <div className="border-2 border-black p-6 md:aspect-square flex flex-col">
              <div className="h-12 w-12 border-2 border-black flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
              <div className="mt-4 text-xl sm:text-2xl font-black">1. Submit your track</div>
              <div className="mt-2 text-base font-medium">Paste a link or upload.</div>
            </div>
            <div className="border-2 border-black p-6 md:aspect-square flex flex-col">
              <div className="h-12 w-12 border-2 border-black flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div className="mt-4 text-xl sm:text-2xl font-black">2. We match reviewers</div>
              <div className="mt-2 text-base font-medium">Genre-picked artists + listeners review your track.</div>
            </div>
            <div className="border-2 border-black p-6 md:aspect-square flex flex-col">
              <div className="h-12 w-12 border-2 border-black flex items-center justify-center">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div className="mt-4 text-xl sm:text-2xl font-black">3. They review</div>
              <div className="mt-2 text-base font-medium">Structured notes + timestamps. Artists rate every review.</div>
            </div>
            <div className="border-2 border-black p-6 md:aspect-square flex flex-col">
              <div className="h-12 w-12 border-2 border-black flex items-center justify-center">
                <Flame className="h-6 w-6" />
              </div>
              <div className="mt-4 text-xl sm:text-2xl font-black">4. You get clarity</div>
              <div className="mt-2 text-base font-medium">Patterns show what to change next.</div>
            </div>
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

      {/* Features - Compact 3-column */}
      <section className="border-b border-neutral-800 py-16 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-14 w-14 bg-orange-400 border-2 border-black flex items-center justify-center mb-4 mx-auto">
                <Target className="h-7 w-7 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Genre-matched</h3>
              <p className="text-sm text-neutral-300">
                Your trap beat won&apos;t be reviewed by someone who only listens to country.
              </p>
            </div>

            <div className="text-center">
              <div className="h-14 w-14 bg-lime-500 border-2 border-black flex items-center justify-center mb-4 mx-auto">
                <Clock className="h-7 w-7 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Fast turnaround</h3>
              <p className="text-sm text-neutral-300">
                All reviews delivered within 24 hours. Usually much faster.
              </p>
            </div>

            <div className="text-center">
              <div className="h-14 w-14 bg-orange-400 border-2 border-black flex items-center justify-center mb-4 mx-auto">
                <Shield className="h-7 w-7 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Private & secure</h3>
              <p className="text-sm text-neutral-300">
                Only assigned reviewers hear your track. We never share or leak your work.
              </p>
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

          <p className="text-center text-sm text-neutral-400 mt-8 flex items-center justify-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Your payment goes directly to reviewers. Quality enforced by your ratings.</span>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-20 border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Stop wondering.<br />Start knowing.
          </h2>
          <p className="text-neutral-400 mb-10 text-lg">
            Your track deserves more than a guess. Get real feedback from real listeners.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-bold text-base px-10 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none"
              >
                Get Feedback <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <span className="text-sm font-bold text-black bg-lime-500 px-3 py-1 border-2 border-black">First one&apos;s free</span>
          </div>
          <p className="mt-6 text-sm text-neutral-500">
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
