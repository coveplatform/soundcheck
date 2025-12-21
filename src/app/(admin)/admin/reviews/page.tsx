import { prisma } from "@/lib/prisma";
import { ReviewerRestrictionToggle } from "@/components/admin/reviewer-restriction-toggle";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { q?: string; reason?: string };
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const reason = typeof searchParams.reason === "string" ? searchParams.reason : "";

  const reviews = await prisma.review.findMany({
    where: {
      wasFlagged: true,
      ...(reason ? { flagReason: reason as never } : {}),
      ...(q
        ? {
            OR: [
              { track: { title: { contains: q, mode: "insensitive" } } },
              { reviewer: { user: { email: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      track: { select: { title: true } },
      reviewer: {
        select: {
          id: true,
          isRestricted: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Flagged Reviews</h1>
        <p className="text-neutral-500">Most recent flagged reviews (up to 50)</p>
      </div>

      <form className="flex flex-col sm:flex-row gap-2" action="/admin/reviews" method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search track or reviewer email"
          className="flex-1 h-9 px-3 border border-neutral-200 rounded-md text-sm"
        />
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
                <th className="text-left font-medium px-4 py-3">Track</th>
                <th className="text-left font-medium px-4 py-3">Reviewer</th>
                <th className="text-left font-medium px-4 py-3">Reason</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Created</th>
                <th className="text-left font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {reviews.map((r) => (
                <tr key={r.id} className="text-neutral-700">
                  <td className="px-4 py-3">{r.track.title}</td>
                  <td className="px-4 py-3">{r.reviewer.user.email}</td>
                  <td className="px-4 py-3">{r.flagReason ?? ""}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <ReviewerRestrictionToggle
                      reviewerId={r.reviewer.id}
                      isRestricted={r.reviewer.isRestricted}
                    />
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
