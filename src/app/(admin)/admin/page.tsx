import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

function StatCard({
  title,
  value,
  href,
  accent,
}: {
  title: string;
  value: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border bg-white p-5 hover:border-neutral-300 transition-colors ${
        accent ? "border-purple-200" : "border-neutral-200"
      }`}
    >
      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{title}</div>
      <div className={`mt-2 text-2xl font-black ${accent ? "text-purple-600" : "text-neutral-950"}`}>{value}</div>
    </Link>
  );
}

export default async function AdminPage() {
  const [
    totalUsers,
    proUsers,
    totalTracks,
    activeTracks,
    totalReviews,
    completedReviews,
    flaggedReviews,
    pendingQueue,
    revenueAgg,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.artistProfile.count({ where: { subscriptionStatus: "active" } }),
    prisma.track.count(),
    prisma.track.count({ where: { status: { in: ["QUEUED", "IN_PROGRESS"] } } }),
    prisma.review.count(),
    prisma.review.count({ where: { status: "COMPLETED" } }),
    prisma.review.count({ where: { wasFlagged: true } }),
    prisma.reviewQueue.count(),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      where: {
        AND: [
          { email: { not: { contains: "@seed.mixreflect.com" } } },
          { email: { not: { contains: "@mixreflect.com" } } },
          { email: { not: { contains: "@example.com" } } },
          { email: { not: { contains: "@soundcheck.com" } } },
          { email: { notIn: [
            "testlink@gmail.com", "testlink2@gmail.com", "testyjoe@gmail.com",
            "steveking1@gmail.com", "bobthewizard1@gmail.com", "bigdog1@bigdogco.com",
            "bigdogman2@gmail.com", "gogo45@gmail.com", "bogushogus@gmail.com",
            "hot23@gmail.com", "bigbadbozo@gmail.com",
            "daniel.basshead@gmail.com", "alexkimbeats@gmail.com",
            "poopdogwe@google.com", "poopdogger@poop.com",
            "soord@fksss.com", "soord@fk.com", "kris@kris.com", "poop@poop.com",
            "steve2@steve.com", "stevejob@job.com", "cove.platform@proton.me",
            "test@test.com", "tether.platform@proton.me", "jones@jones.com",
            "steveo23@gmail.com", "james.producer.uk@outlook.com", "sean@spdafy.com",
            "qairulothman@gmail.com", "imogengravina@gmail.com",
            "bjorn@bjornengelhardt.com", "a.engelhardt101@gmail.com",
            "simlimsd3@gmail.com", "kris.engelhardt4@gmail.com",
            "millersport98@gmail.com", "illy81095@gmail.com",
            "poop1@poop.com", "testthedog23@pooper.com", "testman1@testman1.com",
            "bigman1@poop.com", "bigdog1@gmail.com", "pash.tzaikos@gmail.com",
            "steve@steve.com",
          ] } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        ArtistProfile: {
          select: { subscriptionStatus: true },
        },
      },
    }),
  ]);

  const revenueCents = revenueAgg._sum.amount ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-neutral-950">Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">Platform health at a glance</p>
      </div>

      {/* Release Decision Demo Banner */}
      <Link
        href="/admin/release-decision-demo"
        className="block rounded-xl border-2 border-purple-600 bg-gradient-to-br from-purple-500 to-purple-600 p-6 hover:shadow-lg transition-all relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 bg-yellow-300 text-purple-900 text-[10px] font-black px-3 py-1.5 rounded-bl-xl tracking-wider">
          ✨ NEW FEATURE
        </div>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center flex-shrink-0">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-white mb-1">Release Decision Demo</h3>
            <p className="text-sm text-white/90 font-medium">Preview the complete artist & reviewer experience</p>
          </div>
          <div className="hidden sm:block text-white group-hover:translate-x-1 transition-transform">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </Link>

      {/* Quick Admin Tools */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/seed-report"
          className="block rounded-xl border border-neutral-200 bg-white p-5 hover:border-purple-300 transition-colors"
        >
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tool</div>
          <div className="mt-2 text-base font-bold text-neutral-950">Seed Release Decision Report</div>
          <div className="text-xs text-neutral-400 mt-1">Attach mock report to any user&apos;s track</div>
        </Link>
        <Link
          href="/admin/release-decision-report-demo"
          className="block rounded-xl border border-neutral-200 bg-white p-5 hover:border-purple-300 transition-colors"
        >
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Preview</div>
          <div className="mt-2 text-base font-bold text-neutral-950">Report Design Demo</div>
          <div className="text-xs text-neutral-400 mt-1">View the report layout with mock data</div>
        </Link>
        <Link
          href="/admin/emails"
          className="block rounded-xl border border-neutral-200 bg-white p-5 hover:border-purple-300 transition-colors"
        >
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tool</div>
          <div className="mt-2 text-base font-bold text-neutral-950">Email Templates</div>
          <div className="text-xs text-neutral-400 mt-1">Preview and test-send all email templates</div>
        </Link>
        <Link
          href="/admin/announcement"
          className="block rounded-xl border border-purple-200 bg-purple-50 p-5 hover:border-purple-400 transition-colors"
        >
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Blast</div>
          <div className="mt-2 text-base font-bold text-neutral-950">Send Announcement</div>
          <div className="text-xs text-neutral-400 mt-1">Preview &amp; send feature update to all users</div>
        </Link>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={String(totalUsers)} href="/admin/users" />
        <StatCard title="Pro Users" value={String(proUsers)} href="/admin/users" accent />
        <StatCard title="Total Tracks" value={String(totalTracks)} href="/admin/tracks" />
        <StatCard title="Revenue" value={`$${(revenueCents / 100).toFixed(2)}`} href="/admin/tracks" accent />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Tracks" value={String(activeTracks)} href="/admin/tracks" />
        <StatCard title="Completed Reviews" value={String(completedReviews)} href="/admin/reviews" />
        <StatCard title="Flagged Reviews" value={String(flaggedReviews)} href="/admin/reviews" accent={flaggedReviews > 0} />
        <StatCard title="Pending Queue" value={String(pendingQueue)} href="/admin/tracks" />
      </div>

      {/* Recent signups */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-950">Recent Signups</h2>
          <Link href="/admin/users" className="text-xs font-semibold text-purple-600 hover:text-purple-700">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-neutral-100">
          {recentUsers.map((user) => (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-neutral-950 truncate">{user.email}</div>
                <div className="text-xs text-neutral-500">{user.name || "No name"}</div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {user.ArtistProfile?.subscriptionStatus === "active" && (
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200 uppercase">Pro</span>
                )}
                <span className="text-xs text-neutral-400 font-mono">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
