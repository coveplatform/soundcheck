import Link from "next/link";
import { getServerSession } from "next-auth";
import { Button } from "@/components/ui/button";
import { Music, Headphones, Star, DollarSign, Shield, Zap, ArrowRight } from "lucide-react";
import { PACKAGES } from "@/lib/metadata";
import { authOptions } from "@/lib/auth";

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

  const pricing = [
    { key: "STARTER", ...PACKAGES.STARTER },
    { key: "STANDARD", ...PACKAGES.STANDARD },
    { key: "PRO", ...PACKAGES.PRO },
    { key: "DEEP_DIVE", ...PACKAGES.DEEP_DIVE },
  ] as const;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-black flex items-center justify-center">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">MixReflect</span>
          </div>
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
      </header>

      {/* Hero */}
      <section className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-black max-w-4xl leading-[1.1]">
            Get honest feedback on your music.
          </h1>
          <p className="mt-6 text-xl text-neutral-600 max-w-xl leading-relaxed">
            Submit your unreleased tracks. Get paid reviews from real listeners
            matched to your genre. No fluff, no bots.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-lime-400 text-black hover:bg-lime-300 font-bold text-base px-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                Submit a Track <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="font-bold text-base px-8 border-2 border-black hover:bg-black hover:text-white transition-colors">
                Become a Reviewer
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-neutral-500 font-mono">
            5 reviews from $3 • No subscription • Reviews in 24-72hrs
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2">
            {/* For Artists */}
            <div className="p-8 md:p-12 border-b-2 md:border-b-0 md:border-r-2 border-black">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 bg-lime-400 border-2 border-black flex items-center justify-center">
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
                      5-25 reviews from genre-matched listeners
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-black text-white font-mono font-bold flex items-center justify-center text-sm">
                    03
                  </span>
                  <div>
                    <p className="font-bold">Get real feedback</p>
                    <p className="text-neutral-600 mt-1">
                      Structured reviews on mix, production, vibe
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
                    <p className="font-bold">Pick your genres</p>
                    <p className="text-neutral-600 mt-1">
                      Only get music you actually want to hear
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-black text-white font-mono font-bold flex items-center justify-center text-sm">
                    02
                  </span>
                  <div>
                    <p className="font-bold">Listen & review</p>
                    <p className="text-neutral-600 mt-1">
                      Give structured feedback, earn per review
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-black text-white font-mono font-bold flex items-center justify-center text-sm">
                    03
                  </span>
                  <div>
                    <p className="font-bold">Get paid, level up</p>
                    <p className="text-neutral-600 mt-1">
                      $0.15-$0.50 per review based on tier
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b-2 border-black py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-12">Why MixReflect?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-black">
            <div className="p-6 border-b-2 sm:border-b-2 lg:border-b-0 sm:border-r-2 lg:border-r-2 border-black">
              <Star className="h-8 w-8 text-black mb-4" />
              <h3 className="font-bold mb-2">Quality enforced</h3>
              <p className="text-sm text-neutral-600">
                Tiered reviewers. Bad reviews get rejected.
              </p>
            </div>
            <div className="p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-black">
              <Shield className="h-8 w-8 text-black mb-4" />
              <h3 className="font-bold mb-2">Private by default</h3>
              <p className="text-sm text-neutral-600">
                Your unreleased tracks stay unreleased.
              </p>
            </div>
            <div className="p-6 border-b-2 sm:border-b-0 sm:border-r-2 lg:border-r-2 border-black">
              <Zap className="h-8 w-8 text-black mb-4" />
              <h3 className="font-bold mb-2">Fast turnaround</h3>
              <p className="text-sm text-neutral-600">
                24-72 hours for full feedback.
              </p>
            </div>
            <div className="p-6">
              <DollarSign className="h-8 w-8 text-black mb-4" />
              <h3 className="font-bold mb-2">Cheap & fair</h3>
              <p className="text-sm text-neutral-600">
                $3 for 5 reviews. Reviewers get 70%.
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricing.map((p) => {
              const price = (p.price / 100).toFixed(0);
              const perReview = (p.price / Math.max(1, p.reviews) / 100).toFixed(2);
              const isPopular = p.key === "STANDARD";

              return (
                <div
                  key={p.key}
                  className={`border-2 border-black bg-white p-6 ${
                    isPopular ? "ring-4 ring-lime-400" : ""
                  }`}
                >
                  {isPopular && (
                    <span className="inline-block text-xs font-bold bg-lime-400 text-black px-2 py-1 mb-4 border border-black">
                      POPULAR
                    </span>
                  )}
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <p className="text-sm text-neutral-500 mt-1">{p.description}</p>

                  <div className="mt-6">
                    <div className="text-4xl font-black">${price}</div>
                    <div className="text-sm text-neutral-500 font-mono">${perReview}/review</div>
                  </div>

                  <div className="mt-6 space-y-2 text-sm border-t-2 border-black pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Reviews</span>
                      <span className="font-bold">{p.reviews}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Mix</span>
                      <span className="font-bold">{p.mix}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link href="/signup">
                      <Button className={`w-full border-2 border-black font-bold ${
                        isPopular
                          ? "bg-lime-400 text-black hover:bg-lime-300"
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
              className="bg-lime-400 text-black hover:bg-lime-300 font-bold text-base px-10 border-2 border-lime-400"
            >
              Get Started Free
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
                a: "Submit a private link. Pick a package. Get structured feedback from genre-matched reviewers within 24-72 hours.",
              },
              {
                q: "Who are the reviewers?",
                a: "Real people who passed our onboarding. They're matched by genre and paid for quality feedback.",
              },
              {
                q: "Is my music private?",
                a: "Yes. Only assigned reviewers hear your track. We don't share or publish anything.",
              },
              {
                q: "How do reviewers get paid?",
                a: "Per review, based on tier. Higher quality = higher tier = more per review. Payouts via Stripe.",
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
            <div className="h-6 w-6 bg-black flex items-center justify-center">
              <Music className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold">MixReflect</span>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
