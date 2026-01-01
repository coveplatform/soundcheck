import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function ArtistReviewersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; active?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!artistProfile) {
    redirect("/artist/onboarding");
  }

  const { q: query, active: activeParam } = await searchParams;
  const q = typeof query === "string" ? query.trim() : "";
  const active = typeof activeParam === "string" ? activeParam : "";

  const now = new Date();
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const reviewers = await prisma.reviewerProfile.findMany({
    where: {
      isRestricted: false,
      ...(active === "1"
        ? {
            lastReviewDate: { gte: cutoff },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { user: { name: { contains: q, mode: "insensitive" } } },
              {
                genres: {
                  some: {
                    name: { contains: q, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { name: true } },
      genres: { select: { id: true, name: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: [{ lastReviewDate: "desc" }, { totalReviews: "desc" }, { averageRating: "desc" }],
    take: 50,
  });

  const getFirstName = (name: string) => {
    return name.trim().split(/\s+/g)[0] || "Reviewer";
  };

  const getInitial = (name: string) => {
    return (name.trim()[0] || "?").toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviewers</h1>
        <p className="text-neutral-500">Browse reviewers (top 50). This is informational only.</p>
      </div>

      <form className="flex flex-col md:flex-row gap-3" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or genre"
          className="px-3 py-2 border border-neutral-200 rounded-md text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            name="active"
            value="1"
            defaultChecked={active === "1"}
          />
          Active in last 30 days
        </label>
        <button className="px-3 py-2 rounded-md bg-neutral-900 text-white text-sm">Filter</button>
      </form>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Reviewer</th>
                <th className="text-left font-medium px-4 py-3">Tier</th>
                <th className="text-left font-medium px-4 py-3">Avg rating</th>
                <th className="text-left font-medium px-4 py-3">Reviews</th>
                <th className="text-left font-medium px-4 py-3">Genres</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {reviewers.map((r) => (
                <tr key={r.id} className="text-neutral-700">
                  <td className="px-4 py-3">
                    <Link
                      href={`/artist/reviewers/${r.id}`}
                      className="inline-flex items-center gap-2 font-medium hover:text-black"
                    >
                      <span className="h-7 w-7 rounded-full bg-neutral-100 border border-black overflow-hidden flex items-center justify-center text-[11px] font-black text-black">
                        {getInitial(r.user.name ?? "Reviewer")}
                      </span>
                      <span>{getFirstName(r.user.name ?? "Reviewer")}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.tier}</td>
                  <td className="px-4 py-3">{r.averageRating.toFixed(2)}</td>
                  <td className="px-4 py-3">{r._count.reviews}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.genres.slice(0, 3).map((g) => (
                        <span
                          key={g.id}
                          className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-xs"
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}

              {reviewers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-neutral-500" colSpan={5}>
                    No reviewers found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
