import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScoreReviewQueue } from "@/lib/score-review";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, Headphones } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export const dynamic = "force-dynamic";

export default async function ScoreReviewQueuePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/score-review");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isScoreReviewer: true },
  });
  if (!me?.isScoreReviewer) {
    return (
      <Shell>
        <p className={`${mono.className} text-[13px] text-white/40 mb-3`}>[ reviewer access ]</p>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">not a reviewer (yet)</h1>
        <p className="text-white/55 normal-case max-w-md">
          This queue is for the internal listening panel. Ask an admin to add you.
        </p>
      </Shell>
    );
  }

  const queue = await getScoreReviewQueue(session.user.id);

  return (
    <Shell>
      <p className={`${mono.className} text-[13px] text-white/40 mb-2`}>[ the listening room ]</p>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] mb-2">your queue</h1>
      <p className="text-white/55 normal-case mb-10">
        {queue.length === 0
          ? "Nothing to review right now. Check back soon."
          : `${queue.length} track${queue.length === 1 ? "" : "s"} waiting for your honest reaction.`}
      </p>

      {queue.length > 0 && (
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
              <ArrowRight className="h-4 w-4 text-white/25 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/score">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <span className={`${mono.className} text-[13px] text-white/45`}>reviewer</span>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-5 py-12">{children}</div>
    </div>
  );
}
