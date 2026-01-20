import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import {
  SparklesDoodle,
  StarDoodle,
  SquiggleDoodle,
  MusicDoodle,
} from "@/components/dashboard/doodles";

export const dynamic = "force-dynamic";

export default async function ArtistDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const artistProfile = await prisma.artistProfile.findUnique({
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
    (t) => (t.status as any) === "UPLOADED" || t.reviewsRequested === 0
  );
  const reviewing = tracks.filter(
    (t) => t.status === "QUEUED" || t.status === "IN_PROGRESS"
  );

  const newestUploadedOnly = uploadedOnly[0] ?? null;
  const newestReviewing = reviewing[0] ?? null;

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
    <div className="pt-14 sm:pt-16 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
      {/* Doodles for personality */}
      <SparklesDoodle className="pointer-events-none absolute top-20 right-10 w-16 h-16 text-yellow-400 opacity-40 rotate-12 hidden lg:block" />
      <StarDoodle className="pointer-events-none absolute top-40 left-10 w-12 h-12 text-lime-500 opacity-60 -rotate-12 hidden lg:block" />
      <MusicDoodle className="pointer-events-none absolute bottom-40 right-20 w-20 h-20 text-purple-400 opacity-30 rotate-6 hidden lg:block" />
      <SquiggleDoodle className="pointer-events-none absolute top-1/2 left-1/4 w-24 h-24 text-orange-300 opacity-20 -rotate-12 hidden xl:block" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Dashboard</h1>
        </div>

        {/* Main Action Card - flowy and soft */}
        <div className="mb-8 rounded-3xl border border-neutral-200 bg-gradient-to-br from-lime-50 via-yellow-50 to-orange-50 p-5 sm:p-8 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-lime-400 rounded-full mb-4">
                <span className="text-xs font-bold uppercase tracking-wider">Next Step</span>
              </div>
              <h2 className="text-2xl font-bold text-black">{nextAction.title}</h2>
              <p className="mt-2 text-black/70">{nextAction.description}</p>
              <div className="mt-6">
                <Link href={nextAction.href}>
                  <Button className="bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-full shadow-md hover:shadow-lg transition-all h-12 px-6">
                    {nextAction.cta}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - soft and flowy */}
        <div className="grid gap-5 sm:grid-cols-3 mb-8">
          <div className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-md">
            <p className="text-xs font-medium text-black/50 uppercase tracking-wider">Tracks</p>
            <p className="mt-3 text-4xl font-bold text-black">{tracks.length}</p>
            <p className="text-sm text-black/50 mt-1">in your library</p>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-md">
            <p className="text-xs font-medium text-black/50 uppercase tracking-wider">In Review</p>
            <p className="mt-3 text-4xl font-bold text-black">{reviewing.length}</p>
            <p className="text-sm text-black/50 mt-1">getting feedback</p>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-lime-50 to-yellow-50 p-6 shadow-md">
            <p className="text-xs font-medium text-black/50 uppercase tracking-wider">Earnings</p>
            <p className="mt-3 text-4xl font-bold text-lime-700">${totalEarnings.toFixed(2)}</p>
            <p className="text-sm text-black/50 mt-1">lifetime total</p>
          </div>
        </div>

        {/* Recent Tracks - soft and flowy */}
        {tracks.length > 0 && (
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-medium text-black/50 uppercase tracking-wider">Recent Tracks</p>
                <p className="text-lg font-bold text-black mt-1">Your latest uploads</p>
              </div>
              <Link href="/artist/tracks" className="text-sm text-black/60 hover:text-black font-medium transition-colors">
                View all →
              </Link>
            </div>

            <div className="space-y-3">
              {tracks.slice(0, 3).map((t) => {
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
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-gradient-to-r from-neutral-50 to-white border border-neutral-200 px-5 py-4 hover:shadow-md transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-black truncate">{t.title}</p>
                      <p className="text-xs text-black/50 font-medium">
                        {(t.status as any) === "UPLOADED" ? "Ready to request reviews" : t.status.replaceAll("_", " ").toLowerCase()}
                      </p>
                    </div>
                    <Link href={cta.href} className="w-full sm:w-auto flex-shrink-0">
                      <Button className="h-9 px-4 bg-black hover:bg-black/90 text-white font-bold rounded-full w-full sm:w-auto">
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
