import Link from "next/link";
import { getServerSession } from "next-auth";
import { Button } from "@/components/ui/button";
import { Music, Headphones, Star, DollarSign, Shield, Zap } from "lucide-react";
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
      <header className="border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg">SoundCheck</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <Link href={dashboardHref}>
                <Button>Go to dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 max-w-3xl mx-auto">
          Get Real Feedback on Your Music Before You Release
        </h1>
        <p className="mt-6 text-xl text-neutral-600 max-w-2xl mx-auto">
          A private feedback marketplace where artists get genuine listener reviews
          and reviewers get paid to discover new music.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Submit Your Track
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Become a Reviewer
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-neutral-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* For Artists */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-neutral-900 rounded-lg flex items-center justify-center">
                  <Music className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold">For Artists</h3>
              </div>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Submit your track</p>
                    <p className="text-sm text-neutral-500">
                      Paste a SoundCloud, Bandcamp, or YouTube link
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Choose your package</p>
                    <p className="text-sm text-neutral-500">
                      Get 5-25 reviews from genre-matched listeners
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Receive detailed feedback</p>
                    <p className="text-sm text-neutral-500">
                      Structured reviews on production, originality, and more
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* For Reviewers */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-neutral-900 rounded-lg flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold">For Reviewers</h3>
              </div>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Sign up and pick genres</p>
                    <p className="text-sm text-neutral-500">
                      Get matched with music you actually want to hear
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Listen and review</p>
                    <p className="text-sm text-neutral-500">
                      Share structured feedback on each track
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Get paid and level up</p>
                    <p className="text-sm text-neutral-500">
                      Earn $0.15-$0.50 per review based on your tier
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why SoundCheck?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border border-neutral-200">
              <Star className="h-8 w-8 text-neutral-900 mb-4" />
              <h3 className="font-semibold mb-2">Quality Enforced</h3>
              <p className="text-sm text-neutral-500">
                Tiered reviewer system ensures you get thoughtful, useful feedback
              </p>
            </div>
            <div className="p-6 rounded-xl border border-neutral-200">
              <Shield className="h-8 w-8 text-neutral-900 mb-4" />
              <h3 className="font-semibold mb-2">Private & Secure</h3>
              <p className="text-sm text-neutral-500">
                Your unreleased tracks stay private until you&apos;re ready
              </p>
            </div>
            <div className="p-6 rounded-xl border border-neutral-200">
              <Zap className="h-8 w-8 text-neutral-900 mb-4" />
              <h3 className="font-semibold mb-2">Fast Turnaround</h3>
              <p className="text-sm text-neutral-500">
                Get all your reviews within 24-72 hours
              </p>
            </div>
            <div className="p-6 rounded-xl border border-neutral-200">
              <DollarSign className="h-8 w-8 text-neutral-900 mb-4" />
              <h3 className="font-semibold mb-2">Affordable</h3>
              <p className="text-sm text-neutral-500">
                Starting at just $3 for 5 genuine reviews
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Pricing</h2>
          <p className="text-neutral-600 text-center mb-12">
            Pick a package based on how deep you want the feedback.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricing.map((p) => {
              const price = (p.price / 100).toFixed(2);
              const perReview = (p.price / Math.max(1, p.reviews) / 100).toFixed(2);
              const isPopular = p.key === "STANDARD";

              return (
                <div
                  key={p.key}
                  className={`rounded-xl border bg-white p-6 shadow-sm ${
                    isPopular
                      ? "border-neutral-900 ring-1 ring-neutral-900"
                      : "border-neutral-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-lg">{p.name}</h3>
                      <p className="text-sm text-neutral-500">{p.description}</p>
                    </div>
                    {isPopular ? (
                      <span className="text-xs font-medium bg-neutral-900 text-white px-2.5 py-1 rounded-full">
                        Most Popular
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6">
                    <div className="text-3xl font-bold">${price}</div>
                    <div className="text-sm text-neutral-500">${perReview} / review</div>
                  </div>

                  <div className="mt-6 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Reviews</span>
                      <span className="font-medium">{p.reviews}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Mix</span>
                      <span className="font-medium">{p.mix}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link href="/signup">
                      <Button className="w-full">Get started</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get real feedback?
          </h2>
          <p className="text-neutral-400 mb-8">
            Join thousands of artists and reviewers on SoundCheck
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-white text-neutral-900 hover:bg-neutral-100"
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: "How does SoundCheck work?",
                a: "Artists submit a private link to their track and choose a review package. Reviewers matched by genre listen and submit structured feedback.",
              },
              {
                q: "How much does it cost?",
                a: "Packages start at $3.00. Pricing scales with the number of reviews and reviewer tier mix.",
              },
              {
                q: "Who are the reviewers?",
                a: "Reviewers are genre-matched listeners who complete onboarding requirements and are rewarded for high-quality feedback.",
              },
              {
                q: "How long until I get feedback?",
                a: "Most tracks complete within 24–72 hours depending on package and reviewer availability.",
              },
              {
                q: "Is my music kept private?",
                a: "Yes. Tracks are shared only with assigned reviewers. Do not share publicly if you want strict privacy.",
              },
              {
                q: "How do reviewers get paid?",
                a: "Reviewers earn per completed review and can request payouts once they reach the minimum balance.",
              },
              {
                q: "Can I get a refund?",
                a: "For MVP, refunds are handled manually by support. If your track has not started receiving reviews, we can usually refund.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="rounded-lg border border-neutral-200 p-4"
              >
                <summary className="font-medium cursor-pointer">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-neutral-500">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <p>&copy; {new Date().getFullYear()} SoundCheck. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <Link href="/terms" className="hover:text-neutral-900">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-neutral-900">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
