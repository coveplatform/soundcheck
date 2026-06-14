import Link from "next/link";
import Image from "next/image";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { prisma } from "@/lib/prisma";
import { SiteNav } from "@/components/landing/site-nav";
import { SignupLink } from "@/components/landing/signup-link";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, ExternalLink, Music, Headphones } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

const ACCENT = "#6ee7ff";

export const dynamic = "force-dynamic";
export const revalidate = 600;

export const metadata = {
  title: "Track of the Day — MixReflect",
  description: "A new track every day, picked by producers, written up by the editors. Honest music criticism for people who make music.",
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
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black`}>
      {/* grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0 mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10">
        <SiteNav />

        {/* ── Masthead ─────────────────────────────────────────────── */}
        <section className="relative border-b border-white/10 overflow-hidden">
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-25 blur-3xl pointer-events-none"
            style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }}
          />
          <div className="relative max-w-3xl mx-auto px-5 pt-16 pb-12 text-center">
            <p className={`${mono.className} text-[13px] lowercase tracking-tight mb-4`} style={{ color: ACCENT }}>
              [ today on mixreflect ]
            </p>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-[-0.04em] leading-[0.95]">
              Track of the Day
            </h1>
            <p className={`${mono.className} mt-5 text-[12px] lowercase tracking-[0.3em] text-white/40`}>
              {formatDate(new Date(submission.chartDate))}
            </p>
          </div>
        </section>

        {/* ── The pick ─────────────────────────────────────────────── */}
        <article className="border-b border-white/10">
          <div className="max-w-3xl mx-auto px-5 py-12 sm:py-16">

            {/* artwork */}
            <div className="aspect-square relative overflow-hidden border border-white/12 bg-[#0e0e0e] max-w-md mx-auto mb-10 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.95)]">
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music className="h-24 w-24 text-white/15" />
                </div>
              )}
              {/* cyan accent edge */}
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${ACCENT}, #a78bfa)` }} />
            </div>

            {/* title block */}
            <div className="text-center mb-10 max-w-2xl mx-auto">
              {genres.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                  {genres.slice(0, 3).map((g: string) => (
                    <span
                      key={g}
                      className={`${mono.className} inline-block text-[10px] font-bold lowercase tracking-wider px-2.5 py-1 text-black`}
                      style={{ background: ACCENT }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <h2 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.03em] leading-[1.02] mb-3">
                {submission.title}
              </h2>
              <p className="text-xl sm:text-2xl font-semibold text-white/45 normal-case">
                by {submission.ArtistProfile?.artistName || "Unknown Artist"}
              </p>

              <a
                href={submission.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-7 bg-[#6ee7ff] hover:bg-white text-black font-extrabold px-7 py-3.5 transition-colors shadow-[0_0_30px_-6px_rgba(110,231,255,0.7)]"
              >
                <Headphones className="h-4 w-4" /> press play
              </a>
            </div>

            {/* editor's note */}
            {editorNote ? (
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-white/10" />
                  <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.3em] text-white/40`}>
                    Editor&rsquo;s note
                  </p>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <p
                  className="text-lg sm:text-xl leading-[1.7] text-white/80"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  {editorNote}
                </p>

                <p className={`${mono.className} text-[13px] lowercase text-white/35 mt-6 text-right`}>
                  — {byline}
                </p>
              </div>
            ) : (
              <div className={`${mono.className} max-w-2xl mx-auto text-center text-[13px] text-white/35 lowercase`}>
                editor&rsquo;s note coming soon.
              </div>
            )}

            {/* reviewer quotes */}
            {reviewerQuotes.length > 0 && (
              <div className="max-w-2xl mx-auto mt-14 pt-10 border-t border-white/10">
                <p className={`${mono.className} text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mb-6 text-center`}>
                  What producers said
                </p>
                <div className="space-y-4">
                  {reviewerQuotes.map((q: any, i: number) => (
                    <div key={i} className="bg-[#0e0e0e] border border-white/10 p-5">
                      <p className="text-base text-white/75 leading-relaxed mb-3 italic">
                        &ldquo;{q.quote}&rdquo;
                      </p>
                      <p className={`${mono.className} text-[11px] font-bold text-white/40 uppercase tracking-wider`}>
                        — {q.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* listen link */}
            <div className="max-w-2xl mx-auto mt-10 text-center">
              <a
                href={submission.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${mono.className} inline-flex items-center gap-2 text-[13px] lowercase text-white/55 hover:text-white transition-colors`}
              >
                listen on {submission.sourceType?.toLowerCase().replace("_", " ") || "platform"}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </article>

        {/* ── Submit your own ──────────────────────────────────────── */}
        <section className="relative py-16 sm:py-20 overflow-hidden border-b border-white/10">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
          <div className="relative max-w-2xl mx-auto px-5 text-center">
            <p className={`${mono.className} text-[13px] lowercase mb-3`} style={{ color: ACCENT }}>
              [ your track here ]
            </p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-tight mb-5">
              Tomorrow&rsquo;s Track of the Day<br />could be yours.
            </h2>
            <p className="text-white/50 text-base sm:text-lg mb-8 max-w-xl mx-auto normal-case">
              Score your track on MixReflect — an instant AI read out of 100, then real
              reactions from a room of five listeners. The best-reviewed tracks get the daily spotlight.
            </p>
            <SignupLink className="inline-flex items-center gap-2 bg-[#6ee7ff] hover:bg-white text-black font-extrabold px-7 py-4 transition-colors shadow-[0_0_30px_-6px_rgba(110,231,255,0.7)]">
              score your track <ArrowRight className="h-4 w-4" />
            </SignupLink>
            <p className={`${mono.className} text-white/30 text-[12px] mt-5 lowercase`}>
              free first read · no card · honest feedback before you release
            </p>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="py-8">
          <div className={`${mono.className} max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] lowercase text-white/40`}>
            <div className="flex items-center gap-2">
              <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-6" />
              <span>— track of the day</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/today/archive" className="hover:text-white transition-colors">archive</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">privacy</Link>
              <a href="mailto:support@mixreflect.com" className="hover:text-white transition-colors">contact</a>
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
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black`}>
      <div className="relative z-10">
        <SiteNav />
        <div className="min-h-[70vh] flex items-center justify-center px-5 py-12">
          <div className="max-w-md text-center space-y-6">
            <div className="mx-auto h-20 w-20 border border-white/12 bg-[#0e0e0e] flex items-center justify-center">
              <Music className="h-10 w-10 text-white/25" />
            </div>
            <p className={`${mono.className} text-[13px] lowercase`} style={{ color: ACCENT }}>
              [ coming soon ]
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] leading-tight">
              Today&rsquo;s pick is brewing
            </h1>
            <p className="text-white/50 leading-relaxed normal-case">
              We feature one track a day, voted up by producers and written up by the editors.
              Check back soon — or score yours and you might be next.
            </p>
            <SignupLink className="inline-flex items-center gap-2 bg-[#6ee7ff] hover:bg-white text-black font-extrabold px-6 py-3 transition-colors shadow-[0_0_30px_-6px_rgba(110,231,255,0.7)]">
              score your track <ArrowRight className="h-4 w-4" />
            </SignupLink>
          </div>
        </div>
      </div>
    </div>
  );
}
