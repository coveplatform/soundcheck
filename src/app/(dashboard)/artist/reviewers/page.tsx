import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
              { User: { name: { contains: q, mode: "insensitive" } } },
              {
                Genre: {
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
      User: { select: { name: true } },
      Genre: { select: { id: true, name: true } },
      _count: { select: { Review: true } },
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
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Reviewers</h1>
        <p className="mt-2 text-sm text-black/40">Browse reviewers (top 50). This is informational only.</p>
      </div>

      <Card variant="soft" className="mb-6">
        <CardContent className="pt-6">
          <form className="flex flex-col md:flex-row gap-3" method="get">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search by name or genre"
              className="h-10 text-sm rounded-xl border-black/10 bg-white/60 focus:bg-white"
            />
            <label className="flex items-center gap-2 text-sm text-black/50">
              <input
                type="checkbox"
                name="active"
                value="1"
                defaultChecked={active === "1"}
                className="rounded"
              />
              Active in last 30 days
            </label>
            <Button type="submit" variant="airyOutline" className="w-full md:w-auto h-10">
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card variant="soft" elevated>
        <CardContent className="pt-6">
          <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">reviewers</p>
          
          {reviewers.length === 0 ? (
            <p className="text-sm text-black/40 py-8 text-center">No reviewers found.</p>
          ) : (
            <div className="space-y-2">
              {reviewers.map((r) => (
                <Link
                  key={r.id}
                  href={`/artist/reviewers/${r.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 border border-black/10 px-4 py-3 hover:bg-white transition-colors duration-150 ease-out"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700 flex-shrink-0">
                      {getInitial(r.User.name ?? "Reviewer")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black truncate">
                        {getFirstName(r.User.name ?? "Reviewer")}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-black/40">
                        <span>{r.tier}</span>
                        <span>·</span>
                        <span>{r.averageRating.toFixed(1)} avg</span>
                        <span>·</span>
                        <span>{r._count.Review} reviews</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 flex-shrink-0 max-w-[200px] justify-end">
                    {r.Genre.slice(0, 2).map((g) => (
                      <span
                        key={g.id}
                        className="px-2 py-0.5 rounded-full bg-black/5 text-black/50 text-xs"
                      >
                        {g.name}
                      </span>
                    ))}
                    {r.Genre.length > 2 && (
                      <span className="text-xs text-black/30">+{r.Genre.length - 2}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
