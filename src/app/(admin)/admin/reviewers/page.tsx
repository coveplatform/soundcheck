import { prisma } from "@/lib/prisma";
import { ReviewerToggle } from "./reviewer-toggle";

export const dynamic = "force-dynamic";

export default async function AdminReviewersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const reviewers = await prisma.user.findMany({
    where: { isScoreReviewer: true },
    select: {
      id: true,
      email: true,
      name: true,
      _count: { select: { ScoreReview: true } },
    },
    orderBy: { email: "asc" },
  });

  // Completed counts (for a quick "active reviewer" read).
  const completed = await prisma.scoreReview.groupBy({
    by: ["reviewerId"],
    where: { status: "COMPLETED", reviewerId: { in: reviewers.map((r) => r.id) } },
    _count: { _all: true },
  });
  const completedBy = new Map(completed.map((c) => [c.reviewerId, c._count._all]));

  const results = query
    ? await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        },
        select: { id: true, email: true, name: true, isScoreReviewer: true },
        take: 15,
        orderBy: { email: "asc" },
      })
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Score Reviewers</h1>
        <p className="text-sm text-neutral-500 mt-1">
          The internal “room” — these users are auto-assigned to score-report submissions
          (5 per track). Add real people here; submissions assigned to inactive accounts
          sit unanswered.
        </p>
      </div>

      {/* Current pool */}
      <section className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-800">
            Current reviewers <span className="text-neutral-400">({reviewers.length})</span>
          </h2>
        </div>
        {reviewers.length === 0 ? (
          <p className="px-5 py-8 text-sm text-neutral-500 text-center">
            No reviewers yet. Search below to add some.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-400 text-xs uppercase tracking-wide">
                <th className="px-5 py-2 font-medium">Reviewer</th>
                <th className="px-5 py-2 font-medium">Assigned</th>
                <th className="px-5 py-2 font-medium">Completed</th>
                <th className="px-5 py-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {reviewers.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100">
                  <td className="px-5 py-3">
                    <div className="font-medium text-neutral-800">{r.name || "—"}</div>
                    <div className="text-neutral-400 text-xs">{r.email}</div>
                  </td>
                  <td className="px-5 py-3 text-neutral-600">{r._count.ScoreReview}</td>
                  <td className="px-5 py-3 text-neutral-600">{completedBy.get(r.id) ?? 0}</td>
                  <td className="px-5 py-3 text-right">
                    <ReviewerToggle userId={r.id} isReviewer={true} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Add reviewers */}
      <section className="bg-white border border-neutral-200 rounded-lg p-5">
        <h2 className="font-semibold text-neutral-800 mb-3">Add a reviewer</h2>
        <form method="GET" className="flex gap-2 mb-4">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search users by email or name…"
            className="flex-1 border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
          />
          <button type="submit" className="bg-neutral-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-700">
            Search
          </button>
        </form>

        {query && results.length === 0 && (
          <p className="text-sm text-neutral-500">No users match “{query}”.</p>
        )}
        {results.length > 0 && (
          <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-md">
            {results.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium text-neutral-800 text-sm">{u.name || "—"}</div>
                  <div className="text-neutral-400 text-xs">{u.email}</div>
                </div>
                <ReviewerToggle userId={u.id} isReviewer={u.isScoreReviewer} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
