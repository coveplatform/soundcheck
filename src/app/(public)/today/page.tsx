import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Caveat } from "next/font/google";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import { SignupLink } from "@/components/landing/signup-link";
import { Sparkle, Squiggle, Dots } from "@/components/landing/doodles";
import { ArrowRight, ExternalLink, Music, Headphones } from "lucide-react";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

export const dynamic = "force-dynamic";
export const revalidate = 600;

export const metadata = {
  title: "Track of the Day — MixReflect",
  description: "A new track every day, picked by producers, written up by the editors. Music criticism for people who make music.",
};

async function getFeaturedSubmission() {
  // First try: most recent isFeatured submission
  const featured = await (prisma as any).chartSubmission.findFirst({
    where: { isFeatured: true },
    orderBy: { chartDate: "desc" },
    include: {
      ArtistProfile: {
        select: {
          artistName: true,
          User: { select: { image: true } },
        },
      },
      Track: {
        select: {
          id: true,
          feedbackFocus: true,
          Genre: { select: { name: true } },
          Review: {
            where: { status: "COMPLETED" },
            select: {
              id: true,
              firstImpression: true,
              strongestElement: true,
              ReviewerProfile: {
                select: {
                  displayName: true,
                  User: { select: { image: true } },
                },
              },
            },
            take: 3,
            orderBy: { completedAt: "desc" },
          },
        },
      },
    },
  });

  return featured;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default async function TrackOfTheDayPage() {
  const submission = await getFeaturedSubmission();

  if (!submission) {
    return <EmptyState />;
  }

  const editorNote = submission.editorNote;
  const byline = submission.editorNoteByline || "MixReflect";
  const reviewerQuotes = (submission.Track?.Review || [])
    .map((r: any) => ({
      quote: r.firstImpression || r.strongestElement,
      name: r.ReviewerProfile?.displayName || "Anonymous",
      image: r.ReviewerProfile?.User?.image,
    }))
    .filter((q: any) => q.quote)
    .slice(0, 3);

  const genres = submission.Track?.Genre?.map((g: any) => g.name) || [];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-950">

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8f5]/90 backdrop-blur-sm border-b border-black/6">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/today/archive" className="text-sm font-bold text-black/50 hover:text-black transition-colors hidden sm:block">
              Archive
            </Link>
            <SignupLink className="bg-black text-white text-sm font-black px-4 py-2 rounded-xl border-2 border-black hover:bg-neutral-800 transition-colors">
              Submit a track
            </SignupLink>
          </div>
        </div>
      </header>

      <div className="pt-14">

        {/* ── Date + masthead ──────────────────────────────────────── */}
        <div className="border-b-2 border-black bg-[#faf8f5] relative overflow-hidden">
          <Sparkle className="pointer-events-none absolute top-6 right-[12%] w-10 h-10 text-purple-400 opacity-50 -rotate-12 hidden md:block" />
          <Dots className="pointer-events-none absolute bottom-8 left-[8%] w-10 h-10 text-lime-500 opacity-50 hidden md:block" />

          <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16 text-center relative">
            <p className={`${caveat.className} text-xl sm:text-2xl text-purple-600 mb-2`}>
              today on mixreflect
            </p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-black leading-[1.05]">
              Track of the Day
            </h1>
            <p className="mt-3 text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-black/40">
              {formatDate(new Date(submission.chartDate))}
            </p>
          </div>
        </div>

        {/* ── Hero artwork + meta ──────────────────────────────────── */}
        <article className="bg-white border-b-2 border-black">
          <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">

            {/* Big square artwork */}
            <div className="aspect-square relative rounded-3xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-neutral-100 max-w-md mx-auto mb-10">
              {submission.artworkUrl ? (
                <Image
                  src={submission.artworkUrl}
                  alt={submission.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 448px"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-lime-100">
                  <Music className="h-24 w-24 text-black/20" />
                </div>
              )}
            </div>

            {/* Title block */}
            <div className="text-center mb-10 max-w-2xl mx-auto">
              {genres.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                  {genres.slice(0, 3).map((g: string) => (
                    <span
                      key={g}
                      className="inline-block bg-black text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-black leading-[1.05] mb-3">
                {submission.title}
              </h2>
              <p className="text-xl sm:text-2xl font-bold text-black/50">
                by {submission.ArtistProfile?.artistName || "Unknown Artist"}
              </p>

              <a
                href={submission.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 bg-lime-400 hover:bg-lime-300 active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black font-black border-2 border-black px-6 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <Headphones className="h-4 w-4" /> Press play
              </a>
            </div>

            {/* Editor's note */}
            {editorNote ? (
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-black/10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40">
                    Editor&rsquo;s note
                  </p>
                  <div className="h-px flex-1 bg-black/10" />
                </div>

                <p
                  className="text-lg sm:text-xl leading-[1.7] text-black/85 font-serif"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  {editorNote}
                </p>

                <p className={`${caveat.className} text-lg text-black/40 mt-6 text-right`}>
                  — {byline}
                </p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto text-center text-sm text-black/40 italic">
                Editor&rsquo;s note coming soon.
              </div>
            )}

            {/* Reviewer quotes */}
            {reviewerQuotes.length > 0 && (
              <div className="max-w-2xl mx-auto mt-14 pt-10 border-t-2 border-black/8">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 mb-6 text-center">
                  What producers said
                </p>
                <div className="space-y-5">
                  {reviewerQuotes.map((q: any, i: number) => (
                    <div key={i} className="bg-[#faf8f5] rounded-2xl border-2 border-black/10 p-5">
                      <p className="text-base text-black/80 leading-relaxed mb-3 italic">
                        &ldquo;{q.quote}&rdquo;
                      </p>
                      <p className="text-xs font-black text-black/40 uppercase tracking-wider">
                        — {q.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Listen link */}
            <div className="max-w-2xl mx-auto mt-10 text-center">
              <a
                href={submission.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-black/60 hover:text-black transition-colors"
              >
                Listen on {submission.sourceType?.toLowerCase().replace("_", " ") || "platform"}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </article>

        {/* ── Submit your own ──────────────────────────────────────── */}
        <section className="bg-black py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          <Squiggle className="pointer-events-none absolute top-10 right-[6%] w-16 h-16 text-purple-400 opacity-30 hidden sm:block" />

          <div className="max-w-2xl mx-auto px-4 text-center relative">
            <p className={`${caveat.className} text-lime-400 text-2xl mb-3`}>your track here</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-5">
              Tomorrow&rsquo;s Track of the Day<br />could be yours.
            </h2>
            <p className="text-white/50 text-base sm:text-lg font-medium mb-8 max-w-xl mx-auto">
              Submit your track. Producers in your genre listen, vote, and the top track gets the daily spotlight + an editor&rsquo;s write-up.
            </p>
            <SignupLink className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black font-black border-2 border-black px-6 py-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] transition-all">
              Submit your track <ArrowRight className="h-4 w-4" />
            </SignupLink>
            <p className="text-white/30 text-xs mt-5 font-medium">
              Free to submit · Public tracks only · Reviewed by genre-matched producers
            </p>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="border-t-2 border-black/8 py-8 bg-[#faf8f5]">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-black/40">
            <div className="flex items-center gap-2">
              <Logo />
              <span>MixReflect — Track of the Day</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/today/archive" className="hover:text-black transition-colors">Archive</Link>
              <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
              <a href="mailto:support@mixreflect.com" className="hover:text-black transition-colors">Contact</a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 py-12">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-white border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Music className="h-10 w-10 text-black/30" />
        </div>
        <p className={`${caveat.className} text-2xl text-purple-600`}>coming soon</p>
        <h1 className="text-3xl sm:text-4xl font-black text-black leading-tight">
          Today&rsquo;s pick is brewing
        </h1>
        <p className="text-black/50 leading-relaxed">
          We feature one track a day, voted up by producers and written up by the editors. Check back soon — or submit yours and you might be next.
        </p>
        <SignupLink className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-black font-black border-2 border-black px-6 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          Submit your track <ArrowRight className="h-4 w-4" />
        </SignupLink>
      </div>
    </div>
  );
}
