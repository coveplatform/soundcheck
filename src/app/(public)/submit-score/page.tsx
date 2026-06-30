"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, Loader2, Music, X, Upload, ChevronDown, Check } from "lucide-react";
import { isSupportedTrackUrl, normalizeTrackUrl, SUPPORTED_TRACK_HINT, unsupportedReason } from "@/lib/track-url";
import { scoreConversions } from "@/lib/score-conversions";
import { SealedPaywall } from "@/components/score/sealed-paywall";
import { FREE_FULL_READ } from "@/lib/score-free-tier";
import { useAuthModal } from "@/components/providers";

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
  const { data: session, status } = useSession();
  const { open: openAuth } = useAuthModal();

  // Submitting another track is a signed-in action. Rather than bounce to a full
  // /login page, pop the auth panel in place; the gated screen below is the
  // fallback if they dismiss it.
  useEffect(() => {
    if (status === "unauthenticated") openAuth("signup", "/submit-score");
  }, [status, openAuth]);

  const [trackUrl, setTrackUrl] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Free read already used: the hard pay-to-continue wall. `track` mode = no row
  // yet (the common path), `slug` mode = a pre-started row already exists.
  const [paywall, setPaywall] = useState<
    | { mode: "track"; url: string; title?: string; genre?: string; notes?: string }
    | { mode: "slug"; slug: string }
    | null
  >(null);

  const [meta, setMeta] = useState<Meta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState("");
  const [dragging, setDragging] = useState(false);

  const MAX_FILE_BYTES = 25 * 1024 * 1024;
  const audioDuration = (file: File): Promise<number | null> =>
    new Promise((resolve) => {
      try {
        const el = document.createElement("audio");
        el.preload = "metadata";
        el.onloadedmetadata = () => { const d = el.duration; URL.revokeObjectURL(el.src); resolve(Number.isFinite(d) ? d : null); };
        el.onerror = () => { URL.revokeObjectURL(el.src); resolve(null); };
        el.src = URL.createObjectURL(file);
      } catch { resolve(null); }
    });
  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { setError("File too large (max 25MB)."); return; }
    const dur = await audioDuration(file);
    if (dur != null && dur < 20) {
      setError(`That clip is only ${Math.round(dur)}s — upload the full track (20s+).`);
      return;
    }
    setError("");
    setUploading(true);
    try {
      const presignRes = await fetch("/api/uploads/track/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "audio/mpeg", contentLength: file.size }),
      });
      if (!presignRes.ok) {
        const d = await presignRes.json().catch(() => null);
        setError(d?.error === "Unauthorized" ? "Sign in to upload a file, or paste a link instead." : (d?.error ?? "Upload failed."));
        setUploading(false);
        return;
      }
      const { uploadUrl, fileUrl, contentType } = await presignRes.json();
      const up = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": contentType || "audio/mpeg" } });
      if (!up.ok) { setError("Upload failed. Try again."); setUploading(false); return; }
      setUploadedName(file.name);
      setTrackUrl(fileUrl);
      setTrackTitle((cur) => cur || file.name.replace(/\.[^/.]+$/, ""));
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const hasEmail = !!session?.user?.email || email.trim().length > 0;
  const isUrl = /^https?:\/\//i.test(trackUrl.trim());
  const isSupported = isUrl && isSupportedTrackUrl(trackUrl);
  // A specific "this exact host won't work" message (Dropbox/Drive/etc.), else null.
  const blockReason = isUrl ? unsupportedReason(trackUrl) : null;
  const isValid = isSupported && hasEmail;

  let host = "";
  try {
    host = new URL(trackUrl.trim()).hostname.replace(/^www\./, "");
  } catch {
    /* not a url yet */
  }

  // Start-on-paste: the moment a supported link is in the box (pasted or just
  // uploaded), create the report and kick the read off in the background. By
  // the time the user fills genre/notes and hits submit, the analysis is well
  // underway — generation re-reads the row before building the LLM prompt, so
  // the form fields still shape the read. Keyed by normalized URL: swapping
  // the link fires a fresh start and the old one is swept by the GC.
  const startRef = useRef<{
    url: string;
    promise: Promise<{ slug?: string; claimToken?: string; sealed?: boolean } | null>;
  } | null>(null);
  const ensureStarted = (rawUrl: string) => {
    const url = normalizeTrackUrl(rawUrl);
    if (startRef.current?.url !== url) {
      startRef.current = {
        url,
        promise: fetch("/api/score/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackUrl: url }),
        })
          .then((r) => r.json().catch(() => null))
          .catch(() => null),
      };
    }
    return startRef.current.promise;
  };

  // ── debounced track preview (same as the landing) ──
  useEffect(() => {
    const u = trackUrl.trim();
    if (!/^https?:\/\//i.test(u) || !isSupportedTrackUrl(u)) {
      setMeta(null);
      setMetaLoading(false);
      return;
    }
    let cancelled = false;
    setMetaLoading(true);
    const t = setTimeout(async () => {
      // Kick the analysis off now — it builds while the form is being filled.
      void ensureStarted(u);
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
      // Finalize the report that started building at paste time (slug + claim
      // token); /submit patches genre/notes/title onto it and returns right
      // away — generation keeps running in the background and the report
      // page's pending view takes over.
      const started = await ensureStarted(trackUrl);
      // Hard wall: /start already told us this artist is past their free read, so
      // nothing was generated — go straight to pay-to-continue, no /submit call.
      if (started?.sealed) {
        setSubmitting(false);
        setPaywall({ mode: "track", url: normalizeTrackUrl(trackUrl), title: trackTitle, genre, notes });
        return;
      }
      const res = await fetch("/api/score/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackUrl: normalizeTrackUrl(trackUrl),
          trackTitle,
          genre,
          notes,
          email,
          slug: started?.slug,
          claimToken: started?.claimToken,
        }),
      });
      const data = await res.json().catch(() => null);
      // Fresh-path wall (no pre-started row): submit refused to generate.
      if (data?.sealed) {
        setSubmitting(false);
        setPaywall({ mode: "track", url: normalizeTrackUrl(trackUrl), title: trackTitle, genre, notes });
        return;
      }
      if (!res.ok || !data?.slug) {
        setError(data?.error ?? "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }
      scoreConversions.submitTrack(data.slug);
      if (data.freeReadUsed) {
        // A pre-started row exists (generated before we knew the email) — wall it
        // by slug; unlock opens what's already there.
        setSubmitting(false);
        setPaywall({ mode: "slug", slug: data.slug });
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

  // Resolving the session — hold a spinner so an authenticated user never flashes
  // the signed-out gate before the form.
  if (status === "loading") {
    return (
      <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] flex items-center justify-center`}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }

  // Logged out → gated (the auth panel is already opening via the effect above).
  // This is what sits behind it / shows if they dismiss it. No email-only path.
  if (status === "unauthenticated") {
    return (
      <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase flex flex-col`}>
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
            <Link href="/">
              <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
            </Link>
            <Link href="/" className={`${mono.className} text-[13px] text-white/65 hover:text-white transition-colors`}>
              ← back
            </Link>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center max-w-sm">
            <p className={`${mono.className} text-[12px] text-white/55 mb-3`}>[ submit another track ]</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] mb-4">
              sign in to drop another <span style={{ color: ACCENT }}>track</span>.
            </h1>
            <p className="text-white/65 normal-case leading-relaxed mb-7">
              your reports live in one place when you&apos;re signed in — pick up right where you left
              off.
            </p>
            <button
              onClick={() => openAuth("signup", "/submit-score")}
              className="group inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-[15px] px-6 py-3.5 hover:bg-white transition-colors"
            >
              sign in to continue
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          {FREE_FULL_READ
            ? "Your first full report is free — score, written read, fixes, the lot. After that it's $6.95 a track, or unlimited for $19.95/mo."
            : "An instant, honest read on your track. Free to submit — unlock the full report whenever you like."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="track link" required>
            {!isUrl ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
              >
                <input
                  type="url"
                  value={trackUrl}
                  onChange={(e) => setTrackUrl(e.target.value)}
                  onBlur={() => setTrackUrl((v) => normalizeTrackUrl(v))}
                  onPaste={(e) => {
                    // links pasted without a protocol still get the preview card
                    const text = e.clipboardData.getData("text");
                    const normalized = normalizeTrackUrl(text);
                    if (normalized !== text) {
                      e.preventDefault();
                      setTrackUrl(normalized);
                    }
                  }}
                  placeholder="paste a soundcloud, youtube, bandcamp or mp3 link…"
                  className={inputCls}
                />
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className={`${mono.className} text-[11px] text-white/30`}>or</span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>
                <label
                  className={`${mono.className} mt-3 flex items-center justify-center gap-2 border border-dashed text-[13px] py-3.5 cursor-pointer transition-colors ${
                    dragging
                      ? "border-[#6ee7ff] bg-[#6ee7ff]/10 text-white"
                      : "border-white/20 hover:border-[#6ee7ff] text-white/70 hover:text-white"
                  } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> uploading…</>
                  ) : dragging ? (
                    "drop your mp3 here"
                  ) : (
                    <><Upload className="h-4 w-4" /> upload or drag an mp3 (max 25mb)</>
                  )}
                  <input
                    type="file"
                    accept="audio/mpeg,audio/mp3,.mp3"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </label>
              </div>
            ) : (
              <div
                className="flex items-center gap-4 bg-[#141414] border p-3.5"
                style={{
                  borderColor: !isSupported
                    ? "rgba(248,113,113,0.6)"
                    : meta
                    ? ACCENT
                    : "rgba(255,255,255,0.2)",
                  animation: "cardIn .25s ease",
                }}
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
                  ) : !isSupported ? (
                    <>
                      <p className="text-[15px] font-bold text-red-400 truncate">
                        {blockReason ? "this link won’t work" : "we can’t read this link"}
                      </p>
                      <p className={`${mono.className} text-[12px] text-white/60 mt-0.5 ${blockReason ? "normal-case" : "truncate"}`}>
                        {blockReason ?? SUPPORTED_TRACK_HINT}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[15px] font-bold text-white truncate normal-case">
                        {uploadedName ? "uploaded" : "link added"}
                      </p>
                      <p className={`${mono.className} text-[12px] text-white/60 truncate normal-case mt-0.5`}>
                        {uploadedName || host || "ready to go"}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`${mono.className} text-[11px]`}
                    style={{ color: !isSupported ? "#f87171" : ACCENT }}
                  >
                    {!isSupported ? "✗ unsupported" : metaLoading && !meta ? "reading…" : "✓ ready"}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setTrackUrl(""); setUploadedName(""); }}
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
            <GenreDropdown value={genre} onChange={setGenre} options={GENRES} />
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
            disabled={!isValid || submitting || uploading}
            className="group w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-base py-4 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> opening your report…
              </>
            ) : (
              <>
                get my read — free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
          <p className={`${mono.className} text-center text-[12px] text-white/50 normal-case`}>
            {FREE_FULL_READ
              ? "no card needed · first report free · then $6.95 a track or unlimited"
              : "no card to submit · unlock the full read for $6.95"}
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

      {paywall && (
        <SealedPaywall
          {...(paywall.mode === "slug"
            ? { slug: paywall.slug }
            : {
                track: {
                  url: paywall.url,
                  title: paywall.title,
                  genre: paywall.genre,
                  notes: paywall.notes,
                },
                trackTitle: paywall.title,
              })}
          email={session?.user?.email ?? email}
          dismissHref="/"
        />
      )}

      {/* brief hand-off overlay — the report page owns the real progress now */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/85 backdrop-blur-md">
          <div className="text-center">
            <Loader2 className="h-7 w-7 mx-auto animate-spin" style={{ color: ACCENT }} />
            <p className={`${mono.className} text-[13px] text-white/60 mt-4`}>
              opening your report…
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes ddIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}`}</style>
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

function GenreDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${mono.className} w-full flex items-center justify-between gap-2 bg-[#141414] border px-4 py-3.5 text-[15px] focus:outline-none transition-colors normal-case ${
          open ? "border-[#6ee7ff]" : "border-white/20"
        } ${value ? "text-white" : "text-white/35"}`}
      >
        <span>{value || "pick a genre"}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/45 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute z-20 mt-1.5 w-full max-h-64 overflow-auto border border-white/15 bg-[#141414] shadow-xl shadow-black/50"
          style={{ animation: "ddIn 0.12s ease-out" }}
        >
          {options.map((g) => {
            const selected = g === value;
            return (
              <button
                key={g}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(g);
                  setOpen(false);
                }}
                className={`${mono.className} w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-[14px] normal-case transition-colors ${
                  selected
                    ? "text-[#6ee7ff] bg-[#6ee7ff]/10"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                {g}
                {selected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
