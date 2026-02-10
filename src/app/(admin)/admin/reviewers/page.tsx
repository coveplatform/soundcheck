import { prisma } from "@/lib/prisma";
import { ReviewerRestrictionToggle } from "@/components/admin/reviewer-restriction-toggle";

export const dynamic = 'force-dynamic';

export default async function AdminReviewersPage({
  searchParams,
}: {
  searchParams: Promise<{ restricted?: string; q?: string }>;
}) {
  const { restricted, q: query } = await searchParams;
  const restrictedOnly = restricted === "1";
  const q = typeof query === "string" ? query.trim() : "";

  const reviewers = await prisma.reviewerProfile.findMany({
    where: {
      ...(restrictedOnly ? { isRestricted: true } : {}),
      ...(q
        ? {
            user: {
              email: { contains: q, mode: "insensitive" },
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { email: true, createdAt: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviewers</h1>
        <p className="text-neutral-500">Most recent reviewers (up to 50)</p>
      </div>

      <form className="flex flex-col sm:flex-row gap-2" action="/admin/reviewers" method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search reviewer email"
          className="flex-1 h-9 px-3 border border-neutral-200 rounded-md text-sm"
        />
        <select
          name="restricted"
          defaultValue={restrictedOnly ? "1" : ""}
          className="h-9 px-3 border border-neutral-200 rounded-md text-sm"
        >
          <option value="">All reviewers</option>
          <option value="1">Restricted only</option>
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
                <th className="text-left font-medium px-4 py-3">Email</th>
                <th className="text-left font-medium px-4 py-3">Tier</th>
                <th className="text-left font-medium px-4 py-3">Reviews</th>
                <th className="text-left font-medium px-4 py-3">Rating</th>
                <th className="text-left font-medium px-4 py-3">Onboarding</th>
                <th className="text-left font-medium px-4 py-3">Stripe</th>
                <th className="text-left font-medium px-4 py-3">Flags</th>
                <th className="text-left font-medium px-4 py-3">Restricted</th>
                <th className="text-left font-medium px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {reviewers.map((r) => (
                <tr key={r.id} className="text-neutral-700">
                  <td className="px-4 py-3">{r.user.email}</td>
                  <td className="px-4 py-3">{r.tier}</td>
                  <td className="px-4 py-3">{r.totalReviews}</td>
                  <td className="px-4 py-3">{r.averageRating.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {r.completedOnboarding && r.onboardingQuizPassed ? "Complete" : "Incomplete"}
                  </td>
                  <td className="px-4 py-3">{r.stripeAccountId ? "Connected" : "Not connected"}</td>
                  <td className="px-4 py-3">{r.flagCount}</td>
                  <td className="px-4 py-3">{r.isRestricted ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <ReviewerRestrictionToggle
                      reviewerId={r.id}
                      isRestricted={r.isRestricted}
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
