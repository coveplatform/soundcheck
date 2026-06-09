import { prisma } from "@/lib/prisma";
import { ReviewerToggle } from "./reviewer-toggle";
import { SCORE_REVIEW_RATE_CENTS } from "@/lib/score-review";
import { mono } from "../../admin-ui";

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
    <div className="space-y-8 text-[#f4f4ef]">
      <div>
        <h1 className="text-2xl font-extrabold lowercase">score reviewers</h1>
        <p className="text-sm text-white/45 mt-1">
          The internal “room” — these users are auto-assigned to score-report submissions
          (5 per track) and earn ${(SCORE_REVIEW_RATE_CENTS / 100).toFixed(2)} per completed reaction.
          Submissions assigned to inactive accounts sit unanswered.
        </p>
      </div>

      {/* Current pool */}
      <section className="bg-[#0e0e0e] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-bold lowercase">
            current reviewers <span className="text-white/30">({reviewers.length})</span>
          </h2>
        </div>
        {reviewers.length === 0 ? (
          <p className="px-5 py-8 text-sm text-white/40 text-center">
            No reviewers yet. Search below to add some.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 text-xs uppercase tracking-wide bg-white/[0.03]">
                <th className="px-5 py-2 font-medium">Reviewer</th>
                <th className="px-5 py-2 font-medium text-right">Assigned</th>
                <th className="px-5 py-2 font-medium text-right">Completed</th>
                <th className="px-5 py-2 font-medium text-right">Earned</th>
                <th className="px-5 py-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {reviewers.map((r) => {
                const done = completedBy.get(r.id) ?? 0;
                return (
                  <tr key={r.id} className="border-t border-white/[0.06] text-white/75">
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#f4f4ef]">{r.name || "—"}</div>
                      <div className={`text-white/40 text-xs ${mono.className}`}>{r.email}</div>
                    </td>
                    <td className={`px-5 py-3 text-right text-white/55 ${mono.className}`}>{r._count.ScoreReview}</td>
                    <td className={`px-5 py-3 text-right text-white/55 ${mono.className}`}>{done}</td>
                    <td className={`px-5 py-3 text-right text-[#7cffc4] ${mono.className}`}>${((done * SCORE_REVIEW_RATE_CENTS) / 100).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right">
                      <ReviewerToggle userId={r.id} isReviewer={true} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Add reviewers */}
      <section className="bg-[#0e0e0e] border border-white/10 rounded-xl p-5">
        <h2 className="font-bold mb-3 lowercase">add a reviewer</h2>
        <form method="GET" className="flex gap-2 mb-4">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search users by email or name…"
            className="flex-1 bg-[#141414] border border-white/15 rounded-md px-3 py-2 text-sm text-[#f4f4ef] placeholder:text-white/30 focus:outline-none focus:border-[#6ee7ff]"
          />
          <button type="submit" className="bg-[#6ee7ff] text-black px-4 py-2 rounded-md text-sm font-bold hover:bg-white transition-colors">
            Search
          </button>
        </form>

        {query && results.length === 0 && (
          <p className="text-sm text-white/40">No users match “{query}”.</p>
        )}
        {results.length > 0 && (
          <div className="divide-y divide-white/[0.06] border border-white/10 rounded-md">
            {results.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium text-[#f4f4ef] text-sm">{u.name || "—"}</div>
                  <div className={`text-white/40 text-xs ${mono.className}`}>{u.email}</div>
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
