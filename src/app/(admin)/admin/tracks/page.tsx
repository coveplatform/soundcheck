import { prisma } from "@/lib/prisma";
import { AdminTracksTable } from "@/components/admin/admin-tracks-table";

export const dynamic = 'force-dynamic';

export default async function AdminTracksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: statusParam, q: query } = await searchParams;
  const status = typeof statusParam === "string" ? statusParam : undefined;
  const q = typeof query === "string" ? query.trim() : "";

  const tracks = await prisma.track.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              {
                artist: {
                  user: { email: { contains: q, mode: "insensitive" } },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      status: true,
      packageType: true,
      promoCode: true,
      createdAt: true,
      desiredReviews: true,
      artist: {
        select: {
          subscriptionStatus: true,
          freeReviewCredits: true,
          user: { select: { id: true, email: true } },
        },
      },
      payment: { select: { status: true, stripePaymentId: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tracks</h1>
        <p className="text-neutral-500">Most recent tracks (up to 50)</p>
      </div>

      <form className="flex flex-col sm:flex-row gap-2" action="/admin/tracks" method="GET">
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
