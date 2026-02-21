import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenreTagList } from "@/components/ui/genre-tag";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ArtistReviewerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!artistProfile) {
    redirect("/onboarding");
  }

  const reviewer = await prisma.reviewerProfile.findUnique({
    where: { id },
    include: {
      User: { select: { name: true } },
      Genre: { select: { id: true, name: true } },
      _count: { select: { Review: true } },
    },
  });

  if (!reviewer || reviewer.isRestricted) {
    notFound();
  }

  const fullName = reviewer.User.name ?? "Reviewer";
  const firstName = fullName.trim().split(/\s+/g)[0] || "Reviewer";
  const initial = (fullName.trim()[0] || "?").toUpperCase();

  const lastActive = reviewer.lastReviewDate
    ? new Date(reviewer.lastReviewDate).toLocaleDateString()
    : "—";

  return (
    <div className="space-y-6">
      <Link
        href="/reviewers"
        className="inline-flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-black transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Reviewers
      </Link>

      <Card>
        <CardHeader className="border-b-2 border-black">
          <CardTitle>Reviewer Profile</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-neutral-100 border-2 border-black flex items-center justify-center text-lg font-black">
              {initial}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black truncate">{firstName}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center px-2.5 py-1 border-2 border-black bg-white font-bold">
                  Tier: {reviewer.tier}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 border-2 border-black bg-white font-bold">
                  Avg rating: {reviewer.averageRating.toFixed(2)}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 border-2 border-black bg-white font-bold">
                  Reviews: {reviewer._count.Review}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 border-2 border-black bg-white font-bold">
                  Gems: {reviewer.gemCount}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 border-2 border-black bg-white font-bold">
                  Last active: {lastActive}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-black mb-2">Genres</h2>
            {reviewer.Genre.length > 0 ? (
              <GenreTagList genres={reviewer.Genre} variant="neutral" size="sm" />
            ) : (
              <p className="text-sm text-neutral-600">No genres listed.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b-2 border-black">
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-neutral-700">
            Reviewers are ranked by artist ratings and tier. Higher tiers typically receive higher
            priority assignments.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
