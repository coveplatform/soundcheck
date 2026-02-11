import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ReviewerRestrictionToggle } from "@/components/admin/reviewer-restriction-toggle";

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; flagged?: string; reason?: string }>;
}) {
  const { q: query, flagged: flaggedParam, reason: reasonParam } = await searchParams;
  const q = typeof query === "string" ? query.trim() : "";
  const flaggedOnly = flaggedParam === "1";
  const reason = typeof reasonParam === "string" ? reasonParam : "";

  const reviews = await prisma.review.findMany({
    where: {
      status: "COMPLETED",
      ...(flaggedOnly ? { wasFlagged: true } : {}),
      ...(reason && flaggedOnly ? { flagReason: reason as never } : {}),
      ...(q
        ? {
            OR: [
              { Track: { title: { contains: q, mode: "insensitive" } } },
              { ReviewerProfile: { User: { email: { contains: q, mode: "insensitive" } } } },
              { ReviewerProfile: { User: { name: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      Track: {
        select: {
          id: true,
          title: true,
          ArtistProfile: {
            select: {
              User: { select: { email: true } }
            }
          }
        }
      },
      ReviewerProfile: {
        select: {
          id: true,
          isRestricted: true,
          User: { select: { email: true, name: true } },
        },
      },
      ArtistProfile: {
        select: {
          User: { select: { email: true, name: true } },
        },
      },
    },
  });

  // Calculate average scores for display
  const reviewsWithAvg = reviews.map((r) => {
    const scores = [r.productionScore, r.originalityScore, r.vocalScore].filter(
      (s): s is number => s !== null
    );
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    return { ...r, avgScore };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Completed Reviews</h1>
        <p className="text-neutral-500">
          {flaggedOnly ? "Flagged reviews" : "All completed reviews"} (most recent {reviews.length})
        </p>
      </div>

      <form className="flex flex-col sm:flex-row gap-2 items-start sm:items-center" action="/admin/reviews" method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search track, reviewer name or email"
          className="flex-1 h-9 px-3 border border-neutral-200 rounded-md text-sm w-full sm:w-auto"
        />
        <label className="flex items-center gap-2 text-sm text-neutral-600 h-9">
          <input
            type="checkbox"
            name="flagged"
            value="1"
            defaultChecked={flaggedOnly}
            className="h-4 w-4"
          />
          Flagged only
        </label>
        {flaggedOnly && (
          <select
            name="reason"
            defaultValue={reason}
            className="h-9 px-3 border border-neutral-200 rounded-md text-sm"
          >
            <option value="">All reasons</option>
            <option value="low_effort">low_effort</option>
            <option value="spam">spam</option>
            <option value="offensive">offensive</option>
            <option value="irrelevant">irrelevant</option>
          </select>
        )}
        <button
          type="submit"
          className="h-9 px-4 rounded-md text-sm font-medium bg-neutral-900 text-white"
        >
          Apply
        </button>
      </form>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Track</th>
                <th className="text-left font-medium px-4 py-3">Reviewer</th>
                <th className="text-left font-medium px-4 py-3">Score</th>
                <th className="text-left font-medium px-4 py-3">Signals</th>
                <th className="text-left font-medium px-4 py-3">Completed</th>
                {flaggedOnly && <th className="text-left font-medium px-4 py-3">Flag</th>}
                <th className="text-left font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {reviewsWithAvg.map((r) => (
                <tr key={r.id} className={`text-neutral-700 ${r.wasFlagged ? "bg-red-50" : ""}`}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tracks/${r.Track.id}`}
                      className="font-medium hover:underline"
                    >
                      {r.Track.title.length > 30 ? r.Track.title.slice(0, 30) + "..." : r.Track.title}
                    </Link>
                    <div className="text-xs text-neutral-500">{r.Track.ArtistProfile.User.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.ReviewerProfile?.User.name || r.ArtistProfile?.User?.name || "—"}</div>
                    <div className="text-xs text-neutral-500">{r.ReviewerProfile?.User.email || r.ArtistProfile?.User?.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    {r.avgScore !== null ? (
                      <span className={`font-bold ${r.avgScore >= 4 ? "text-green-600" : r.avgScore >= 3 ? "text-yellow-600" : "text-red-600"}`}>
                        {r.avgScore.toFixed(1)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {r.wouldListenAgain && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">Listen</span>
                      )}
                      {r.wouldAddToPlaylist && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Playlist</span>
                      )}
                      {r.wouldShare && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Share</span>
                      )}
                      {r.wouldFollow && (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">Follow</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(r.updatedAt).toLocaleDateString()}
                  </td>
                  {flaggedOnly && (
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium">
                        {r.flagReason ?? "flagged"}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/reviews/${r.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                      {r.wasFlagged && r.ReviewerProfile && (
                        <ReviewerRestrictionToggle
                          reviewerId={r.ReviewerProfile.id}
                          isRestricted={r.ReviewerProfile.isRestricted}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={flaggedOnly ? 7 : 6} className="px-4 py-8 text-center text-neutral-500">
                    No reviews found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
