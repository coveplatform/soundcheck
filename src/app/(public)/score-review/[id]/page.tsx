import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import { ReviewForm } from "./review-form";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export const dynamic = "force-dynamic";

/** Build an embeddable player URL for the common sources (else null → link only). */
function embedFor(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com") {
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (host === "youtu.be") {
      const v = u.pathname.slice(1);
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (host.endsWith("soundcloud.com")) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%236ee7ff&visual=true`;
    }
    return null;
  } catch {
    return null;
  }
}

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
  const embed = embedFor(track.trackUrl);

  return (
    <Shell>
      <p className={`${mono.className} text-[13px] text-white/40 mb-2`}>[ react to this track ]</p>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] mb-1">
        {track.trackTitle || "untitled track"}
      </h1>
      <p className={`${mono.className} text-[13px] text-white/40 mb-6`}>{track.genre || "—"}</p>

      {/* player */}
      <div className="mb-8">
        {embed ? (
          <iframe
            src={embed}
            className="w-full aspect-video border border-white/10"
            allow="autoplay; encrypted-media"
            title="track"
          />
        ) : (
          <a
            href={track.trackUrl}
            target="_blank"
            rel="noreferrer"
            className={`${mono.className} inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 text-sm transition-colors`}
          >
            open the track ↗
          </a>
        )}
      </div>

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
        <ReviewForm reviewId={review.id} />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/score">
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
