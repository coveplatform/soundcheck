import { prisma } from "@/lib/prisma";
import { AdminTracksTable } from "@/components/admin/admin-tracks-table";

export const dynamic = 'force-dynamic';

export default async function AdminTracksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; remaining?: string }>;
}) {
  const { status: statusParam, q: query, remaining: remainingParam } = await searchParams;
  const status = typeof statusParam === "string" ? statusParam : undefined;
  const q = typeof query === "string" ? query.trim() : "";
  const filterOneRemaining = remainingParam === "1";

  const allTracks = await prisma.track.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(filterOneRemaining ? { status: { in: ["QUEUED", "IN_PROGRESS"] as never[] } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              {
                ArtistProfile: {
                  User: { email: { contains: q, mode: "insensitive" } },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      packageType: true,
      promoCode: true,
      createdAt: true,
      reviewsRequested: true,
      reviewsCompleted: true,
      creditsSpent: true,
      isPublic: true,
      ArtistProfile: {
        select: {
          subscriptionStatus: true,
          reviewCredits: true,
          User: { select: { id: true, email: true } },
        },
      },
      Payment: { select: { status: true, stripePaymentId: true } },
    },
  });

  const tracks = filterOneRemaining
    ? allTracks.filter((t) => t.reviewsRequested - t.reviewsCompleted === 1)
    : allTracks;

  const oneRemainingCount = allTracks.filter(
    (t) => ["QUEUED", "IN_PROGRESS"].includes(t.status) && t.reviewsRequested - t.reviewsCompleted === 1
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tracks</h1>
          <p className="text-neutral-500">All tracks</p>
        </div>
        {!filterOneRemaining && oneRemainingCount > 0 && (
          <a
            href="/admin/tracks?remaining=1"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
            {oneRemainingCount} track{oneRemainingCount !== 1 ? "s" : ""} need 1 more review
          </a>
        )}
        {filterOneRemaining && (
          <a
            href="/admin/tracks"
            className="text-sm text-neutral-500 underline hover:text-neutral-800"
          >
            ← Show all tracks
          </a>
        )}
      </div>

      {filterOneRemaining && (
        <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          Showing <strong>{tracks.length}</strong> active track{tracks.length !== 1 ? "s" : ""} with exactly 1 review still outstanding.
        </div>
      )}

      <form className="flex flex-col sm:flex-row gap-2" action="/admin/tracks" method="GET">
        {filterOneRemaining && <input type="hidden" name="remaining" value="1" />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title or artist email"
          className="flex-1 h-9 px-3 border border-neutral-200 rounded-md text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 px-3 border border-neutral-200 rounded-md text-sm"
          disabled={filterOneRemaining}
        >
          <option value="">All statuses</option>
          <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
          <option value="QUEUED">QUEUED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <button
          type="submit"
          className="h-9 px-3 rounded-md text-sm font-medium bg-neutral-900 text-white"
        >
          Apply
        </button>
      </form>

      <AdminTracksTable tracks={tracks} />
    </div>
  );
}
