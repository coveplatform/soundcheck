import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Info } from "lucide-react";
import { TrackPlayButton } from "@/components/dashboard/track-play-button";
import { Tooltip } from "@/components/ui/tooltip";

export const dynamic = "force-dynamic";

export default async function ArtistDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const artistProfile = await (prisma.artistProfile as any).findUnique({
    where: { userId: session.user.id },
    include: {
      tracks: {
        include: {
          reviews: {
            select: {
              status: true,
            },
          },
          purchases: {
            select: {
              amount: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });

  if (!artistProfile) {
    redirect("/artist/onboarding");
  }

  const tracks = artistProfile.tracks;
  const totalEarnings = artistProfile.totalEarnings / 100;
  const pendingBalance = artistProfile.pendingBalance / 100;

  const uploadedOnly = tracks.filter(
    (t: any) => (t.status as any) === "UPLOADED" || t.reviewsRequested === 0
  );
  const reviewing = tracks.filter(
    (t: any) => t.status === "QUEUED" || t.status === "IN_PROGRESS"
  );

  const newestUploadedOnly = uploadedOnly[0] ?? null;
  const newestReviewing = reviewing[0] ?? null;

  const isSubscribed = artistProfile.subscriptionStatus === "active";
  const planLabel = isSubscribed ? "MixReflect Pro" : "Free";
  const reviewTokens = (artistProfile.freeReviewCredits ?? 0) as number;

  const nextAction = (() => {
    if (tracks.length === 0) {
      return {
        title: "Upload your first track",
        description: "Start building your library and request reviews from listeners.",
        href: "/artist/submit",
        cta: "Upload track",
      };
    }

    if (newestUploadedOnly) {
      return {
        title: "Request reviews",
        description: `Ready to get feedback on "${newestUploadedOnly.title}"?`,
        href: `/artist/tracks/${newestUploadedOnly.id}/request-reviews`,
        cta: "Request reviews",
      };
    }

    if (newestReviewing) {
      return {
        title: "Reviews in progress",
        description: `Check feedback for "${newestReviewing.title}".`,
        href: `/artist/tracks/${newestReviewing.id}`,
        cta: "View track",
      };
    }

    return {
      title: "Your tracks",
      description: "Upload more tracks or explore what's already in your library.",
      href: "/artist/tracks",
      cta: "View tracks",
    };
  })();

  return (
    <div className="pt-14 px-6 sm:px-8 lg:px-12 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10 pb-6 border-b border-neutral-200">
          <div>
            <h1 className="text-5xl sm:text-6xl font-light tracking-tight mb-2">Dashboard</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-neutral-500">{planLabel}</span>
              <span className="text-neutral-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">{reviewTokens} credits</span>
                <Tooltip content="1 credit = 1 review. Use credits to request feedback on your tracks.">
                  <Info className="h-3.5 w-3.5 text-neutral-400" />
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-neutral-500 mb-1">Tracks</p>
              <p className="text-2xl font-semibold tabular-nums">{tracks.length}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">In Review</p>
              <p className="text-2xl font-semibold text-purple-600 tabular-nums">{reviewing.length}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Earnings</p>
              <p className="text-2xl font-semibold text-teal-600 tabular-nums">${totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <Card variant="soft" elevated className="mb-10 overflow-hidden border-l-4 border-l-purple-600">
          <div className="p-5 sm:p-6">
            <div className="inline-block bg-purple-100 text-purple-700 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4 rounded-md">
              Next Step
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-2 max-w-2xl">{nextAction.title}</h2>
            <p className="text-neutral-700 text-base mb-6 max-w-xl">{nextAction.description}</p>
            <Link href={nextAction.href}>
              <Button variant="primary" size="lg">
                {nextAction.cta}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Tracks */}
        {tracks.length > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Tracks</h2>
              <Link href="/artist/tracks" className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors">
                View all →
              </Link>
            </div>

            <div className="space-y-3">
              {tracks.slice(0, 3).map((t: any) => {
                const cta = (t.status as any) === "UPLOADED" || t.reviewsRequested === 0
                  ? {
                      href: `/artist/tracks/${t.id}/request-reviews`,
                      label: "Request reviews",
                    }
                  : {
                      href: `/artist/tracks/${t.id}`,
                      label: "View",
                    };

                return (
                  <div
                    key={t.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white rounded-xl px-5 py-4 border border-neutral-200 hover:border-purple-300 hover:shadow-md transition-all"
                  >
                    {/* Artwork + Play Button */}
                    <div className="relative flex-shrink-0 group">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100">
                        {t.artworkUrl ? (
                          <Image
                            src={t.artworkUrl}
                            alt={t.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
                            <span className="text-2xl text-neutral-400">♪</span>
                          </div>
                        )}
                      </div>
                      {t.sourceUrl && <TrackPlayButton audioUrl={t.sourceUrl} />}
                    </div>

                    {/* Track Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base truncate mb-1">{t.title}</p>
                      <p className="text-xs text-neutral-500 uppercase tracking-wide">
                        {(t.status as any) === "UPLOADED" ? "Ready to request reviews" : t.status.replaceAll("_", " ")}
                      </p>
                    </div>

                    {/* CTA Button */}
                    <Link href={cta.href} className="w-full sm:w-auto flex-shrink-0">
                      <Button variant="primary" className="w-full sm:w-auto">
                        {cta.label}
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
