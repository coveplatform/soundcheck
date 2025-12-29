import Link from "next/link";
import { getServerSession } from "next-auth";
import { Button } from "@/components/ui/button";
import { Music, Headphones, Star, DollarSign, Shield, ArrowRight, Users, Target, Clock, ListMusic, Share2, UserPlus, ThumbsUp } from "lucide-react";
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
            One opinion is taste.<br />Ten opinions is truth.
          </h1>
          <p className="mt-6 text-xl text-neutral-600 max-w-xl leading-relaxed">
            Stop guessing if your track is ready. Get 5-10 genre-matched listeners to hear your music
            and tell you exactly what works, what doesn't, and whether they'd actually playlist it.
            When 8 out of 10 say it's release-ready, you'll <em>know</em>.
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

      {/* Social Proof Bar */}
      <section className="border-b-2 border-black bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-700">
            <div className="p-4 md:p-6 text-center">
              <p className="text-2xl md:text-3xl font-black text-lime-400">500+</p>
              <p className="text-xs md:text-sm text-neutral-400 mt-1">Reviews Delivered</p>
            </div>
            <div className="p-4 md:p-6 text-center">
              <p className="text-2xl md:text-3xl font-black text-lime-400">&lt;24h</p>
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
      </section>

      {/* How It Works - Artists */}
      <section className="border-b-2 border-black py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-2">How It Works</h2>
          <p className="text-neutral-600 mb-8">Three steps to real feedback on your music.</p>

          <div className="space-y-4">
            <div className="flex gap-4 p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="flex-shrink-0 w-14 h-14 bg-lime-500 border-2 border-black text-black font-mono font-black flex items-center justify-center text-xl">
                1
              </span>
              <div className="flex flex-col justify-center">
                <p className="font-bold text-lg">Submit your track</p>
                <p className="text-neutral-500">
                  Drop a SoundCloud, Bandcamp, or YouTube link—takes 30 seconds
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="flex-shrink-0 w-14 h-14 bg-lime-500 border-2 border-black text-black font-mono font-black flex items-center justify-center text-xl">
                2
              </span>
              <div className="flex flex-col justify-center">
                <p className="font-bold text-lg">Pick your package</p>
                <p className="text-neutral-500">
                  Choose 5, 10, or 20 reviews from genre-matched listeners—starting at $4.95
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="flex-shrink-0 w-14 h-14 bg-lime-500 border-2 border-black text-black font-mono font-black flex items-center justify-center text-xl">
                3
              </span>
              <div className="flex flex-col justify-center">
                <p className="font-bold text-lg">See what everyone thinks</p>
                <p className="text-neutral-500">
                  When multiple reviewers agree on something, you know it&apos;s not just one person&apos;s taste
                </p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-sm text-neutral-500 text-center">
            Looking to earn money reviewing music? <a href="#for-reviewers" className="text-black font-bold underline underline-offset-2 hover:text-orange-500">Learn more ↓</a>
          </p>
        </div>
      </section>

      {/* Example Review */}
      <section className="border-b-2 border-black py-16 bg-lime-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-lime-500 border-2 border-black flex items-center justify-center">
              <Star className="h-6 w-6 text-black" />
            </div>
            <h2 className="text-3xl font-black">Each Review Looks Like This</h2>
          </div>
          <p className="text-neutral-600 mb-10">
            You get 5-20 of these. When patterns emerge across reviews, you know what&apos;s real feedback vs. personal taste.
          </p>

          <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {/* Track Header */}
            <div className="p-4 border-b-2 border-black bg-black flex items-center gap-4">
              <div className="h-14 w-14 bg-lime-500 border-2 border-black flex items-center justify-center shrink-0">
                <Music className="h-6 w-6 text-black" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">Midnight Frequency</p>
                <p className="text-neutral-400 text-sm truncate">Electronic Artist • 3:42</p>
              </div>
            </div>

            {/* Reviewer */}
            <div className="p-4 border-b-2 border-black bg-neutral-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-lime-500 border-2 border-black flex items-center justify-center font-bold">
                  S
                </div>
                <div>
                  <p className="font-bold text-sm">Sarah M.</p>
                  <p className="text-xs text-neutral-500">Electronic • Indie • Alternative</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
                <Headphones className="h-4 w-4" />
                <span>Listened 4:32</span>
              </div>
            </div>

            {/* Quick Ratings */}
            <div className="border-b-2 border-black grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-neutral-200">
              <div className="p-4 text-center">
                <p className="text-xs text-neutral-500 mb-1">First Impression</p>
                <p className="font-bold text-lime-600">Strong Hook</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-neutral-500 mb-1">Production</p>
                <p className="font-bold">4/5</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-neutral-500 mb-1">Originality</p>
                <p className="font-bold">4/5</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-neutral-500 mb-1">Listen Again?</p>
                <p className="font-bold text-lime-600">Yes</p>
              </div>
            </div>

            {/* Listener Signals */}
            <div className="border-b-2 border-black bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500 mb-3 font-medium">Listener Signals</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-lime-100 border-2 border-lime-500 text-lime-700">
                  <ListMusic className="h-3.5 w-3.5" />
                  Would add to playlist
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-lime-100 border-2 border-lime-500 text-lime-700">
                  <Share2 className="h-3.5 w-3.5" />
                  Would share
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-neutral-100 border-2 border-neutral-300 text-neutral-500">
                  <UserPlus className="h-3.5 w-3.5" />
                  Wouldn&apos;t follow yet
                </span>
              </div>
            </div>

            {/* Written Feedback */}
            <div className="p-6 space-y-6">
              {/* The Good */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-lime-500 border border-black flex items-center justify-center text-xs font-bold">+</span>
                  <h4 className="font-bold text-sm">What&apos;s Working</h4>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm pl-8">
                  The synth melody around 0:45 is genuinely catchy—got stuck in my head. The interplay with the drums creates a driving energy that makes you want to move. Low end is tight, punchy kick that cuts through without being muddy. The breakdown at 2:15 was unexpected and added a nice dynamic shift.
                </p>
              </div>

              {/* To Improve */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-orange-400 border border-black flex items-center justify-center text-xs font-bold">→</span>
                  <h4 className="font-bold text-sm">Room to Grow</h4>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm pl-8">
                  The intro feels long before the hook hits—consider trimming 8-10 seconds. Hi-hats get repetitive in verse 2; some variation or filter sweep would help. The vocal sample at 1:30 sits too loud and clashes with lead synth frequencies.
                </p>
              </div>

              {/* Next Steps */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-sky-400 border border-black flex items-center justify-center text-xs font-bold">!</span>
                  <h4 className="font-bold text-sm">Next Steps</h4>
                </div>
                <ul className="text-neutral-600 text-sm pl-8 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-black text-white px-1.5 py-0.5 mt-0.5">01</span>
                    <span>Cut the intro by 8-10 seconds to hook listeners faster</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-black text-white px-1.5 py-0.5 mt-0.5">02</span>
                    <span>Add hi-hat variations or automate a filter in verse 2</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-black text-white px-1.5 py-0.5 mt-0.5">03</span>
                    <span>EQ the vocal sample to carve space for the lead synth</span>
                  </li>
                </ul>
              </div>

              {/* Similar Artists */}
              <div className="pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-500">
                  <span className="font-bold text-neutral-700">Sounds like:</span> Bonobo meets Four Tet, with some Tycho influence in the atmospheric pads.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-neutral-100 border-t-2 border-black flex items-center justify-between">
              <span className="text-xs text-neutral-500">1 of 10 reviews • <span className="font-bold text-black">Release Ready</span> package</span>
              <span className="text-[10px] font-mono bg-lime-500 border border-black px-2 py-0.5 font-bold">EXAMPLE</span>
            </div>
          </div>
        </div>
      </section>


      {/* Features */}
      <section className="border-b-2 border-black py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-2">Why MixReflect?</h2>
          <p className="text-neutral-600 mb-10">
            Multiple honest opinions from real listeners who actually play your track.
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
              <h3 className="font-bold text-lg mb-2">Patterns emerge from multiple ears</h3>
              <p className="text-sm text-neutral-600">
                If 7/10 say the intro is too long, that&apos;s not taste—it&apos;s consensus. Multiple reviews reveal what really needs fixing.
              </p>
            </div>

            <div className="bg-white p-6 hover:bg-neutral-50 transition-colors">
              <div className="h-12 w-12 bg-emerald-400 border-2 border-black flex items-center justify-center mb-4">
                <ThumbsUp className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Confidence before release</h3>
              <p className="text-sm text-neutral-600">
                Stop second-guessing. When most reviewers say it&apos;s ready, you can hit publish knowing it&apos;s not just you who thinks it&apos;s good.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b-2 border-black py-16 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-2">More Reviews = More Confidence</h2>
          <p className="text-neutral-600 mb-10">
            One review is a random opinion. Five start showing patterns. Ten give you the full picture.
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
            Stop guessing.<br />Start knowing.
          </h2>
          <p className="text-neutral-400 mb-10 text-lg">
            When 8 out of 10 listeners say your hook is fire, you can release with confidence.
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
                q: "Why do I need multiple reviews instead of just one?",
                a: "One person's feedback is just their taste. With 5-10 reviews, you start seeing patterns. If one person says your intro is too long, maybe they're wrong. If 7 out of 10 say it, that's something to fix. Consensus separates personal preference from real issues.",
              },
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

      {/* For Reviewers - Compact */}
      <section id="for-reviewers" className="border-b-2 border-black py-12 bg-orange-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-orange-400 border-2 border-black flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-black" />
                </div>
                <h2 className="text-2xl font-black">Want to get paid for reviewing?</h2>
              </div>
              <p className="text-neutral-600">
                Earn $0.50–$1.50 per review. Listen to new music, share honest feedback, get paid.
              </p>
            </div>
            <Link href="/signup" className="shrink-0">
              <Button className="bg-orange-400 text-black hover:bg-orange-300 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                Start Reviewing
              </Button>
            </Link>
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
