import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EditorNoteForm } from "./editor-note-form";
import { ManualFeatureButton } from "./manual-feature-button";

export const dynamic = "force-dynamic";

async function getRecentFeatured() {
  return (prisma as any).chartSubmission.findMany({
    where: { isFeatured: true },
    orderBy: { chartDate: "desc" },
    take: 10,
    include: {
      ArtistProfile: { select: { artistName: true } },
    },
  });
}

async function getRecentChartCandidates() {
  // Top 5 most recent chart entries (potential manual featuring)
  return (prisma as any).chartSubmission.findMany({
    orderBy: [{ chartDate: "desc" }, { voteCount: "desc" }],
    take: 8,
    include: {
      ArtistProfile: { select: { artistName: true } },
    },
  });
}

export default async function TrackOfTheDayAdminPage() {
  const [featured, recent] = await Promise.all([
    getRecentFeatured(),
    getRecentChartCandidates(),
  ]);

  const current = featured[0];

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">Track of the Day</h1>
            <p className="text-sm text-neutral-500">
              Manage the daily featured track and editor&rsquo;s note
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {/* ── Current featured ────────────────────────────────── */}
          {current ? (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
                  Currently featured
                </h2>
                <Link
                  href="/today"
                  target="_blank"
                  className="text-xs font-bold text-purple-600 hover:text-purple-700"
                >
                  View public page →
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <div className="flex items-start gap-5">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-black flex-shrink-0 bg-neutral-100">
                    {current.artworkUrl ? (
                      <Image
                        src={current.artworkUrl}
                        alt={current.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                      {new Date(current.chartDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <h3 className="text-xl font-black text-black mt-1 truncate">
                      {current.title}
                    </h3>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      by {current.ArtistProfile?.artistName || "Unknown"}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                      <span><strong className="text-black">{current.voteCount}</strong> votes</span>
                      <span>·</span>
                      <span><strong className="text-black">{current.playCount}</strong> plays</span>
                      {current.genre && (
                        <>
                          <span>·</span>
                          <span>{current.genre}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-100">
                  <EditorNoteForm
                    submissionId={current.id}
                    initialNote={current.editorNote || ""}
                    initialByline={current.editorNoteByline || "MixReflect"}
                    generatedAt={current.editorNoteGeneratedAt}
                    editedAt={current.editorNoteEditedAt}
                  />
                </div>
              </div>
            </section>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <p className="font-bold text-amber-800">No track currently featured.</p>
              <p className="text-sm text-amber-700 mt-1">
                The cron will pick one at midnight UTC, or feature one manually below.
              </p>
            </div>
          )}

          {/* ── Recent chart entries (manual feature) ──────────── */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-3">
              Recent chart entries
            </h2>
            <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
              {recent.length === 0 ? (
                <p className="p-5 text-sm text-neutral-500">No chart submissions yet.</p>
              ) : (
                recent.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-4 p-4">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 flex-shrink-0">
                      {s.artworkUrl ? (
                        <Image src={s.artworkUrl} alt={s.title} fill className="object-cover" sizes="48px" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-black truncate">{s.title}</p>
                      <p className="text-xs text-neutral-500 truncate">
                        {s.ArtistProfile?.artistName} · {new Date(s.chartDate).toLocaleDateString()} · {s.voteCount} votes
                      </p>
                    </div>
                    {s.isFeatured ? (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        Featured
                      </span>
                    ) : (
                      <ManualFeatureButton submissionId={s.id} />
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ── Past features ────────────────────────────────────── */}
          {featured.length > 1 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-3">
                Past features
              </h2>
              <div className="bg-white rounded-2xl border border-neutral-200 divide-y divide-neutral-100">
                {featured.slice(1).map((s: any) => (
                  <Link
                    key={s.id}
                    href={`/admin/track-of-the-day/${s.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 flex-shrink-0">
                      {s.artworkUrl ? (
                        <Image src={s.artworkUrl} alt={s.title} fill className="object-cover" sizes="48px" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-black truncate">{s.title}</p>
                      <p className="text-xs text-neutral-500 truncate">
                        {s.ArtistProfile?.artistName} · {new Date(s.chartDate).toLocaleDateString()}
                      </p>
                    </div>
                    {s.editorNote ? (
                      <span className="text-[10px] font-bold text-emerald-600">Note written</span>
                    ) : (
                      <span className="text-[10px] font-bold text-neutral-400">No note</span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

