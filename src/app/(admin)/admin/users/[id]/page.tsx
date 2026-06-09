import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { ReviewerRestrictionToggle } from "@/components/admin/reviewer-restriction-toggle";
import { EnableReviewerButton } from "@/components/admin/enable-reviewer-button";
import { CompUnlimitedButton } from "@/components/admin/comp-unlimited-button";
import { getScoreStatsForEmails } from "@/lib/admin-score-stats";
import { getScoreRoomQuota } from "@/lib/score-review";
import { TierBadge, mono } from "../../../admin-ui";

export const dynamic = 'force-dynamic';

const VERDICT_LABEL: Record<string, string> = {
  RELEASE_READY: "release ready",
  ALMOST_THERE: "almost there",
  NEEDS_WORK: "needs work",
  NOT_READY: "not ready",
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/10 bg-[#0e0e0e] p-4 ${className}`}>{children}</div>;
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      ArtistProfile: { select: { id: true, artistName: true } },
      ReviewerProfile: {
        select: {
          id: true,
          tier: true,
          isRestricted: true,
          completedOnboarding: true,
          onboardingQuizPassed: true,
          stripeAccountId: true,
          totalReviews: true,
          averageRating: true,
          flagCount: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const email = user.email ?? "";
  const emailLower = email.trim().toLowerCase();

  const [statsMap, quota, reports] = await Promise.all([
    getScoreStatsForEmails([email]),
    email ? getScoreRoomQuota(email) : Promise.resolve(null),
    prisma.trackScoreReport.findMany({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          ...(user.ArtistProfile ? [{ artistId: user.ArtistProfile.id }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        slug: true,
        trackTitle: true,
        trackUrl: true,
        genre: true,
        score: true,
        verdict: true,
        status: true,
        paidAt: true,
        humanRoomSkipped: true,
        humanReviewsRequested: true,
        createdAt: true,
        ScoreReview: { select: { status: true } },
      },
    }),
  ]);

  const stats = statsMap.get(emailLower) ?? {
    tier: "Free" as const, subStatus: null, subActive: false, renewsAt: null,
    reports: 0, paidReports: 0, lastReportAt: null, spendCents: 0,
  };

  return (
    <div className="space-y-6 text-[#f4f4ef]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold lowercase">user</h1>
          <p className={`text-white/50 ${mono.className} text-sm`}>{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {!user.ReviewerProfile ? <EnableReviewerButton userId={user.id} /> : null}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-white/40 uppercase tracking-wider">Tier</div>
          <div className="mt-2 flex items-center gap-2">
            <TierBadge tier={stats.tier} subStatus={stats.subStatus} />
            {user.isScoreReviewer && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#7cffc4] bg-[#7cffc4]/10 px-1.5 py-0.5 rounded">Score reviewer</span>
            )}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-white/40 uppercase tracking-wider">Est. spend</div>
          <div className={`mt-1 text-xl font-extrabold ${mono.className} text-[#7cffc4]`}>${(stats.spendCents / 100).toFixed(2)}</div>
          <div className="text-[10px] text-white/30 mt-0.5">{stats.paidReports} paid report{stats.paidReports === 1 ? "" : "s"} · approx</div>
        </Card>
        <Card>
          <div className="text-xs text-white/40 uppercase tracking-wider">Joined</div>
          <div className={`mt-1 font-medium ${mono.className} text-sm`}>{new Date(user.createdAt).toLocaleString()}</div>
          {user.lastActiveAt && (
            <div className="text-[10px] text-white/30 mt-0.5">last active {new Date(user.lastActiveAt).toLocaleDateString()}</div>
          )}
        </Card>
      </div>

      {/* Plan / subscription */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="font-bold lowercase">plan</div>
          <CompUnlimitedButton userId={user.id} isActive={stats.subActive} />
        </div>
        <div className="mt-3 grid md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-white/40">Status</div>
            <div className="font-medium">
              {stats.subStatus ? (
                <span className={stats.subActive ? "text-[#6ee7ff]" : stats.subStatus === "past_due" ? "text-[#ff6b6b]" : "text-[#fbbf24]"}>
                  {stats.subStatus}
                </span>
              ) : (
                <span className="text-white/40">no subscription</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-white/40">Renews</div>
            <div className={`font-medium ${mono.className}`}>{stats.renewsAt ? new Date(stats.renewsAt).toLocaleDateString() : "—"}</div>
          </div>
          {stats.subActive && quota && (
            <>
              <div>
                <div className="text-white/40">Room rounds used</div>
                <div className={`font-medium ${mono.className}`}>
                  <span className={quota.remaining === 0 ? "text-[#ff6b6b]" : "text-[#f4f4ef]"}>{quota.used}</span>
                  <span className="text-white/30">/{quota.cap}</span>
                </div>
              </div>
              <div>
                <div className="text-white/40">Rounds reset</div>
                <div className={`font-medium ${mono.className}`}>{new Date(quota.resetsAt).toLocaleDateString()}</div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Score reports */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="font-bold lowercase">score reports</div>
          <div className={`text-xs text-white/40 ${mono.className}`}>{reports.length}</div>
        </div>
        {reports.length === 0 ? (
          <div className="px-4 py-6 text-sm text-white/40">No reports submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-white/[0.03] text-white/40">
                <tr>
                  <th className="text-left font-medium px-4 py-2">Track</th>
                  <th className="text-left font-medium px-3 py-2">Genre</th>
                  <th className="text-right font-medium px-3 py-2">Score</th>
                  <th className="text-left font-medium px-3 py-2">Verdict</th>
                  <th className="text-left font-medium px-3 py-2">Room</th>
                  <th className="text-left font-medium px-3 py-2">Status</th>
                  <th className="text-left font-medium px-3 py-2">Paid</th>
                  <th className="text-left font-medium px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {reports.map((r) => {
                  const done = r.ScoreReview.filter((sr) => sr.status === "COMPLETED").length;
                  return (
                    <tr key={r.slug} className="text-white/75 hover:bg-white/[0.03]">
                      <td className="px-4 py-2">
                        <Link href={`/report/${r.slug}`} className="underline decoration-white/20 hover:text-[#6ee7ff]">
                          {r.trackTitle || "Untitled"}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-white/45">{r.genre || "—"}</td>
                      <td className={`px-3 py-2 text-right ${mono.className} ${r.score != null ? "text-[#6ee7ff] font-medium" : "text-white/20"}`}>
                        {r.score ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-white/55 lowercase">{r.verdict ? VERDICT_LABEL[r.verdict] ?? r.verdict : "—"}</td>
                      <td className={`px-3 py-2 ${mono.className} text-white/55`}>
                        {r.humanRoomSkipped ? (
                          <span className="text-[#fbbf24]" title="Over monthly room cap — AI read only">skipped</span>
                        ) : r.ScoreReview.length > 0 ? (
                          `${done}/${r.humanReviewsRequested}`
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-white/55 lowercase">{r.status.toLowerCase().replace(/_/g, " ")}</td>
                      <td className="px-3 py-2">
                        {r.paidAt ? (
                          <span className="text-[#7cffc4]">✓</span>
                        ) : (
                          <span className="text-white/25">locked</span>
                        )}
                      </td>
                      <td className={`px-3 py-2 text-white/45 ${mono.className}`}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Peer reviewer (legacy marketplace) — kept for moderation */}
      {user.ReviewerProfile ? (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div className="font-bold lowercase">peer review activity</div>
            <ReviewerRestrictionToggle
              reviewerId={user.ReviewerProfile.id}
              isRestricted={user.ReviewerProfile.isRestricted}
            />
          </div>
          <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-white/40">Tier</div>
              <div className="font-medium">{user.ReviewerProfile.tier}</div>
            </div>
            <div>
              <div className="text-white/40">Onboarding</div>
              <div className="font-medium">
                {user.ReviewerProfile.completedOnboarding && user.ReviewerProfile.onboardingQuizPassed
                  ? "Complete"
                  : "Incomplete"}
              </div>
            </div>
            <div>
              <div className="text-white/40">Stripe</div>
              <div className="font-medium">{user.ReviewerProfile.stripeAccountId ? "Connected" : "Not connected"}</div>
            </div>
            <div>
              <div className="text-white/40">Total reviews</div>
              <div className={`font-medium ${mono.className}`}>{user.ReviewerProfile.totalReviews}</div>
            </div>
            <div>
              <div className="text-white/40">Avg rating</div>
              <div className={`font-medium ${mono.className}`}>{user.ReviewerProfile.averageRating.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-white/40">Flags</div>
              <div className={`font-medium ${mono.className}`}>{user.ReviewerProfile.flagCount}</div>
            </div>
          </div>
        </Card>
      ) : null}

      <div>
        <Link className="text-sm text-white/50 hover:text-[#6ee7ff] underline decoration-white/20" href="/admin/users">
          Back to users
        </Link>
      </div>
    </div>
  );
}
