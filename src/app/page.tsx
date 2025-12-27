import Link from "next/link";
import { getServerSession } from "next-auth";
import { Button } from "@/components/ui/button";
import { Music, Headphones, Star, DollarSign, Shield, ArrowRight, Users, Target, Clock } from "lucide-react";
import { ACTIVE_PACKAGE_TYPES, PACKAGES } from "@/lib/metadata";
import { authOptions } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { isArtist?: boolean; isReviewer?: boolean }
    | undefined;

  const dashboardHref = user?.isArtist
    ? "/artist/dashboard"
    : user?.isReviewer
      ? "/reviewer/dashboard"
      : "/login";

  const pricing = ACTIVE_PACKAGE_TYPES.map((key) => ({ key, ...PACKAGES[key] }));

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <div className="flex items-center gap-3">
              {session ? (
                <Link href={dashboardHref}>
                  <Button className="bg-black text-white hover:bg-neutral-800 font-medium">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="font-medium">Sign in</Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-black text-white hover:bg-neutral-800 font-medium">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 md:py-28">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-black max-w-4xl leading-[1.1]">
            Get honest feedback on your music.
          </h1>
          <p className="mt-6 text-xl text-neutral-600 max-w-xl leading-relaxed">
            Submit your unreleased tracks and get structured reviews from a curated listener
            panel matched to your genre. Or become a reviewer—listen to new music and get paid
            for your honest feedback.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 font-bold text-base px-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                Submit a Track <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="font-bold text-base px-8 border-2 border-black hover:bg-black hover:text-white transition-colors">
                Become a Reviewer
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500 font-mono">
            <span>Artists: From $4.95 • 24h max turnaround (usually shorter)</span>
            <span>Reviewers: Earn $0.50–$1.50 per review</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2">
            {/* For Artists */}
            <div className="p-8 md:p-12 border-b-2 md:border-b-0 md:border-r-2 border-black">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 bg-lime-500 border-2 border-black flex items-center justify-center">
                  <Music className="h-6 w-6 text-black" />
                </div>
                <h2 className="text-2xl font-bold">For Artists</h2>
              </div>
              <ol className="space-y-6">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-black text-white font-mono font-bold flex items-center justify-center text-sm">
                    01
                  </span>
                  <div>
                    <p className="font-bold">Submit your track</p>
                    <p className="text-neutral-600 mt-1">
                      Drop a SoundCloud, Bandcamp, or YouTube link
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-black text-white font-mono font-bold flex items-center justify-center text-sm">
                    02
                  </span>
                  <div>
                    <p className="font-bold">Pick your package</p>
                    <p className="text-neutral-600 mt-1">
                      5-20 structured reviews from genre-matched listeners
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-black text-white font-mono font-bold flex items-center justify-center text-sm">
                    03
                  </span>
                  <div>
                    <p className="font-bold">Get structured feedback</p>
                    <p className="text-neutral-600 mt-1">
                      Structured feedback you can act on
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* For Reviewers */}
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 bg-orange-400 border-2 border-black flex items-center justify-center">
                  <Headphones className="h-6 w-6 text-black" />
                </div>
                <h2 className="text-2xl font-bold">For Reviewers</h2>
              </div>
              <ol className="space-y-6">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-black text-white font-mono font-bold flex items-center justify-center text-sm">
                    01
                  </span>
                  <div>
                    <p className="font-bold">Pass the quiz</p>
                    <p className="text-neutral-600 mt-1">
                      10 questions to prove you know music and can give useful feedback
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-black text-white font-mono font-bold flex items-center justify-center text-sm">
                    02
                  </span>
                  <div>
                    <p className="font-bold">Pick your genres</p>
                    <p className="text-neutral-600 mt-1">
                      Only get tracks in genres you actually listen to
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-black text-white font-mono font-bold flex items-center justify-center text-sm">
                    03
                  </span>
                  <div>
                    <p className="font-bold">Listen & review (~10 min)</p>
                    <p className="text-neutral-600 mt-1">
                      Rate production, originality, vocals. Write what works and what doesn&apos;t.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-black text-white font-mono font-bold flex items-center justify-center text-sm">
                    04
                  </span>
                  <div>
                    <p className="font-bold">Earn $0.50–$1.50 per review</p>
                    <p className="text-neutral-600 mt-1">
                      Get rated by artists. Higher ratings = higher tier = more pay.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* What Feedback Looks Like */}
      <section className="border-b-2 border-black py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-2">What You&apos;ll Get</h2>
          <p className="text-neutral-600 mb-10">
            Every review follows a structured format so you get specific, actionable feedback.
          </p>

          <div className="border-2 border-black bg-white">
            <div className="grid md:grid-cols-2 border-b-2 border-black">
              <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-black">
                <h3 className="font-bold mb-4">Ratings</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-neutral-600">First Impression</span>
                    <span className="font-mono text-xs">Strong Hook / Decent / Lost Interest</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-neutral-600">Production Quality</span>
                    <span className="font-mono">1-5 stars</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-neutral-600">Originality</span>
                    <span className="font-mono">1-5 stars</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-neutral-600">Vocals (if applicable)</span>
                    <span className="font-mono">1-5 stars</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-neutral-600">Would listen again?</span>
                    <span className="font-mono">Yes / No</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold mb-4">Written Feedback</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-neutral-600">Best part of the track</span>
                    <p className="font-mono text-xs mt-1 text-neutral-500">Min. 30 words + anti-filler checks</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Areas to improve</span>
                    <p className="font-mono text-xs mt-1 text-neutral-500">Min. 30 words + anti-filler checks</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Next actions</span>
                    <p className="font-mono text-xs mt-1 text-neutral-500">3+ concrete steps (one per line)</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Timestamped notes</span>
                    <p className="font-mono text-xs mt-1 text-neutral-500">Optional (available for uploads)</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Similar artists</span>
                    <p className="font-mono text-xs mt-1 text-neutral-500">Optional</p>
                  </div>
                  <div>
                    <span className="text-neutral-600">Additional notes</span>
                    <p className="font-mono text-xs mt-1 text-neutral-500">Optional</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-neutral-50 text-sm text-neutral-600">
              <strong>Quality enforced:</strong> Reviewers must listen for 3+ minutes. We block repetitive filler. You rate every review.
            </div>
          </div>
        </div>
      </section>

      {/* Example Review */}
      <section className="border-b-2 border-black py-16 bg-sky-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-2">Real Review Example</h2>
          <p className="text-neutral-600 mb-10">
            Here&apos;s what actual feedback looks like on MixReflect.
          </p>

          <div className="border-2 border-black bg-white">
            {/* Review Header */}
            <div className="p-4 border-b-2 border-black bg-neutral-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-lime-500 border-2 border-black flex items-center justify-center font-bold">
                  R
                </div>
                <div>
                  <p className="font-bold text-sm">Pro Reviewer</p>
                  <p className="text-xs text-neutral-500">Genres: Electronic, Indie, Alternative</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-mono text-neutral-500">Listened: 4m 32s</span>
              </div>
            </div>

            {/* Ratings */}
            <div className="p-6 border-b-2 border-black">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-neutral-50 border border-neutral-200">
                  <p className="text-xs text-neutral-500 mb-1">First Impression</p>
                  <p className="font-bold text-lime-600">Strong Hook</p>
                </div>
                <div className="text-center p-3 bg-neutral-50 border border-neutral-200">
                  <p className="text-xs text-neutral-500 mb-1">Production</p>
                  <p className="font-bold">4/5</p>
                </div>
                <div className="text-center p-3 bg-neutral-50 border border-neutral-200">
                  <p className="text-xs text-neutral-500 mb-1">Originality</p>
                  <p className="font-bold">4/5</p>
                </div>
                <div className="text-center p-3 bg-neutral-50 border border-neutral-200">
                  <p className="text-xs text-neutral-500 mb-1">Listen Again?</p>
                  <p className="font-bold text-lime-600">Yes</p>
                </div>
              </div>
            </div>

            {/* Written Feedback */}
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-bold text-sm text-neutral-500 uppercase tracking-wide mb-2">Best Part</h4>
                <p className="text-neutral-800 leading-relaxed">
                  The synth melody that comes in around 0:45 is genuinely catchy and got stuck in my head. The way it interplays with the drums creates this driving energy that makes you want to move. The production on the low end is tight—punchy kick that cuts through without being muddy. The breakdown at 2:15 was unexpected and added a nice dynamic shift.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-neutral-500 uppercase tracking-wide mb-2">Areas to Improve</h4>
                <p className="text-neutral-800 leading-relaxed">
                  The intro feels a bit long before the main hook hits—I&apos;d consider trimming 8-10 seconds to get to the good stuff faster. The hi-hats get a little repetitive in the second verse; some variation or a filter sweep could help. The vocal sample around 1:30 sits a bit too loud in the mix and clashes with the lead synth frequencies.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-neutral-500 uppercase tracking-wide mb-2">Suggested Next Steps</h4>
                <ul className="text-neutral-800 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-lime-600 font-bold">1.</span>
                    <span>Cut the intro down by 8-10 seconds to hook listeners faster</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-lime-600 font-bold">2.</span>
                    <span>Add hi-hat variations or automate a filter in verse 2</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-lime-600 font-bold">3.</span>
                    <span>EQ the vocal sample to carve out space for the lead synth</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-sm text-neutral-500 uppercase tracking-wide mb-2">Similar Artists</h4>
                <p className="text-neutral-600">
                  Reminds me of Bonobo meets Four Tet, with some Tycho influence in the atmospheric pads.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-neutral-50 border-t-2 border-black flex items-center justify-between">
              <span className="text-sm text-neutral-500">This is 1 of 10 reviews from a Release Ready package</span>
              <span className="text-xs font-mono text-neutral-400">Example review</span>
            </div>
          </div>
        </div>
      </section>

      {/* Reviewer Earnings */}
      <section className="border-b-2 border-black py-16 bg-orange-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-2">Earn Money Reviewing Music</h2>
          <p className="text-neutral-600 mb-10">
            Level up by delivering quality reviews. Higher tiers = better pay.
          </p>

          <div className="grid md:grid-cols-2 gap-0 border-2 border-black">
            <div className="p-6 border-b-2 md:border-b-0 md:border-r-2 border-black bg-white">
              <div className="text-sm font-mono text-neutral-500 mb-2">TIER 1</div>
              <h3 className="font-bold text-xl mb-1">Normal</h3>
              <div className="text-3xl font-black text-black">$0.50<span className="text-base font-normal text-neutral-500">/review</span></div>
              <p className="text-sm text-neutral-600 mt-4">Starting tier. Pass the onboarding quiz to begin.</p>
            </div>

            <div className="p-6 bg-lime-500">
              <div className="text-sm font-mono text-black/60 mb-2">TIER 2</div>
              <h3 className="font-bold text-xl mb-1">Pro</h3>
              <div className="text-3xl font-black text-black">$1.50<span className="text-base font-normal text-black/60">/review</span></div>
              <p className="text-sm text-black/70 mt-4">50+ reviews with 4.7+ average rating OR 10 gems.</p>
            </div>
          </div>

          <p className="mt-6 text-sm text-neutral-500 text-center">
            Pro reviewers doing 10 reviews/week earn ~$60/month
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-b-2 border-black py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-2">Why MixReflect?</h2>
          <p className="text-neutral-600 mb-10">
            Built for artists who want real feedback, not ego boosts.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black border-2 border-black">
            <div className="bg-white p-6 hover:bg-neutral-50 transition-colors">
              <div className="h-12 w-12 bg-lime-500 border-2 border-black flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Quality you can trust</h3>
              <p className="text-sm text-neutral-600">
                Every reviewer passes a quiz. Must listen 3+ minutes. You rate every review—bad ones get filtered out.
              </p>
            </div>

            <div className="bg-white p-6 hover:bg-neutral-50 transition-colors">
              <div className="h-12 w-12 bg-orange-400 border-2 border-black flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Genre-matched ears</h3>
              <p className="text-sm text-neutral-600">
                Your trap beat won&apos;t get reviewed by someone who only listens to country. Reviewers pick their genres.
              </p>
            </div>

            <div className="bg-white p-6 hover:bg-neutral-50 transition-colors">
              <div className="h-12 w-12 bg-sky-400 border-2 border-black flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Fast turnaround</h3>
              <p className="text-sm text-neutral-600">
                Get all your reviews in 24 hours max (usually shorter). No waiting weeks for feedback on a track you&apos;re excited about.
              </p>
            </div>

            <div className="bg-white p-6 hover:bg-neutral-50 transition-colors">
              <div className="h-12 w-12 bg-purple-400 border-2 border-black flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Your music stays private</h3>
              <p className="text-sm text-neutral-600">
                Only assigned reviewers hear your track. We never share, publish, or leak your unreleased work.
              </p>
            </div>

            <div className="bg-white p-6 hover:bg-neutral-50 transition-colors">
              <div className="h-12 w-12 bg-pink-400 border-2 border-black flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Real people, not bots</h3>
              <p className="text-sm text-neutral-600">
                No AI-generated feedback. Every review comes from a real listener who actually played your track.
              </p>
            </div>

            <div className="bg-white p-6 hover:bg-neutral-50 transition-colors">
              <div className="h-12 w-12 bg-emerald-400 border-2 border-black flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Affordable & fair</h3>
              <p className="text-sm text-neutral-600">
                From $4.95 for 5 reviews. No subscriptions, no hidden fees. Reviewers get paid fairly for their time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b-2 border-black py-16 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-2">Pricing</h2>
          <p className="text-neutral-600 mb-10">
            Pick based on how many ears you want on your track.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pricing.map((p) => {
              const price = (p.price / 100).toFixed(2);
              const isPopular = p.key === "STANDARD";

              return (
                <div
                  key={p.key}
                  className={`border-2 border-black bg-white p-6 ${
                    isPopular ? "ring-4 ring-lime-500" : ""
                  }`}
                >
                  {isPopular && (
                    <span className="inline-block text-xs font-bold bg-lime-500 text-black px-2 py-1 mb-4 border border-black">
                      POPULAR
                    </span>
                  )}
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <p className="text-sm text-neutral-500 mt-1">{p.description}</p>

                  <div className="mt-6">
                    <div className="text-4xl font-black">${price}</div>
                  </div>

                  <div className="mt-6 space-y-2 text-sm border-t-2 border-black pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Reviews</span>
                      <span className="font-bold">{p.reviews}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Top-rated (PRO) reviewers</span>
                      <span className="font-bold">
                        {p.minProReviews === 0 ? "Not guaranteed" : `${p.minProReviews}+ guaranteed`}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-3">
                    PRO = 50+ reviews with 4.7+ rating OR 10 gems
                  </p>

                  <div className="mt-6">
                    <Link href="/signup">
                      <Button className={`w-full border-2 border-black font-bold ${
                        isPopular
                          ? "bg-lime-500 text-black hover:bg-lime-400"
                          : "bg-black text-white hover:bg-neutral-800"
                      }`}>
                        Get started
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-20 border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Stop guessing.<br />Get real feedback.
          </h2>
          <p className="text-neutral-400 mb-10 text-lg">
            Your next release deserves honest ears.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-lime-500 text-black hover:bg-lime-400 font-bold text-base px-10 border-2 border-lime-500"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-b-2 border-black">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-10">FAQ</h2>
          <div className="space-y-0 border-2 border-black">
            {[
              {
                q: "How does it work?",
                a: "Submit a private link. Pick a package. Get structured feedback from genre-matched reviewers within 24 hours (usually shorter).",
              },
              {
                q: "Who are the reviewers?",
                a: "Real people who passed a 10-question onboarding quiz. They're matched by genre and ranked by artist ratings. Top-rated reviewers get more assignments and earn more.",
              },
              {
                q: "Is my music private?",
                a: "Yes. Only assigned reviewers hear your track. We don't share or publish anything.",
              },
              {
                q: "How much can I earn as a reviewer?",
                a: "Normal reviewers earn $0.50/review. Become Pro by completing 50 reviews with a 4.7+ rating (or getting gemmed 10 times) to earn $1.50/review. Pro reviewers doing 10 reviews/week make ~$60/month.",
              },
              {
                q: "What's the difference between reviewer tiers?",
                a: "Tiers reflect quality and consistency. Pro reviewers have either completed 50+ reviews with a 4.7+ rating or been gemmed 10 times. Higher packages guarantee Pro reviewers on your track.",
              },
              {
                q: "What do I have to do to review?",
                a: "Pass a 10-question onboarding quiz, select your genres, then review tracks from your queue. Each review takes ~10 minutes: listen for at least 3 minutes, rate production/originality/vocals, and write what worked and what didn't.",
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
                <summary className="font-bold cursor-pointer hover:text-neutral-600">
                  {item.q}
                </summary>
                <p className="mt-3 text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <p className="text-neutral-500">
            &copy; {new Date().getFullYear()} MixReflect
          </p>
          <div className="flex items-center gap-4 text-neutral-600">
            <Link href="/terms" className="hover:text-black font-medium">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-black font-medium">
              Privacy
            </Link>
            <Link href="/support" className="hover:text-black font-medium">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
