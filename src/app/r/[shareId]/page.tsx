import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import { Music, ArrowRight, Check, ListMusic, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "./share-buttons";
import { ExpandableDetails } from "./expandable-details";

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

  const scores = [review.productionScore, review.originalityScore, review.vocalScore].filter(
    (s): s is number => s !== null
  );
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const roundedScore = Math.round(avgScore * 10) / 10;

  const title = `"${review.track.title}" scored ${roundedScore}/5 on MixReflect`;

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

  const scores = [review.productionScore, review.originalityScore, review.vocalScore].filter(
    (s): s is number => s !== null
  );
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const roundedScore = Math.round(avgScore * 10) / 10;
  const fullStars = Math.floor(roundedScore);

  // Count positive signals (excluding wouldListenAgain which is shown separately)
  const signals = [
    review.wouldAddToPlaylist && { icon: "playlist", label: "Would Playlist" },
    review.wouldShare && { icon: "share", label: "Would Share" },
    review.wouldFollow && { icon: "follow", label: "Would Follow" },
  ].filter(Boolean) as { icon: string; label: string }[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="opacity-70 hover:opacity-100 transition-opacity">
            <Logo className="h-4 text-white" />
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-lime-500 text-black hover:bg-lime-400 font-bold text-xs h-8 px-3">
              Get Feedback
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Hero - Compact */}
        <div className="text-center mb-6">
          {/* Artwork + Title Row */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {review.track.artworkUrl ? (
              <img
                src={review.track.artworkUrl}
                alt={review.track.title}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg shadow-xl border-2 border-neutral-800 flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg border-2 border-neutral-800 flex items-center justify-center flex-shrink-0">
                <Music className="h-8 w-8 sm:h-10 sm:w-10 text-neutral-600" />
              </div>
            )}
            <div className="text-left min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                {review.track.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-lime-400">{roundedScore}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-base sm:text-lg ${star <= fullStars ? "text-lime-400" : "text-neutral-700"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Would Listen Again Badge */}
          {review.wouldListenAgain && (
            <div className="inline-flex items-center gap-1.5 bg-lime-500 text-black px-4 py-2 rounded-full font-bold text-sm">
              <Check className="h-4 w-4" />
              Would Listen Again
            </div>
          )}
        </div>

        {/* Quote - The Star of the Show */}
        {review.bestPart && (
          <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-lg p-4 mb-4">
            <p className="text-sm sm:text-base text-neutral-200 leading-relaxed">
              &ldquo;{review.bestPart.length > 200 ? review.bestPart.slice(0, 200) + "..." : review.bestPart}&rdquo;
            </p>
          </div>
        )}

        {/* Signals - Compact Row */}
        {signals.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            {signals.map((signal) => (
              <span
                key={signal.label}
                className="inline-flex items-center gap-1 bg-neutral-800/60 text-lime-400 px-2.5 py-1 rounded-full text-xs font-medium"
              >
                {signal.icon === "playlist" && <ListMusic className="h-3 w-3" />}
                {signal.icon === "share" && <Share2 className="h-3 w-3" />}
                {signal.icon === "follow" && <UserPlus className="h-3 w-3" />}
                {signal.label}
              </span>
            ))}
          </div>
        )}

        {/* Share Buttons */}
        <ShareButtons
          shareId={shareId}
          trackTitle={review.track.title}
          score={roundedScore}
        />

        {/* Expandable Details */}
        <ExpandableDetails
          productionScore={review.productionScore}
          originalityScore={review.originalityScore}
          vocalScore={review.vocalScore}
          bestPart={review.bestPart}
          weakestPart={review.weakestPart}
          nextActions={review.nextActions}
          perceivedGenre={review.perceivedGenre}
          reviewDate={review.createdAt.toLocaleDateString()}
        />

        {/* CTA - Compact */}
        <div className="mt-8 text-center">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-5">
            <p className="text-white font-semibold mb-1">Want feedback like this?</p>
            <p className="text-neutral-400 text-sm mb-4">
              Get honest reviews before you release.
            </p>
            <Link href="/signup">
              <Button className="bg-lime-500 text-black hover:bg-lime-400 font-bold text-sm h-10">
                Get Feedback <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Branding */}
        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-neutral-400 text-xs transition-colors">
            <Logo className="h-3" />
            <span>MixReflect</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
