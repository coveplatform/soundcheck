import { prisma } from "@/lib/prisma";
import { RefundButton } from "@/components/admin/refund-button";
import Link from "next/link";

export default async function AdminTracksPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

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
    include: {
      artist: { include: { user: { select: { id: true, email: true } } } },
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

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Title</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Package</th>
                <th className="text-left font-medium px-4 py-3">Payment</th>
                <th className="text-left font-medium px-4 py-3">Artist</th>
                <th className="text-left font-medium px-4 py-3">Created</th>
                <th className="text-left font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tracks.map((t) => (
                <tr key={t.id} className="text-neutral-700">
                  <td className="px-4 py-3">
                    <Link className="underline" href={`/admin/tracks/${t.id}`}>
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{t.status}</td>
                  <td className="px-4 py-3">{t.packageType}</td>
                  <td className="px-4 py-3">{t.payment?.status ?? ""}</td>
                  <td className="px-4 py-3">
                    <Link className="underline" href={`/admin/users/${t.artist.user.id}`}>
                      {t.artist.user.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {t.payment?.status === "COMPLETED" &&
                    t.status !== "CANCELLED" &&
                    t.payment.stripePaymentId ? (
                      <RefundButton trackId={t.id} />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
