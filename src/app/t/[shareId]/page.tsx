import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import {
  ListMusic,
  Share2,
  UserPlus,
  Repeat2,
  Music,
  ArrowRight,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const track = await prisma.track.findUnique({
    where: { trackShareId: shareId },
    select: {
      title: true,
      ArtistProfile: { select: { artistName: true } },
    },
  });
  if (!track) return { title: "Track Not Found" };
  return {
    title: `${track.title} — Listener Feedback | MixReflect`,
    description: `See what real producers think of "${track.title}" by ${track.ArtistProfile.artistName}. Listener intent data from MixReflect.`,
  };
}

function pct(yes: number, total: number) {
  if (total === 0) return null;
  return Math.round((yes / total) * 100);
}

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;

  const track = await prisma.track.findUnique({
    where: { trackShareId: shareId },
    select: {
      id: true,
      title: true,
      artworkUrl: true,
      sharingEnabled: true,
      showReviewsOnPublicPage: true,
      Genre: { select: { name: true } },
      ArtistProfile: { select: { artistName: true } },
      Review: {
        where: { status: "COMPLETED", countsTowardAnalytics: true },
        select: {
          productionScore: true,
          vocalScore: true,
          originalityScore: true,
          wouldListenAgain: true,
          wouldAddToPlaylist: true,
          wouldShare: true,
          wouldFollow: true,
          firstImpression: true,
          bestPart: true,
          additionalNotes: true,
          createdAt: true,
        },
      },
    },
  });

  if (!track || !track.sharingEnabled) notFound();

  const reviews = track.Review;
  const reviewCount = reviews.length;

  // Listener intent
  const playlistYes = reviews.filter((r) => r.wouldAddToPlaylist === true).length;
  const playlistTotal = reviews.filter((r) => r.wouldAddToPlaylist !== null).length;
  const shareYes = reviews.filter((r) => r.wouldShare === true).length;
  const shareTotal = reviews.filter((r) => r.wouldShare !== null).length;
  const followYes = reviews.filter((r) => r.wouldFollow === true).length;
  const followTotal = reviews.filter((r) => r.wouldFollow !== null).length;
  const listenAgainYes = reviews.filter((r) => r.wouldListenAgain === true).length;
  const listenAgainTotal = reviews.filter((r) => r.wouldListenAgain !== null).length;

  // Scores
  const prodScores = reviews.map((r) => r.productionScore).filter((s): s is number => s !== null);
  const vocalScores = reviews.map((r) => r.vocalScore).filter((s): s is number => s !== null);
  const origScores = reviews.map((r) => r.originalityScore).filter((s): s is number => s !== null);
  const avgProd = prodScores.length ? prodScores.reduce((a, b) => a + b, 0) / prodScores.length : null;
  const avgVocal = vocalScores.length ? vocalScores.reduce((a, b) => a + b, 0) / vocalScores.length : null;
  const avgOrig = origScores.length ? origScores.reduce((a, b) => a + b, 0) / origScores.length : null;
  const overallAvg = [avgProd, avgVocal, avgOrig].filter((s): s is number => s !== null);
  const avgScore = overallAvg.length ? overallAvg.reduce((a, b) => a + b, 0) / overallAvg.length : null;

  // First impressions
  const strongHook = reviews.filter((r) => r.firstImpression === "STRONG_HOOK").length;
  const hookPct = reviewCount > 0 ? Math.round((strongHook / reviewCount) * 100) : null;

  // Notable quotes (bestPart or additionalNotes, max 3)
  const quotes = reviews
    .filter((r) => r.bestPart && r.bestPart.trim().length > 20)
    .slice(0, 3)
    .map((r) => r.bestPart as string);

  const intentStats = [
    { icon: ListMusic, label: "Add to playlist", yes: playlistYes, total: playlistTotal },
    { icon: Share2, label: "Share it", yes: shareYes, total: shareTotal },
    { icon: UserPlus, label: "Follow artist", yes: followYes, total: followTotal },
    { icon: Repeat2, label: "Listen again", yes: listenAgainYes, total: listenAgainTotal },
  ].filter((s) => s.total > 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Minimal header */}
      <header className="border-b border-white/8 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="opacity-60 hover:opacity-100 transition-opacity">
            <Logo />
          </Link>
          <Link
            href="/signup"
            className="text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            Get feedback on your music →
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">

        {/* Track identity */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-900 via-purple-700 to-pink-700 shadow-[0_0_40px_rgba(147,51,234,0.3)]">
            {track.artworkUrl ? (
              <img
                src={track.artworkUrl}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-8 h-8 text-white/30" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/30 mb-1">
              Listener Feedback Report
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
              {track.title}
            </h1>
            <p className="text-sm text-white/50 mt-0.5">
              {track.ArtistProfile.artistName}
              {track.Genre.length > 0 && (
                <span className="ml-2 text-white/30">· {track.Genre.map((g) => g.name).join(", ")}</span>
              )}
            </p>
          </div>
        </div>

        {/* Review count badge */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="text-lg font-black text-purple-400 tabular-nums">{reviewCount}</span>
            <span className="text-sm text-white/50">{reviewCount === 1 ? "producer" : "producers"} reviewed this track</span>
          </div>
          {avgScore !== null && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-amber-400">{avgScore.toFixed(1)}</span>
              <span className="text-xs text-white/40">/5</span>
            </div>
          )}
        </div>

        {/* Listener Intent — the hero section */}
        {intentStats.length > 0 && (
          <section className="space-y-4">
            <div>
              <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/30">Listener Intent</p>
              <h2 className="text-xl font-bold text-white mt-1">Would they act on this track?</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {intentStats.map(({ icon: Icon, label, yes, total }) => {
                const p = pct(yes, total);
                if (p === null) return null;
                const isPositive = p >= 50;
                return (
                  <div
                    key={label}
                    className={cn(
                      "rounded-2xl border p-5 flex flex-col gap-3 transition-all",
                      isPositive
                        ? "border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-purple-800/20"
                        : "border-white/8 bg-white/4"
                    )}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center",
                      isPositive ? "bg-purple-500/20 text-purple-400" : "bg-white/8 text-white/30"
                    )}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className={cn(
                        "text-4xl font-black tabular-nums leading-none",
                        isPositive ? "text-purple-300" : "text-white/40"
                      )}>
                        {p}%
                      </p>
                      <p className="text-sm text-white/50 mt-1">{label}</p>
                      <p className="text-[11px] text-white/25 font-mono mt-0.5">{yes}/{total} listeners</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Hook strength */}
        {hookPct !== null && reviewCount >= 3 && (
          <section className="rounded-2xl border border-white/8 bg-white/4 p-5">
            <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/30 mb-3">First Impression</p>
            <div className="flex items-center gap-4">
              <p className={cn(
                "text-5xl font-black tabular-nums",
                hookPct >= 60 ? "text-purple-300" : hookPct >= 40 ? "text-amber-400" : "text-white/40"
              )}>
                {hookPct}%
              </p>
              <div>
                <p className="text-sm font-semibold text-white">
                  {hookPct >= 60 ? "Strong hook" : hookPct >= 40 ? "Decent opening" : "Needs a stronger hook"}
                </p>
                <p className="text-xs text-white/40 mt-0.5">of listeners were immediately hooked</p>
              </div>
            </div>
          </section>
        )}

        {/* Score breakdown */}
        {(avgProd !== null || avgVocal !== null || avgOrig !== null) && (
          <section className="space-y-3">
            <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/30">Score Breakdown</p>
            <div className="space-y-2.5">
              {[
                { label: "Production", score: avgProd },
                { label: "Originality", score: avgOrig },
                { label: "Vocals / Delivery", score: avgVocal },
              ].filter((s) => s.score !== null).map(({ label, score }) => {
                const s = score as number;
                const barPct = (s / 5) * 100;
                return (
                  <div key={label} className="flex items-center gap-4">
                    <span className="text-xs text-white/40 w-32 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white/70 tabular-nums w-8 text-right">
                      {s.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Quotes */}
        {quotes.length > 0 && track.showReviewsOnPublicPage && (
          <section className="space-y-3">
            <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/30">What producers said</p>
            <div className="space-y-3">
              {quotes.map((q, i) => (
                <blockquote
                  key={i}
                  className="rounded-xl border border-white/8 bg-white/4 px-5 py-4 text-sm text-white/70 leading-relaxed italic"
                >
                  &ldquo;{q}&rdquo;
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 to-purple-800/10 p-6 text-center">
          <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-purple-400/60 mb-2">MixReflect</p>
          <h3 className="text-lg font-bold text-white mb-1">Get real feedback on your music</h3>
          <p className="text-sm text-white/50 mb-5">
            From producers who make the same music you do. Genre-matched, structured, honest.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm border border-purple-400/20"
          >
            Get feedback free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

      </main>

      <footer className="border-t border-white/8 px-6 py-6 mt-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-xs text-white/25">
          <Link href="/" className="hover:text-white/50 transition-colors">MixReflect</Link>
          <span>Feedback from real producers</span>
        </div>
      </footer>
    </div>
  );
}
