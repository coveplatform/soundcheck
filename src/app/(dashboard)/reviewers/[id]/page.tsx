import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Star, Gem, Music } from "lucide-react";

export const dynamic = "force-dynamic";

function getTitle(p: {
  isIndustryExpert: boolean;
  gemCount: number;
  averageRating: number;
  totalReviews: number;
}): string | null {
  if (p.isIndustryExpert) return "Industry Expert";
  if (p.gemCount >= 10) return "Gem Listener";
  if (p.averageRating >= 4.5 && p.totalReviews >= 30) return "Top Reviewer";
  if (p.averageRating >= 4.0 && p.totalReviews >= 15) return "Trusted Ear";
  if (p.totalReviews >= 50) return "Veteran Listener";
  if (p.totalReviews >= 20) return "Active Reviewer";
  return null;
}

function getSpecialty(focusCounts: Record<string, number>): string | null {
  const map: Record<string, string> = {
    MIXING: "Mixing",
    ARRANGEMENT: "Arrangement",
    SOUND_DESIGN: "Sound Design",
    SONGWRITING: "Songwriting",
    PERFORMANCE: "Performance",
  };
  const top = Object.entries(focusCounts).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] >= 3 ? map[top[0]] ?? null : null;
}

export default async function ReviewerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const reviewer = await prisma.reviewerProfile.findUnique({
    where: { id },
    include: {
      User: {
        select: {
          name: true,
          // get their ArtistProfile if they're also an artist
          ArtistProfile: {
            select: {
              artistName: true,
              Track: {
                where: { isPublic: true, status: { in: ["COMPLETED", "IN_PROGRESS", "QUEUED"] } },
                select: { id: true, title: true, artworkUrl: true, sourceUrl: true },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
      Genre: { select: { id: true, name: true } },
      Review: {
        where: { status: "COMPLETED" },
        select: { nextFocus: true },
        take: 100,
      },
    },
  });

  if (!reviewer || reviewer.isRestricted) notFound();

  const fullName = reviewer.User.name ?? "Reviewer";
  const firstName = fullName.trim().split(/\s+/g)[0] || "Reviewer";
  const initial = (fullName.trim()[0] || "?").toUpperCase();

  const title = getTitle({
    isIndustryExpert: reviewer.isIndustryExpert,
    gemCount: reviewer.gemCount,
    averageRating: reviewer.averageRating,
    totalReviews: reviewer.totalReviews,
  });

  // Derive specialty from review history
  const focusCounts: Record<string, number> = {};
  for (const r of reviewer.Review) {
    if (r.nextFocus) focusCounts[r.nextFocus] = (focusCounts[r.nextFocus] ?? 0) + 1;
  }
  const specialty = getSpecialty(focusCounts);

  const artistProfile = reviewer.User.ArtistProfile;
  const featuredTrack = artistProfile?.Track?.[0] ?? null;

  const ratingStars = Math.round(reviewer.averageRating);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      <Link
        href="/reviewers"
        className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-black transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-black/8 shadow-sm overflow-hidden">
        {/* Purple header band */}
        <div className="h-16 bg-gradient-to-r from-purple-600 to-purple-800" />

        <div className="px-6 pb-6">
          {/* Avatar — overlaps the band */}
          <div className="-mt-8 mb-4 flex items-end justify-between">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 border-4 border-white flex items-center justify-center text-2xl font-black text-white shadow-md">
              {initial}
            </div>
            {title && (
              <span className="text-[11px] font-black px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                {title}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black text-black tracking-tight">{firstName}</h1>

          {specialty && (
            <p className="text-sm font-semibold text-neutral-500 mt-0.5">
              Focuses on <span className="text-purple-700">{specialty}</span>
            </p>
          )}

          {reviewer.Genre.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {reviewer.Genre.map((g) => (
                <span key={g.id} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/5 text-neutral-600">
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-black/8 p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-black">{reviewer.totalReviews}</p>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">Reviews</p>
        </div>
        <div className="bg-white rounded-xl border border-black/8 p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-0.5 mb-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < ratingStars ? "text-amber-400 fill-amber-400" : "text-black/10 fill-black/10"}`}
              />
            ))}
          </div>
          <p className="text-2xl font-black text-black leading-none">{reviewer.averageRating.toFixed(1)}</p>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">Rating</p>
        </div>
        <div className="bg-white rounded-xl border border-black/8 p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Gem className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-black leading-none">{reviewer.gemCount}</p>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">Gems</p>
        </div>
      </div>

      {/* Their own track — if they're also an artist */}
      {featuredTrack && artistProfile && (
        <div className="bg-white rounded-2xl border border-black/8 shadow-sm p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3">
            Also an artist
          </p>
          <Link href={`/tracks/${featuredTrack.id}`} className="flex items-center gap-4 group">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-purple-100">
              {featuredTrack.artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featuredTrack.artworkUrl} alt={featuredTrack.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="h-6 w-6 text-purple-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-black group-hover:underline truncate">{featuredTrack.title}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{artistProfile.artistName}</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
