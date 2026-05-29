import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function OutstandingReviewsPage() {
  const tracks = await (prisma as any).track.findMany({
    where: {
      status: { in: ["QUEUED", "IN_PROGRESS"] },
    },
    select: {
      id: true,
      title: true,
      status: true,
      reviewsRequested: true,
      reviewsCompleted: true,
      createdAt: true,
      ArtistProfile: {
        select: {
          id: true,
          artistName: true,
          User: { select: { id: true, email: true } },
        },
      },
      Review: {
        where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
        select: { id: true, status: true, updatedAt: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Only tracks that actually have reviews still outstanding
  const outstanding = tracks.filter(
    (t: any) => t.reviewsCompleted < t.reviewsRequested
  );

  const totalOutstanding = outstanding.reduce(
    (sum: number, t: any) => sum + (t.reviewsRequested - t.reviewsCompleted),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Outstanding Reviews</h1>
          <p className="text-neutral-500 mt-1">
            Tracks in queue with reviews not yet completed
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-amber-600">{totalOutstanding}</div>
          <div className="text-xs text-neutral-500 uppercase tracking-wide">reviews outstanding</div>
        </div>
      </div>

      {outstanding.length === 0 ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <p className="text-green-700 font-semibold">All caught up — no outstanding reviews.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-4 py-3">Artist</th>
                <th className="text-left font-medium px-4 py-3">Track</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-center font-medium px-4 py-3">Progress</th>
                <th className="text-center font-medium px-4 py-3">Outstanding</th>
                <th className="text-center font-medium px-4 py-3">Assigned</th>
                <th className="text-left font-medium px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {outstanding.map((track: any) => {
                const remaining = track.reviewsRequested - track.reviewsCompleted;
                const assignedCount = track.Review?.length ?? 0;
                const unassigned = remaining - assignedCount;
                const artist = track.ArtistProfile;

                return (
                  <tr key={track.id} className="text-neutral-700 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/admin/users/${artist?.User?.id}`}
                          className="font-medium underline hover:text-purple-600"
                        >
                          {artist?.artistName || artist?.User?.email || "Unknown"}
                        </Link>
                        <span className="text-xs text-neutral-400">{artist?.User?.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tracks/${track.id}`}
                        className="underline hover:text-purple-600"
                      >
                        {track.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        track.status === "IN_PROGRESS"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {track.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      <span className="font-medium">
                        {track.reviewsCompleted}/{track.reviewsRequested}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-7 h-7 rounded-full flex items-center justify-center font-black text-sm ${
                        remaining === 1
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {remaining}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-neutral-500">
                      {assignedCount > 0 ? (
                        <span className="text-blue-600 font-medium">{assignedCount} in progress</span>
                      ) : unassigned > 0 ? (
                        <span className="text-neutral-400">none assigned</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">
                      {new Date(track.createdAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
