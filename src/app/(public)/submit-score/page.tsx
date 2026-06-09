"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, Loader2, Music, X } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

const GENRES = [
  "Electronic", "Hip-Hop", "Pop", "R&B / Soul", "Rock", "Indie", "Lo-Fi",
  "Dance / Club", "Ambient", "Singer-Songwriter", "Metal", "Jazz",
  "Classical", "Country", "Latin", "Other",
];

type Meta = { title: string; artist: string | null; artworkUrl: string | null };

export default function SubmitScorePage() {
  const { data: session } = useSession();

  const [trackUrl, setTrackUrl] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [meta, setMeta] = useState<Meta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  const hasEmail = !!session?.user?.email || email.trim().length > 0;
  const isUrl = /^https?:\/\//i.test(trackUrl.trim());
  const isValid = trackUrl.trim().length > 0 && hasEmail;

  let host = "";
  try {
    host = new URL(trackUrl.trim()).hostname.replace(/^www\./, "");
  } catch {
    /* not a url yet */
  }

  // ── debounced track preview (same as the landing) ──
  useEffect(() => {
    const u = trackUrl.trim();
    if (!/^https?:\/\//i.test(u)) {
      setMeta(null);
      setMetaLoading(false);
      return;
    }
    let cancelled = false;
    setMetaLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: u }),
        });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.ok && data?.title) {
          setMeta({ title: data.title, artist: data.artist ?? null, artworkUrl: data.artworkUrl ?? null });
          // prefill the title field if the artist left it blank
          setTrackTitle((cur) => cur || data.title);
        } else {
          setMeta(null);
        }
      } catch {
        if (!cancelled) setMeta(null);
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    }, 550);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/score/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackUrl, trackTitle, genre, notes, email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.slug) {
        setError(data?.error ?? "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = `/report/${data.slug}`;
    } catch {
      setError("Failed to submit. Try again.");
      setSubmitting(false);
    }
  };

  const inputCls =
    `${mono.className} w-full bg-[#141414] border border-white/20 focus:border-[#6ee7ff] px-4 py-3.5 text-[15px] text-white placeholder:text-white/35 focus:outline-none transition-colors normal-case`;

  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}
    >
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <Link
            href="/"
            className={`${mono.className} text-[13px] text-white/65 hover:text-white transition-colors`}
          >
            ← back
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-14">
        <p className={`${mono.className} text-[13px] text-white/55 mb-3`}>
          [ drop your track ]
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] mb-4">
          get an honest <span style={{ color: ACCENT }}>read</span>.
        </h1>
        <p className="text-white/70 text-lg mb-10 normal-case max-w-md leading-relaxed">
          An instant, honest read on your track. Free to submit — unlock the
          full report whenever you like.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="track link" required>
            {!isUrl ? (
              <input
                type="url"
                value={trackUrl}
                onChange={(e) => setTrackUrl(e.target.value)}
                placeholder="paste a soundcloud, youtube, bandcamp or mp3 link…"
                required
                className={inputCls}
              />
            ) : (
              <div
                className="flex items-center gap-4 bg-[#141414] border p-3.5"
                style={{ borderColor: meta ? ACCENT : "rgba(255,255,255,0.2)", animation: "cardIn .25s ease" }}
              >
                <div className="w-16 h-16 bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                  {meta?.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={meta.artworkUrl} alt="" className="w-full h-full object-cover" />
                  ) : metaLoading ? (
                    <Loader2 className="h-5 w-5 text-white/50 animate-spin" />
                  ) : (
                    <Music className="h-5 w-5 text-white/50" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {metaLoading && !meta ? (
                    <>
                      <div className="h-4 w-44 bg-white/10 animate-pulse" />
                      <div className="h-3 w-28 bg-white/5 mt-2.5 animate-pulse" />
                    </>
                  ) : meta ? (
                    <>
                      <p className="text-[16px] font-bold text-white truncate normal-case">{meta.title}</p>
                      <p className={`${mono.className} text-[12px] text-white/60 truncate normal-case mt-0.5`}>
                        {meta.artist ? `by ${meta.artist}` : "track found"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[15px] font-bold text-white truncate normal-case">link added</p>
                      <p className={`${mono.className} text-[12px] text-white/60 truncate normal-case mt-0.5`}>
                        {host || "ready to go"}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`${mono.className} text-[11px]`} style={{ color: ACCENT }}>
                    {metaLoading && !meta ? "reading…" : "✓ ready"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTrackUrl("")}
                    aria-label="change track"
                    className="text-white/45 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </Field>

          <Field label="track title" optional>
            <input
              type="text"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              placeholder="e.g. midnight drive"
              className={inputCls}
            />
          </Field>

          <Field label="genre" optional>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className={inputCls}
            >
              <option value="">pick a genre</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>

          {session?.user?.email ? (
            <p className={`${mono.className} text-[13px] text-white/60 normal-case`}>
              saved to <span style={{ color: ACCENT }}>{session.user.email}</span>
            </p>
          ) : (
            <Field label="your email" required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={inputCls}
              />
            </Field>
          )}

          <Field label="anything we should know" optional>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. first release, is the intro too long?"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {error && (
            <p className={`${mono.className} text-[13px] text-red-400 normal-case`}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!isValid || submitting}
            className="group w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-base py-4 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "analyzing…" : "get my read — free"}
            {!submitting && (
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            )}
          </button>
          <p className={`${mono.className} text-center text-[12px] text-white/50 normal-case`}>
            no card to submit · unlock the full read for $6.95
          </p>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/report/demo"
            className={`${mono.className} text-[13px] text-white/60 hover:text-white transition-colors`}
          >
            see a sample report first →
          </Link>
        </div>
      </div>

      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={`${mono.className} block text-[12px] text-white/60 mb-2`}>
        {label}
        {required && <span style={{ color: ACCENT }}> *</span>}
        {optional && <span className="text-white/30"> (optional)</span>}
      </label>
      {children}
    </div>
  );
}
