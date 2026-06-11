import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isScoreSubscribed } from "@/lib/score-subscription";
import { getScoreRoomQuota } from "@/lib/score-review";
import { ManageSubButton } from "./manage-sub-button";
import { AccountMenu } from "./account-menu";
import { DeleteReportButton } from "./delete-report-button";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import { SubscribeConversionPing } from "@/components/score/subscribe-conversion-ping";
import { ArrowRight, Lock, Plus } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

const ACCENT = "#6ee7ff";

export const dynamic = "force-dynamic";

const VERDICT_LABEL: Record<string, string> = {
  RELEASE_READY: "release ready",
  ALMOST_THERE: "almost there",
  NEEDS_WORK: "needs work",
  NOT_READY: "not ready",
};

function fmt(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const [profile, me] = await Promise.all([
    prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isScoreReviewer: true },
    }),
  ]);

  const email = session.user.email ?? "";
  const reports = await prisma.trackScoreReport.findMany({
    where: {
      OR: [...(profile ? [{ artistId: profile.id }] : []), { email }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      trackTitle: true,
      artworkUrl: true,
      genre: true,
      status: true,
      score: true,
      percentile: true,
      verdict: true,
      paidAt: true,
      humanRoomSkipped: true,
      createdAt: true,
    },
  });

  const unlockedCount = reports.filter((r) => r.paidAt != null).length;
  const subscribed = await isScoreSubscribed(email);
  const roomQuota = subscribed ? await getScoreRoomQuota(email) : null;

  // Human "room" progress per report: completed vs assigned.
  const reportIds = reports.map((r) => r.id);
  const [assignedGroups, completedGroups] = reportIds.length
    ? await Promise.all([
        prisma.scoreReview.groupBy({ by: ["reportId"], where: { reportId: { in: reportIds } }, _count: { _all: true } }),
        prisma.scoreReview.groupBy({ by: ["reportId"], where: { reportId: { in: reportIds }, status: "COMPLETED" }, _count: { _all: true } }),
      ])
    : [[], []];
  const assignedBy = new Map(assignedGroups.map((g) => [g.reportId, g._count._all]));
  const completedBy = new Map(completedGroups.map((g) => [g.reportId, g._count._all]));

  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}
    >
      <SubscribeConversionPing />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <nav className={`${mono.className} hidden sm:flex items-center gap-5 text-[13px]`}>
              <Link href="/dashboard" className="text-white hover:text-white transition-colors">
                dashboard
              </Link>
              <Link
                href={me?.isScoreReviewer ? "/score-review" : "/reviewer"}
                className="text-white/55 hover:text-white transition-colors"
              >
                review queue
              </Link>
            </nav>
            <Link
              href="/submit-score"
              className="group inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[13px] px-4 py-2 hover:bg-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              new track
            </Link>
            <AccountMenu email={email} />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-12">
        {/* status bar */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">
          <div>
            <p className={`${mono.className} text-[13px] text-white/40 mb-2`}>
              [ your reports ]
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.03em]">
              my reports
            </h1>
          </div>
          <div className={`${mono.className} text-[13px] flex items-center flex-wrap gap-3 sm:justify-end`}>
            <div className="border border-white/12 bg-[#101010] px-4 py-3">
              <span style={{ color: ACCENT }}>{reports.length}</span>
              <span className="text-white/45"> track{reports.length === 1 ? "" : "s"}</span>
              {unlockedCount > 0 && (
                <span className="text-white/45"> · {unlockedCount} unlocked</span>
              )}
            </div>
            {roomQuota && (
              <div className="border border-white/12 bg-[#101010] px-4 py-3" title="Each round is a full room of 5 real listeners on one track. Unlimited AI reads always.">
                <span className="text-white/45">real-reviewer rounds </span>
                <span style={{ color: ACCENT }}>{roomQuota.used}/{roomQuota.cap}</span>
                <span className="text-white/45"> · resets {fmt(roomQuota.resetsAt)}</span>
              </div>
            )}
            {subscribed ? (
              <ManageSubButton />
            ) : (
              <Link
                href="/#pricing"
                className="border border-white/12 bg-[#101010] px-4 py-3 hover:border-white/30 transition-colors"
              >
                <span style={{ color: ACCENT }}>go unlimited →</span>
              </Link>
            )}
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="border border-white/12 bg-[#101010] p-12 text-center">
            <p className="text-white/55 text-lg mb-6 normal-case">
              No tracks yet. Drop your first link and get an honest read.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-base px-7 py-4 hover:bg-white transition-colors"
            >
              get feedback
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
            {reports.map((r) => {
              const pending = r.status === "PENDING" || r.score == null;
              const unlocked = r.paidAt != null;
              return (
                <div key={r.slug} className="relative bg-[#0a0a0a]">
                  <DeleteReportButton reportId={r.id} />
                  <Link
                    href={`/report/${r.slug}`}
                    className="group bg-[#0a0a0a] p-6 hover:bg-[#0e0e0e] transition-colors flex items-center gap-5"
                  >
                  {/* artwork + score */}
                  <div
                    className="relative w-16 h-16 shrink-0 border overflow-hidden bg-white/5"
                    style={{
                      borderColor: pending ? "rgba(255,255,255,0.12)" : ACCENT,
                    }}
                  >
                    {r.artworkUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.artworkUrl} alt="" className="w-full h-full object-cover" />
                        {!pending && (
                          <span
                            className={`${mono.className} absolute bottom-0 right-0 text-[11px] font-bold text-black px-1 leading-tight`}
                            style={{ background: ACCENT }}
                          >
                            {r.score}
                          </span>
                        )}
                      </>
                    ) : pending ? (
                      <span className={`${mono.className} absolute inset-0 flex items-center justify-center text-[11px] text-white/40`}>
                        …
                      </span>
                    ) : (
                      <span className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold leading-none" style={{ color: ACCENT }}>
                          {r.score}
                        </span>
                        <span className={`${mono.className} text-[9px] text-white/35`}>/ 100</span>
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-extrabold truncate normal-case">
                      {r.trackTitle || "untitled track"}
                    </p>
                    <p className={`${mono.className} text-[12px] text-white/40 mt-1`}>
                      {pending
                        ? "analyzing…"
                        : `${VERDICT_LABEL[r.verdict ?? ""] ?? ""}${
                            r.score != null ? ` · ${r.score} / 100` : ""
                          }`}
                    </p>
                    {(assignedBy.get(r.id) ?? 0) > 0 ? (
                      <p className={`${mono.className} text-[11px] mt-1`} style={{ color: ACCENT }}>
                        ♫ {completedBy.get(r.id) ?? 0}/{assignedBy.get(r.id)} listeners in
                      </p>
                    ) : r.humanRoomSkipped ? (
                      <p className={`${mono.className} text-[11px] mt-1 text-white/35`}>
                        ai read only · used your monthly rounds
                      </p>
                    ) : null}
                    <p className={`${mono.className} text-[11px] text-white/30 mt-1.5`}>
                      {fmt(r.createdAt)}
                      {!unlocked && !pending && (
                        <span className="inline-flex items-center gap-1 ml-2 text-white/40">
                          <Lock className="h-3 w-3" /> locked
                        </span>
                      )}
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 text-white/25 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
