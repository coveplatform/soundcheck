import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import { detectSource } from "@/lib/metadata";
import { ReviewExperience } from "./review-experience";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export const dynamic = "force-dynamic";

export default async function ReviewTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) redirect(`/login?callbackUrl=/score-review/${id}`);

  const review = await prisma.scoreReview.findUnique({
    where: { id },
    include: {
      TrackScoreReport: { select: { trackTitle: true, trackUrl: true, genre: true } },
    },
  });

  if (!review) notFound();
  if (review.reviewerId !== session.user.id) {
    return (
      <Shell>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">not your assignment</h1>
        <Link href="/score-review" className={`${mono.className} text-[13px]`} style={{ color: ACCENT }}>
          ← back to your queue
        </Link>
      </Shell>
    );
  }

  const done = review.status === "COMPLETED";
  const track = review.TrackScoreReport;
  const detected = detectSource(track.trackUrl);
  const source =
    detected === "SOUNDCLOUD" || detected === "YOUTUBE" || detected === "BANDCAMP"
      ? detected
      : "DIRECT";

  return (
    <Shell>
      <p className={`${mono.className} text-[13px] text-white/40 mb-2`}>[ react to this track ]</p>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] mb-1">
        {track.trackTitle || "untitled track"}
      </h1>
      <p className={`${mono.className} text-[13px] text-white/40 mb-8`}>{track.genre || "—"}</p>

      {done ? (
        <div className="border border-white/12 bg-[#101010] p-8 text-center">
          <p className={`${mono.className} text-[13px]`} style={{ color: ACCENT }}>✓ submitted</p>
          <p className="text-white/55 normal-case mt-2 mb-6">Thanks — your reaction is in.</p>
          <Link
            href="/score-review"
            className="inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-sm px-6 py-3"
          >
            back to your queue
          </Link>
        </div>
      ) : (
        <ReviewExperience reviewId={review.id} trackUrl={track.trackUrl} source={source} />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <Link href="/score-review" className={`${mono.className} text-[13px] text-white/55 hover:text-white transition-colors`}>
            ← queue
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-5 py-10">{children}</div>
    </div>
  );
}
