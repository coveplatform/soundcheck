import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getScoreReviewQueue,
  getScoreReviewerEarnings,
  SCORE_REVIEW_RATE_CENTS,
  SCORE_PAYOUT_THRESHOLD_CENTS,
} from "@/lib/score-review";
import { Logo } from "@/components/ui/logo";
import { OptInButton } from "./opt-in-button";
import { PayoutButton } from "./payout-button";
import { AccountMenu } from "../dashboard/account-menu";
import { ArrowRight, Headphones, Plus, Zap, Wallet, Clock } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export const dynamic = "force-dynamic";

const RATE = (SCORE_REVIEW_RATE_CENTS / 100).toFixed(2);
const THRESHOLD = (SCORE_PAYOUT_THRESHOLD_CENTS / 100).toFixed(0);

export default async function ScoreReviewQueuePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/score-review");

  const email = session.user.email ?? "";
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isScoreReviewer: true },
  });

  // ── not a reviewer yet — sell it: how it works + the pay ──
  if (!me?.isScoreReviewer) {
    return (
      <Shell email={email}>
        <p className={`${mono.className} text-[13px] text-white/55 mb-3`}>[ join the room ]</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] mb-3">
          get paid to <span style={{ color: ACCENT }}>listen</span>
        </h1>
        <p className="text-white/70 normal-case max-w-lg mb-9 leading-relaxed">
          Be one of the real listeners artists get played for. Hear unreleased
          tracks first, leave an honest two-minute reaction, and earn for every one.
        </p>

        {/* the pay, up front */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 border border-white/10 mb-8">
          {[
            { icon: Wallet, t: `$${RATE}`, d: "per review" },
            { icon: Clock, t: "~2 min", d: "each, on your time" },
            { icon: Headphones, t: "first ears", d: "on unreleased tracks" },
            { icon: ArrowRight, t: `$${THRESHOLD}`, d: "cash out minimum" },
          ].map((p) => (
            <div key={p.d} className="bg-[#0a0a0a] p-5">
              <p.icon className="h-4 w-4 mb-3" style={{ color: ACCENT }} />
              <p className="text-2xl font-extrabold">{p.t}</p>
              <p className={`${mono.className} text-[11px] text-white/45 mt-1 normal-case`}>{p.d}</p>
            </div>
          ))}
        </div>

        {/* how it works */}
        <div className="space-y-px bg-white/10 border border-white/10 mb-9">
          {[
            ["01", "a track lands in your queue", "we match you to fresh submissions."],
            ["02", "listen + react", `give it a real listen, then leave a rating and an honest reaction.`],
            ["03", `earn $${RATE}`, "added to your balance the moment you submit."],
            ["04", `cash out at $${THRESHOLD}`, "request a payout once you clear the threshold."],
          ].map(([n, t, d]) => (
            <div key={n} className="bg-[#0a0a0a] p-5 flex gap-4">
              <span className={`${mono.className} text-[13px] shrink-0`} style={{ color: ACCENT }}>{n}</span>
              <div>
                <p className="font-bold text-[15px]">{t}</p>
                <p className="text-white/55 text-[13px] normal-case mt-0.5 leading-relaxed">{d}</p>
              </div>
            </div>
          ))}
        </div>

        <OptInButton label="become a reviewer" />
        <p className={`${mono.className} text-[12px] text-white/45 mt-4 normal-case`}>
          <Link href="/reviewer" className="hover:text-white transition-colors">
            learn more about reviewing →
          </Link>
        </p>
      </Shell>
    );
  }

  const [queue, earnings] = await Promise.all([
    getScoreReviewQueue(session.user.id),
    getScoreReviewerEarnings(session.user.id),
  ]);
  const dollars = (earnings.cents / 100).toFixed(2);
  const pct = Math.min(100, Math.round((earnings.cents / SCORE_PAYOUT_THRESHOLD_CENTS) * 100));

  return (
    <Shell email={email}>
      <p className={`${mono.className} text-[13px] text-white/40 mb-2`}>[ the listening room ]</p>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] mb-2">your queue</h1>
      <p className="text-white/55 normal-case mb-8">
        {queue.length === 0
          ? "Nothing to review right now — check back soon."
          : `${queue.length} track${queue.length === 1 ? "" : "s"} waiting for your honest reaction.`}
      </p>

      {/* ── earnings ── */}
      <div className="border border-white/12 bg-[#101010] p-5 sm:p-6 mb-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={`${mono.className} text-[12px] text-white/45 mb-1`}>you&apos;ve earned</p>
            <p className="text-4xl font-extrabold tracking-tight">
              ${dollars}
            </p>
            <p className={`${mono.className} text-[12px] text-white/45 mt-1 normal-case`}>
              ${RATE} per review · {earnings.completed} completed
            </p>
          </div>
          <div className="text-right">
            <PayoutButton canPayout={earnings.canPayout} />
            {!earnings.canPayout && (
              <p className={`${mono.className} text-[11px] text-white/35 mt-2 normal-case`}>
                cash out at ${THRESHOLD}
              </p>
            )}
          </div>
        </div>
        {!earnings.canPayout && (
          <div className="mt-5">
            <div className="h-1.5 bg-white/[0.08] overflow-hidden">
              <div className="h-full transition-all" style={{ width: `${pct}%`, background: ACCENT }} />
            </div>
            <p className={`${mono.className} text-[11px] text-white/35 mt-1.5 normal-case`}>
              ${dollars} of ${THRESHOLD} — {Math.max(0, Math.ceil((SCORE_PAYOUT_THRESHOLD_CENTS - earnings.cents) / SCORE_REVIEW_RATE_CENTS))} more reviews to cash out
            </p>
          </div>
        )}
      </div>

      {queue.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
          {queue.map((q) => (
            <Link
              key={q.id}
              href={`/score-review/${q.id}`}
              className="group bg-[#0a0a0a] p-6 hover:bg-[#0e0e0e] transition-colors flex items-center gap-4"
            >
              <div
                className="w-12 h-12 shrink-0 flex items-center justify-center border"
                style={{ borderColor: ACCENT }}
              >
                <Headphones className="h-5 w-5" style={{ color: ACCENT }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-extrabold truncate normal-case">
                  {q.TrackScoreReport.trackTitle || "untitled track"}
                </p>
                <p className={`${mono.className} text-[12px] text-white/40 mt-1`}>
                  {q.TrackScoreReport.genre || "—"}
                  {q.status === "IN_PROGRESS" ? " · in progress" : ""}
                </p>
              </div>
              <span className={`${mono.className} text-[11px] font-bold text-black px-2 py-1 shrink-0`} style={{ background: ACCENT }}>
                +${RATE}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-white/12 bg-[#0a0a0a] p-8 sm:p-10 text-center">
          <Zap className="h-6 w-6 mx-auto mb-4" style={{ color: ACCENT }} />
          <h2 className="text-xl font-extrabold tracking-tight mb-2">your queue is empty</h2>
          <p className="text-white/55 normal-case max-w-sm mx-auto leading-relaxed">
            When a track lands here you earn <span className="text-white font-bold">${RATE}</span> for
            a ~2-minute honest reaction. Reviews stack up — cash out once you hit ${THRESHOLD}.
          </p>
        </div>
      )}
    </Shell>
  );
}

function Shell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <nav className={`${mono.className} hidden sm:flex items-center gap-5 text-[13px]`}>
              <Link href="/dashboard" className="text-white/55 hover:text-white transition-colors">
                my reports
              </Link>
              <Link href="/score-review" className="text-white hover:text-white transition-colors">
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
      <div className="max-w-4xl mx-auto px-5 py-12">{children}</div>
    </div>
  );
}
