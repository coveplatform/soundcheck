import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import { Music, ArrowRight, Check, ListMusic, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "./share-buttons";
import { ExpandableDetails } from "./expandable-details";
import { ReferralTracker } from "./referral-tracker";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;

  const review = await prisma.review.findUnique({
    where: { shareId },
    include: {
      Track: { select: { title: true } },
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
    parts.push("Would Listen Again");
  }
  if (review.bestPart) {
    const quote = review.bestPart.slice(0, 100);
    parts.push(`"${quote}${review.bestPart.length > 100 ? "..." : ""}"`);
  }
  const description = parts.length > 0
    ? parts.join(" - ")
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
      Track: {
        select: {
          id: true,
          title: true,
          artworkUrl: true,
        },
      },
      ReviewerProfile: {
        select: {
          id: true,
          User: { select: { name: true } },
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

  // Count positive signals
  const signals = [
    review.wouldAddToPlaylist && { icon: "playlist", label: "Would Playlist" },
    review.wouldShare && { icon: "share", label: "Would Share" },
    review.wouldFollow && { icon: "follow", label: "Would Follow" },
  ].filter(Boolean) as { icon: string; label: string }[];

  return (
    <div className="min-h-screen bg-neutral-50 pt-14">
      {/* Referral tracking for affiliate commission */}
      <ReferralTracker
        reviewerId={review.ReviewerProfile.id}
        shareId={shareId}
        trackId={review.track.id}
      />

      {/* Header */}
      <header className="border-b-2 border-black bg-white fixed top-0 left-0 right-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-purple-600 text-black hover:bg-purple-500 font-bold text-xs border-2 border-black">
              Get Feedback
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Review Card */}
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {/* Track Header */}
          <div className="p-4 border-b-2 border-black bg-black flex items-center gap-4">
            {review.track.artworkUrl ? (
              <img
                src={review.track.artworkUrl}
                alt={review.track.title}
                className="w-16 h-16 object-cover border-2 border-neutral-700 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center flex-shrink-0">
                <Music className="h-6 w-6 text-neutral-500" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-white truncate">
                {review.track.title}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-black text-purple-500">{roundedScore}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${star <= fullStars ? "text-purple-500" : "text-neutral-600"}`}
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
            <div className="px-4 py-3 border-b-2 border-black bg-purple-600">
              <div className="flex items-center gap-2 font-bold text-black">
                <Check className="h-5 w-5" />
                Would Listen Again
              </div>
            </div>
          )}

          {/* Listener Signals */}
          {signals.length > 0 && (
            <div className="px-4 py-3 border-b-2 border-black bg-neutral-50">
              <p className="text-xs text-neutral-500 font-medium mb-2">Listener Signals</p>
              <div className="flex flex-wrap gap-2">
                {signals.map((signal) => (
                  <span
                    key={signal.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-100 border-2 border-purple-600 text-purple-700"
                  >
                    {signal.icon === "playlist" && <ListMusic className="h-3.5 w-3.5" />}
                    {signal.icon === "share" && <Share2 className="h-3.5 w-3.5" />}
                    {signal.icon === "follow" && <UserPlus className="h-3.5 w-3.5" />}
                    {signal.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quote */}
          {review.bestPart && (
            <div className="p-4 border-b-2 border-black">
              <div className="flex items-start gap-2 mb-2">
                <span className="w-6 h-6 bg-purple-600 border border-black flex items-center justify-center text-xs font-bold flex-shrink-0">+</span>
                <h4 className="font-bold text-sm">What&apos;s Working</h4>
              </div>
              <p className="text-neutral-600 text-sm leading-relaxed pl-8">
                {review.bestPart.length > 250 ? review.bestPart.slice(0, 250) + "..." : review.bestPart}
              </p>
            </div>
          )}

          {/* Share Actions */}
          <div className="p-4 bg-neutral-50">
            <ShareButtons
              shareId={shareId}
              trackTitle={review.track.title}
              score={roundedScore}
            />
          </div>
        </div>

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

        {/* CTA */}
        <div className="mt-6 border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-bold text-lg mb-1">Want feedback like this?</p>
          <p className="text-neutral-700 max-w-xl mx-auto">
            Get 5-20 honest reviews from genre-matched listeners before you release.
          </p>
          <Link href="/signup">
            <Button className="bg-purple-600 text-black hover:bg-purple-500 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-colors transition-shadow transition-transform duration-150 ease-out motion-reduce:transition-none motion-reduce:transform-none">
              Get Feedback <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-black text-sm transition-colors">
            <Logo className="h-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
