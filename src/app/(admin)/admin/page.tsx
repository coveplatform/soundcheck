import Link from "next/link";

import { prisma } from "@/lib/prisma";

function StatCard({
  title,
  value,
  href,
}: {
  title: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-neutral-300"
    >
      <div className="text-sm text-neutral-500">{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </Link>
  );
}

export default async function AdminPage() {
  const [users, tracks, reviews, revenueAgg] = await Promise.all([
    prisma.user.count(),
    prisma.track.count(),
    prisma.review.count(),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  const revenueCents = revenueAgg._sum.amount ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-neutral-500">Operational overview</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Users" value={String(users)} href="/admin/users" />
        <StatCard title="Tracks" value={String(tracks)} href="/admin/tracks" />
        <StatCard title="Reviews" value={String(reviews)} href="/admin/reviews" />
        <StatCard
          title="Revenue (gross)"
          value={`$${(revenueCents / 100).toFixed(2)}`}
          href="/admin/tracks"
        />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Quick links</h2>
        <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
          <Link className="text-neutral-600 hover:text-neutral-900" href="/admin/reviews">
            Flagged reviews
          </Link>
          <Link className="text-neutral-600 hover:text-neutral-900" href="/admin/reviewers">
            Reviewer restrictions
          </Link>
        </div>
      </div>
    </div>
  );
}
