import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import { Star, ThumbsUp, ThumbsDown, ListMusic, Share2, UserPlus, Music, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const avgScore =
    ((review.productionScore || 0) + (review.originalityScore || 0) + (review.vocalScore || 0)) /
    (review.vocalScore ? 3 : 2);

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo className="h-6" />
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-lime-500 text-black hover:bg-lime-400 font-bold border-2 border-black text-xs">
              Get Feedback
            </Button>
          </Link>
        </div>
      </header>

      {/* Review Card */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {/* Track Header */}
          <div className="p-4 border-b-2 border-black bg-black text-white flex items-center gap-4">
            {review.track.artworkUrl ? (
              <img
                src={review.track.artworkUrl}
                alt={review.track.title}
                className="h-12 w-12 object-cover border-2 border-white"
              />
            ) : (
              <div className="h-12 w-12 bg-neutral-800 border-2 border-white flex items-center justify-center">
                <Music className="h-6 w-6 text-neutral-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-400 font-mono">Review for</p>
              <h1 className="font-bold truncate">{review.track.title}</h1>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 divide-x-2 divide-black border-b-2 border-black">
            <div className="p-4 text-center">
              <p className="text-xs text-neutral-500 mb-1">Production</p>
              <p className="text-2xl font-black">{review.productionScore}/5</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-neutral-500 mb-1">Originality</p>
              <p className="text-2xl font-black">{review.originalityScore}/5</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-neutral-500 mb-1">Listen Again?</p>
              <div className="flex justify-center">
                {review.wouldListenAgain ? (
                  <ThumbsUp className="h-6 w-6 text-lime-600" />
                ) : (
                  <ThumbsDown className="h-6 w-6 text-neutral-400" />
                )}
              </div>
            </div>
          </div>

          {/* Listener Signals */}
          {(review.wouldAddToPlaylist !== null || review.wouldShare !== null || review.wouldFollow !== null) && (
            <div className="p-4 border-b-2 border-black bg-neutral-50">
              <p className="text-xs text-neutral-500 mb-3 font-medium">Listener Signals</p>
              <div className="flex flex-wrap gap-2">
                {review.wouldAddToPlaylist !== null && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 ${
                      review.wouldAddToPlaylist
                        ? "bg-lime-100 border-lime-500 text-lime-700"
                        : "bg-neutral-100 border-neutral-300 text-neutral-500"
                    }`}
                  >
                    <ListMusic className="h-3.5 w-3.5" />
                    {review.wouldAddToPlaylist ? "Would playlist" : "No playlist"}
                  </span>
                )}
                {review.wouldShare !== null && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 ${
                      review.wouldShare
                        ? "bg-lime-100 border-lime-500 text-lime-700"
                        : "bg-neutral-100 border-neutral-300 text-neutral-500"
                    }`}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {review.wouldShare ? "Would share" : "No share"}
                  </span>
                )}
                {review.wouldFollow !== null && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 ${
                      review.wouldFollow
                        ? "bg-lime-100 border-lime-500 text-lime-700"
                        : "bg-neutral-100 border-neutral-300 text-neutral-500"
                    }`}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {review.wouldFollow ? "Would follow" : "No follow"}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Written Feedback */}
          <div className="p-6 space-y-5">
            {review.bestPart && (
              <div>
                <h3 className="text-xs font-bold text-lime-700 uppercase tracking-wide mb-2">
                  What Worked
                </h3>
                <p className="text-sm text-neutral-800 leading-relaxed pl-3 border-l-4 border-lime-500">
                  {review.bestPart}
                </p>
              </div>
            )}

            {review.weakestPart && (
              <div>
                <h3 className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">
                  To Improve
                </h3>
                <p className="text-sm text-neutral-800 leading-relaxed pl-3 border-l-4 border-red-400">
                  {review.weakestPart}
                </p>
              </div>
            )}

            {review.nextActions && (
              <div>
                <h3 className="text-xs font-bold text-black uppercase tracking-wide mb-2">
                  Next Actions
                </h3>
                <p className="text-sm text-neutral-800 leading-relaxed pl-3 border-l-4 border-black whitespace-pre-wrap">
                  {review.nextActions}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t-2 border-black bg-neutral-50 flex items-center justify-between">
            <p className="text-xs text-neutral-500">
              Reviewed on {review.createdAt.toLocaleDateString()}
            </p>
            {review.perceivedGenre && (
              <p className="text-xs text-neutral-500">
                Genre: <span className="font-medium text-neutral-700">{review.perceivedGenre}</span>
              </p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-neutral-600 mb-4">Want feedback like this on your music?</p>
          <Link href="/signup">
            <Button className="bg-lime-500 text-black hover:bg-lime-400 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              Get Feedback on Your Track <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Branding */}
        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-600 text-sm">
            <Logo className="h-4 opacity-50" />
            <span>Powered by MixReflect</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
