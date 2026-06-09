import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { WelcomeEmailTestCard } from "./welcome-email-test";
import { UserGrowthChart, type GrowthPoint } from "@/components/admin/user-growth-chart";
import { StatCard, TierBadge, mono } from "../admin-ui";
import { getScoreStatsForEmails } from "@/lib/admin-score-stats";
import { scoreSubPrice, UNLOCK_PRICE_CENTS } from "@/lib/score-subscription";

export const dynamic = 'force-dynamic';

// Seed / test / internal accounts to exclude from "real user" views.
const DEMO_EXACT = [
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
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const realUserWhere: any = {
  AND: [
    { email: { not: { contains: "@seed.mixreflect.com" } } },
    { email: { not: { contains: "@mixreflect.com" } } },
    { email: { not: { contains: "@example.com" } } },
    { email: { not: { contains: "@soundcheck.com" } } },
    { email: { notIn: DEMO_EXACT } },
  ],
};

function ToolCard({ href, tag, title, subtitle, accent }: { href: string; tag: string; title: string; subtitle: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border p-5 transition-colors ${
        accent ? "border-[#6ee7ff]/30 bg-[#6ee7ff]/[0.06] hover:border-[#6ee7ff]/60" : "border-white/10 bg-[#0e0e0e] hover:border-white/25"
      }`}
    >
      <div className={`text-[10px] font-semibold uppercase tracking-wider ${accent ? "text-[#6ee7ff]" : "text-white/40"}`}>{tag}</div>
      <div className="mt-2 text-base font-bold text-[#f4f4ef]">{title}</div>
      <div className="text-xs text-white/40 mt-1">{subtitle}</div>
    </Link>
  );
}

export default async function AdminPage() {
  const [
    totalUsers,
    activeSubs,
    totalReports,
    paidReports,
    pendingReports,
    roomRoundsPending,
    completedReviews,
    flaggedReviews,
    recentUsers,
    signupDates,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.scoreSubscriber.count({ where: { status: "active" } }),
    prisma.trackScoreReport.count(),
    prisma.trackScoreReport.count({ where: { paidAt: { not: null } } }),
    prisma.trackScoreReport.count({ where: { status: { in: ["PENDING", "PAID", "IN_REVIEW"] } } }),
    prisma.scoreReview.count({ where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } } }),
    prisma.review.count({ where: { status: "COMPLETED" } }),
    prisma.review.count({ where: { wasFlagged: true } }),
    prisma.user.findMany({
      where: realUserWhere,
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: realUserWhere,
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  const reportRevenueCents = paidReports * UNLOCK_PRICE_CENTS;
  const mrrCents = activeSubs * scoreSubPrice("monthly").amount;

  // Tier badges for recent signups.
  const recentStats = await getScoreStatsForEmails(recentUsers.map((u) => u.email));

  // Build weekly growth data
  const weeklyMap = new Map<string, number>();
  for (const { createdAt } of signupDates) {
    const d = new Date(createdAt);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    const key = monday.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
    weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + 1);
  }
  let runningWeekly = 0;
  const weeklyGrowth: GrowthPoint[] = Array.from(weeklyMap.entries()).map(([period, newUsers]) => {
    runningWeekly += newUsers;
    return { period, newUsers, total: runningWeekly };
  });

  // Build monthly growth data
  const monthlyMap = new Map<string, number>();
  for (const { createdAt } of signupDates) {
    const d = new Date(createdAt);
    const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
  }
  let runningMonthly = 0;
  const monthlyGrowth: GrowthPoint[] = Array.from(monthlyMap.entries()).map(([period, newUsers]) => {
    runningMonthly += newUsers;
    return { period, newUsers, total: runningMonthly };
  });

  return (
    <div className="space-y-8 text-[#f4f4ef]">
      <div>
        <h1 className="text-2xl font-extrabold lowercase">overview</h1>
        <p className="text-sm text-white/45 mt-1">Score-product health at a glance</p>
      </div>

      {/* Track Score demo banner */}
      <Link
        href="/report/demo"
        className="block rounded-xl border border-[#6ee7ff]/40 bg-gradient-to-br from-[#6ee7ff]/[0.08] to-transparent p-6 hover:border-[#6ee7ff] transition-all relative overflow-hidden group"
      >
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-[#6ee7ff]/10 border border-[#6ee7ff]/30 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 44 44" className="h-8 w-8">
              <circle cx="22" cy="22" r="16" fill="none" stroke="rgba(110,231,255,0.25)" strokeWidth="4" />
              <circle cx="22" cy="22" r="16" fill="none" stroke="#6ee7ff" strokeWidth="4" strokeLinecap="round" strokeDasharray="100.5" strokeDashoffset="18" transform="rotate(-90 22 22)" />
              <text x="22" y="27" textAnchor="middle" fill="#6ee7ff" fontSize="13" fontWeight="900">82</text>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-extrabold text-[#f4f4ef] mb-1 lowercase">track score report — demo</h3>
            <p className="text-sm text-white/50 font-medium">Preview the full $6.95 report product with dummy data</p>
          </div>
          <div className="hidden sm:block text-[#6ee7ff]/50 group-hover:translate-x-1 transition-transform">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </Link>

      {/* Primary stats — score product */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={String(totalUsers)} href="/admin/users" />
        <StatCard title="Unlimited Subs" value={String(activeSubs)} href="/admin/users?filter=unlimited" accent />
        <StatCard title="Paid Reports" value={String(paidReports)} href="/admin/reports?filter=paid" />
        <StatCard title="Report Revenue" value={`$${(reportRevenueCents / 100).toFixed(2)}`} href="/admin/reports?filter=paid" accent hint="paid reports × $6.95" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reports" value={String(totalReports)} href="/admin/reports" />
        <StatCard title="Reports Pending" value={String(pendingReports)} href="/admin/reports?filter=pending" />
        <StatCard title="Rounds Pending" value={String(roomRoundsPending)} href="/admin/reviews" hint="human room assignments open" />
        <StatCard title="MRR (approx)" value={`$${(mrrCents / 100).toFixed(2)}`} href="/admin/users?filter=unlimited" accent hint={`${activeSubs} subs × $${(scoreSubPrice("monthly").amount / 100).toFixed(2)}`} />
      </div>

      {/* Legacy peer-review health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Peer Reviews Done" value={String(completedReviews)} href="/admin/reviews" />
        <StatCard title="Flagged Reviews" value={String(flaggedReviews)} href="/admin/reviews" accent={flaggedReviews > 0} />
      </div>

      {/* Quick tools */}
      <div className="grid grid-cols-2 gap-4">
        <ToolCard href="/admin/reports" tag="Product" title="Score Reports" subtitle="Every report + which track & artist generated it" accent />
        <ToolCard href="/submit-score" tag="Product" title="Submit Score Form" subtitle="View the track submission + checkout page" />
        <ToolCard href="/admin/emails" tag="Tool" title="Email Templates" subtitle="Preview and test-send all email templates" />
        <ToolCard href="/admin/announcement" tag="📣 Email Blast" title="MixReflect Announcement" subtitle="Preview, test-send, then blast the what's-new email" accent />
        <ToolCard href="/admin/recapture" tag="Win-back" title="Recapture Campaign" subtitle="Email lapsed users + add free credits" />
        <WelcomeEmailTestCard />
        <ToolCard href="/admin/track-of-the-day" tag="Editorial" title="Track of the Day" subtitle="Edit the daily editor's note & pick winner" />
        <ToolCard href="/admin/reviewer-profile-demo" tag="Preview" title="Reviewer Profile" subtitle="What artists see when they view a reviewer" />
      </div>

      {/* User growth chart */}
      <UserGrowthChart weekly={weeklyGrowth} monthly={monthlyGrowth} />

      {/* Recent signups */}
      <div className="rounded-xl border border-white/10 bg-[#0e0e0e] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#f4f4ef] lowercase">recent signups</h2>
          <Link href="/admin/users" className="text-xs font-semibold text-[#6ee7ff] hover:text-white">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {recentUsers.map((user) => {
            const s = recentStats.get(user.email.trim().toLowerCase());
            return (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#f4f4ef] truncate">{user.email}</div>
                  <div className="text-xs text-white/40">{user.name || "No name"}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {s && s.tier !== "Free" && <TierBadge tier={s.tier} subStatus={s.subStatus} />}
                  <span className={`text-xs text-white/35 ${mono.className}`}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
