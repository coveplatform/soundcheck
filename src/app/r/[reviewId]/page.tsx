import { notFound } from "next/navigation";
import Link from "next/link";
import { Music, ArrowRight, Repeat2, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import { AudioPlayer } from "@/components/audio/audio-player";
import { AnimatedSection } from "@/components/landing/animated-section";
import { ShareReviewButton } from "@/components/reviews/share-review-button";

export const revalidate = 3600; // Cache for 1 hour

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mixreflect.com";

const qualityLabels: Record<string, string> = {
  PROFESSIONAL: "Professional",
  RELEASE_READY: "Release Ready",
  ALMOST_THERE: "Almost There",
  DEMO_STAGE: "Demo Stage",
  NOT_READY: "Not Ready Yet",
};

// Mirrors the qualitative labels used on the insights / aggregate-analytics view
function scoreLabel(score: number): { label: string; tone: "high" | "mid" | "low" } {
  if (score >= 4.5) return { label: "Exceptional", tone: "high" };
  if (score >= 4.0) return { label: "Strong", tone: "high" };
  if (score >= 3.5) return { label: "Solid", tone: "mid" };
  if (score >= 3.0) return { label: "Average", tone: "mid" };
  if (score >= 2.5) return { label: "Developing", tone: "low" };
  return { label: "Needs work", tone: "low" };
}

function getReview(reviewId: string) {
  return prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      bestPart: true,
      biggestWeaknessSpecific: true,
      productionScore: true,
      originalityScore: true,
      vocalScore: true,
      qualityLevel: true,
      firstImpression: true,
      wouldListenAgain: true,
      Track: {
        select: {
          title: true,
          artworkUrl: true,
          sourceUrl: true,
          sourceType: true,
          Genre: { select: { name: true }, take: 1 },
          ArtistProfile: { select: { artistName: true } },
        },
      },
      ReviewerProfile: {
        select: { User: { select: { name: true } } },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  const review = await getReview(reviewId);
  if (!review) return { title: "Feedback Not Found" };

  const trackTitle = review.Track?.title ?? "this track";
  const artist = review.Track?.ArtistProfile?.artistName ?? "an artist";
  const cardUrl = `${APP_URL}/api/og/review-card?reviewId=${reviewId}`;
  const title = `Feedback on "${trackTitle}"`;
  const description = review.bestPart
    ? review.bestPart.slice(0, 160)
    : `Real peer feedback on "${trackTitle}" by ${artist}.`;
  const socialTitle = `${title} — MixReflect`;

  return {
    title,
    description,
    openGraph: {
      title: socialTitle,
      description,
      url: `${APP_URL}/r/${reviewId}`,
      images: [{ url: cardUrl, width: 1080, height: 1080 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [cardUrl],
    },
  };
}

function ScoreBlock({ label, score }: { label: string; score: number }) {
  const { label: verdict, tone } = scoreLabel(score);
  const toneClass =
    tone === "high" ? "text-purple-300" : tone === "low" ? "text-amber-300" : "text-white/55";
  return (
    <div className="flex-1 px-4 py-5 text-center">
      <div className="text-4xl font-black tabular-nums leading-none text-white">
        {score.toFixed(1)}
      </div>
      <div className={`text-xs font-semibold mt-2 ${toneClass}`}>{verdict}</div>
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/30 mt-1">
        {label}
      </div>
    </div>
  );
}

export default async function PublicReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  const review = await getReview(reviewId);

  if (!review || !review.bestPart) notFound();

  const track = review.Track;
  const trackTitle = track?.title ?? "Untitled";
  const artistName = track?.ArtistProfile?.artistName ?? "Artist";
  const genre = track?.Genre?.[0]?.name ?? null;
  const reviewerName = review.ReviewerProfile?.User?.name
    ? review.ReviewerProfile.User.name.trim().split(/\s+/)[0]
    : "A listener";
  const reviewerInitial = (reviewerName.trim()[0] || "?").toUpperCase();
  const qualityLabel = review.qualityLevel ? qualityLabels[review.qualityLevel] : null;
  const isHooked = review.firstImpression === "STRONG_HOOK";

  const scores = [
    { label: "Production", score: review.productionScore },
    { label: "Originality", score: review.originalityScore },
    { label: "Vocals", score: review.vocalScore },
  ].filter((s): s is { label: string; score: number } => s.score !== null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070510] text-white">
      {/* Ambient aurora */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-aurora absolute left-1/2 top-[28%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(147,51,234,0.30)_0%,rgba(109,40,217,0.10)_40%,transparent_70%)]" />
        <div className="animate-aurora-slow absolute left-[68%] top-[10%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(217,70,239,0.16)_0%,transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/8 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="opacity-70 hover:opacity-100 transition-opacity">
            <Logo className="text-white" />
          </Link>
          <Link
            href="/signup"
            className="text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            Get feedback on your music →
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <AnimatedSection className="space-y-9">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-500/10 px-3.5 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-300" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-purple-200/80">
              Peer feedback
            </span>
          </div>

          {/* Track identity */}
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-900 via-purple-700 to-fuchsia-700 shadow-[0_0_60px_rgba(147,51,234,0.45)]">
              {track?.artworkUrl ? (
                <img src={track.artworkUrl} alt={trackTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-9 h-9 text-white/40" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.05] truncate">
                {trackTitle}
              </h1>
              <p className="text-sm text-white/50 mt-1.5">
                {artistName}
                {genre && <span className="ml-2 text-white/30">· {genre}</span>}
              </p>
            </div>
          </div>

          {/* Audio player — hear the track */}
          {track?.sourceUrl && track?.sourceType && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm">
              <p className="px-1 pb-2 text-[11px] font-mono uppercase tracking-[0.2em] text-white/30">
                Press play — hear what they heard
              </p>
              <AudioPlayer
                sourceUrl={track.sourceUrl}
                sourceType={track.sourceType}
                showListenTracker={false}
                showWaveform={track.sourceType === "UPLOAD"}
              />
            </div>
          )}

          {/* Badges */}
          {(qualityLabel || isHooked || review.wouldListenAgain) && (
            <div className="flex flex-wrap items-center gap-2">
              {qualityLabel && (
                <span className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/15 px-3.5 py-1.5 text-xs font-bold text-purple-200">
                  {qualityLabel}
                </span>
              )}
              {isHooked && (
                <span className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/15 px-3.5 py-1.5 text-xs font-bold text-purple-200">
                  Hooked from the start
                </span>
              )}
              {review.wouldListenAgain && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/50">
                  <Repeat2 className="h-3.5 w-3.5" />
                  Would replay
                </span>
              )}
            </div>
          )}

          {/* The verdict — hero quote */}
          <section>
            <div className="text-7xl leading-none text-purple-500/50 font-serif h-10">&ldquo;</div>
            <blockquote className="text-2xl sm:text-[30px] font-semibold text-white/95 leading-snug tracking-[-0.01em]">
              {review.bestPart}
            </blockquote>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xs font-black text-purple-200">
                  {reviewerInitial}
                </div>
                <span className="text-sm text-white/45 font-medium">
                  {reviewerName}
                  {genre ? ` · ${genre} fan` : ""}
                </span>
              </div>
              <ShareReviewButton
                reviewId={review.id}
                trackTitle={trackTitle}
                variant="onDark"
                label="Share this feedback"
              />
            </div>
          </section>

          {/* Scores — insights style */}
          {scores.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <div className="flex divide-x divide-white/8">
                {scores.map((s) => (
                  <ScoreBlock key={s.label} label={s.label} score={s.score} />
                ))}
              </div>
            </section>
          )}

          {/* Main feedback */}
          {review.biggestWeaknessSpecific && (
            <section className="rounded-2xl border border-white/8 bg-white/[0.025] px-5 py-5">
              <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/30 mb-2.5">
                Main feedback
              </p>
              <p className="text-[15px] text-white/75 leading-relaxed">
                {review.biggestWeaknessSpecific}
              </p>
            </section>
          )}

          {/* CTA */}
          <section className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/40 to-fuchsia-900/10 p-7 text-center">
            <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-purple-300/60 mb-2">
              Your turn
            </p>
            <h3 className="text-xl font-black text-white mb-1.5 tracking-tight">
              Upload tonight. Wake up to real feedback.
            </h3>
            <p className="text-sm text-white/50 mb-6 max-w-sm mx-auto">
              Honest, structured feedback from producers who make the same music you do.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm shadow-[0_8px_30px_rgba(147,51,234,0.35)]"
            >
              Get feedback free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </AnimatedSection>
      </main>

      <footer className="relative z-10 border-t border-white/8 px-6 py-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-xs text-white/25">
          <Link href="/" className="hover:text-white/50 transition-colors">
            MixReflect
          </Link>
          <span>Feedback from real producers</span>
        </div>
      </footer>
    </div>
  );
}
