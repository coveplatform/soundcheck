import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import { Music, ArrowRight, Check, ListMusic, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "./share-buttons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;

  const review = await prisma.review.findUnique({
    where: { shareId },
    include: {
      track: { select: { title: true } },
    },
  });

  if (!review || review.status !== "COMPLETED") {
    return { title: "Review Not Found | MixReflect" };
  }

  // Calculate average score for compelling description
  const scores = [review.productionScore, review.originalityScore, review.vocalScore].filter(
    (s): s is number => s !== null
  );
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const roundedScore = Math.round(avgScore * 10) / 10;

  const title = `"${review.track.title}" scored ${roundedScore}/5 on MixReflect`;

  // Build a compelling description that front-loads key info
  const parts: string[] = [];
  if (review.wouldListenAgain) {
    parts.push("✓ Would Listen Again");
  }
  if (review.bestPart) {
    const quote = review.bestPart.slice(0, 100);
    parts.push(`"${quote}${review.bestPart.length > 100 ? "..." : ""}"`);
  }
  const description = parts.length > 0
    ? parts.join(" · ")
    : "Real listener feedback on MixReflect";

  const url = `https://mixreflect.com/r/${shareId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "MixReflect",
      url,
      images: [
        {
          url: `/r/${shareId}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Review of ${review.track.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;

  const review = await prisma.review.findUnique({
    where: { shareId },
    include: {
      track: {
        select: {
          title: true,
          artworkUrl: true,
        },
      },
      reviewer: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!review || review.status !== "COMPLETED") {
    notFound();
  }

  // Calculate average score
  const scores = [review.productionScore, review.originalityScore, review.vocalScore].filter(
    (s): s is number => s !== null
  );
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const roundedScore = Math.round(avgScore * 10) / 10;
  const fullStars = Math.floor(roundedScore);

  // Count positive signals
  const positiveSignals = [
    review.wouldListenAgain,
    review.wouldAddToPlaylist,
    review.wouldShare,
    review.wouldFollow,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">
            <Logo className="h-5 text-white" />
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-lime-500 text-black hover:bg-lime-400 font-bold text-xs">
              Get Feedback
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          {/* Artwork */}
          <div className="mb-6">
            {review.track.artworkUrl ? (
              <img
                src={review.track.artworkUrl}
                alt={review.track.title}
                className="w-48 h-48 mx-auto object-cover rounded-xl shadow-2xl border-4 border-neutral-800"
              />
            ) : (
              <div className="w-48 h-48 mx-auto bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border-4 border-neutral-800 flex items-center justify-center">
                <Music className="h-16 w-16 text-neutral-600" />
              </div>
            )}
          </div>

          {/* Track Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {review.track.title}
          </h1>

          {/* Score */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-3 bg-neutral-800/50 rounded-full px-6 py-3">
              <span className="text-4xl font-black text-lime-400">{roundedScore}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-2xl ${star <= fullStars ? "text-lime-400" : "text-neutral-600"}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Would Listen Again Badge */}
          {review.wouldListenAgain && (
            <div className="inline-flex items-center gap-2 bg-lime-500 text-black px-5 py-2.5 rounded-full font-bold text-sm">
              <Check className="h-5 w-5" />
              Would Listen Again
            </div>
          )}
        </div>

        {/* Quote Highlight */}
        {review.bestPart && (
          <div className="bg-neutral-800/30 border border-neutral-700 rounded-xl p-6 mb-6">
            <p className="text-lg text-neutral-200 leading-relaxed italic">
              &ldquo;{review.bestPart}&rdquo;
            </p>
          </div>
        )}

        {/* Signals Row */}
        {positiveSignals > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {review.wouldAddToPlaylist && (
              <span className="inline-flex items-center gap-1.5 bg-neutral-800 text-lime-400 px-3 py-1.5 rounded-full text-sm font-medium">
                <ListMusic className="h-4 w-4" />
                Would Playlist
              </span>
            )}
            {review.wouldShare && (
              <span className="inline-flex items-center gap-1.5 bg-neutral-800 text-lime-400 px-3 py-1.5 rounded-full text-sm font-medium">
                <Share2 className="h-4 w-4" />
                Would Share
              </span>
            )}
            {review.wouldFollow && (
              <span className="inline-flex items-center gap-1.5 bg-neutral-800 text-lime-400 px-3 py-1.5 rounded-full text-sm font-medium">
                <UserPlus className="h-4 w-4" />
                Would Follow
              </span>
            )}
          </div>
        )}

        {/* Share Buttons */}
        <ShareButtons
          shareId={shareId}
          trackTitle={review.track.title}
          score={roundedScore}
        />

        {/* Detailed Feedback */}
        <div className="bg-neutral-800/20 border border-neutral-800 rounded-xl overflow-hidden mt-8">
          <div className="p-4 border-b border-neutral-800">
            <h2 className="font-bold text-white text-sm uppercase tracking-wide">
              Detailed Feedback
            </h2>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-neutral-800">
            <div className="bg-neutral-900 p-4 text-center">
              <p className="text-xs text-neutral-500 mb-1">Production</p>
              <p className="text-xl font-bold text-white">{review.productionScore}/5</p>
            </div>
            <div className="bg-neutral-900 p-4 text-center">
              <p className="text-xs text-neutral-500 mb-1">Originality</p>
              <p className="text-xl font-bold text-white">{review.originalityScore}/5</p>
            </div>
            {review.vocalScore && (
              <div className="bg-neutral-900 p-4 text-center col-span-2 sm:col-span-1">
                <p className="text-xs text-neutral-500 mb-1">Vocals</p>
                <p className="text-xl font-bold text-white">{review.vocalScore}/5</p>
              </div>
            )}
          </div>

          {/* Written Sections */}
          <div className="p-5 space-y-5">
            {review.bestPart && (
              <div>
                <h3 className="text-xs font-bold text-lime-400 uppercase tracking-wide mb-2">
                  What Worked
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {review.bestPart}
                </p>
              </div>
            )}

            {review.weakestPart && (
              <div>
                <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-2">
                  Areas to Improve
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {review.weakestPart}
                </p>
              </div>
            )}

            {review.nextActions && (
              <div>
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-2">
                  Suggested Next Steps
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {review.nextActions}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
            <span>Reviewed {review.createdAt.toLocaleDateString()}</span>
            {review.perceivedGenre && (
              <span>Genre: {review.perceivedGenre}</span>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-lime-500/10 to-lime-400/10 border border-lime-500/30 rounded-xl p-8">
            <h2 className="text-xl font-bold text-white mb-2">
              Want feedback like this?
            </h2>
            <p className="text-neutral-400 mb-6">
              Get honest reviews from real listeners before you release.
            </p>
            <Link href="/signup">
              <Button className="bg-lime-500 text-black hover:bg-lime-400 font-bold px-8 py-3 text-base">
                Get Feedback on Your Track <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Branding */}
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-400 text-sm transition-colors">
            <Logo className="h-4" />
            <span>Powered by MixReflect</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
