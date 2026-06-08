"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { posts } from "@/lib/blog-posts";
import { ArrowRight, ArrowUpRight, Music, Loader2, X } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

const ACCENT = "#6ee7ff";

// ── Real brand marks (official paths, monochrome) ───────────────────

const BRANDS: { name: string; path: string }[] = [
  {
    name: "spotify",
    path: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z",
  },
  {
    name: "apple music",
    path: "M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z",
  },
  {
    name: "soundcloud",
    path: "M1 14.5c.28 0 .5-.9.5-2s-.22-2-.5-2-.5.9-.5 2 .22 2 .5 2zm2 1c.28 0 .5-1.34.5-3s-.22-3-.5-3-.5 1.34-.5 3 .22 3 .5 3zm2 .5c.28 0 .5-1.79.5-4s-.22-4-.5-4-.5 1.79-.5 4 .22 4 .5 4zm2 0c.28 0 .5-2.01.5-4.5S7.78 7 7.5 7s-.5 2.01-.5 4.5.22 4.5.5 4.5zm2 0c.28 0 .5-2.24.5-5s-.22-5-.5-5-.5 2.24-.5 5 .22 5 .5 5zm12.5 0a3.5 3.5 0 0 0 0-7c-.34 0-.67.05-.98.14A5.5 5.5 0 0 0 11 7.5c0 .3.03.6.08.88-.18-.08-.38-.13-.58-.13-.28 0-.5 2.24-.5 5s.22 4.27.5 4.27h11z",
  },
  {
    name: "youtube",
    path: "M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.53A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.53 9.38.53 9.38.53s7.5 0 9.38-.53a3 3 0 0 0 2.12-2.12c.34-1.9.5-3.84.5-5.8 0-1.96-.16-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z",
  },
  { name: "bandcamp", path: "M0 18.75l7.437-13.5H24l-7.437 13.5H0z" },
];

// ── Assignment sequence ─────────────────────────────────────────────

const STEPS = [
  "fetching your track",
  "mapping the energy curve",
  "checking the hook + structure",
  "weighing it across 5 dimensions",
  "writing your honest read",
  "finalising your score",
];

const CHECKS: { t: string; d: string }[] = [
  { t: "hook strength", d: "does it grab in the first 15 seconds, or do people wait too long for the good part?" },
  { t: "listener retention", d: "where attention holds, and where people are most likely to start drifting." },
  { t: "production quality", d: "does it sound pro? we listen for a muddy low end, harsh highs, or a vocal that's getting buried." },
  { t: "emotional impact", d: "does it actually make people feel something, or does it wash over them?" },
  { t: "structure & pacing", d: "intro length, drop timing, and whether the energy arc earns its payoff." },
  { t: "release readiness", d: "the bottom line — is this ready to put out, or is it one fix away?" },
];

type Phase = "idle" | "running" | "done";
type Meta = { title: string; artist: string | null; artworkUrl: string | null };

export default function ScorePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [trackUrl, setTrackUrl] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  // ── debounced track preview ──
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
          setMeta({
            title: data.title,
            artist: data.artist ?? null,
            artworkUrl: data.artworkUrl ?? null,
          });
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

  // ── drive the assignment log ──
  useEffect(() => {
    if (phase !== "running") return;
    if (step >= STEPS.length) {
      const t = setTimeout(() => setPhase("done"), 560);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 600 + Math.random() * 320);
    return () => clearTimeout(t);
  }, [phase, step]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [step, phase]);

  // ── esc closes the modal ──
  useEffect(() => {
    if (phase === "idle") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const cancel = () => {
    setPhase("idle");
    setStep(0);
    setBusy(false);
  };

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackUrl.trim()) {
      setError("paste a link to your track first");
      return;
    }
    setError("");
    setStep(0);
    setPhase("running");
  };

  const seeResults = async () => {
    if (busy) return;
    setBusy(true);
    const title = meta?.title?.trim() || "";
    const finish =
      `/score/finish?u=${encodeURIComponent(trackUrl.trim())}` +
      (title ? `&t=${encodeURIComponent(title)}` : "");
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(finish)}`);
      return;
    }
    try {
      const res = await fetch("/api/score/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackUrl: trackUrl.trim(), trackTitle: title || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (data?.slug) {
        router.push(`/report/${data.slug}`);
        return;
      }
      setError(data?.error ?? "something broke. try again.");
      setBusy(false);
    } catch {
      setError("something broke. try again.");
      setBusy(false);
    }
  };

  const handleSubscribe = async (plan: "monthly" | "annual" = "monthly") => {
    if (!session?.user?.email) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/score#pricing")}`);
      return;
    }
    try {
      const res = await fetch("/api/score/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: "/reports", plan }),
      });
      const data = await res.json().catch(() => null);
      if (data?.alreadySubscribed) {
        router.push("/reports");
        return;
      }
      if (data?.url) window.location.href = data.url;
    } catch {
      /* no-op */
    }
  };

  const isUrl = /^https?:\/\//i.test(trackUrl.trim());
  let host = "";
  try {
    host = new URL(trackUrl.trim()).hostname.replace(/^www\./, "");
  } catch {
    /* not a url yet */
  }

  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase scroll-smooth`}
    >
      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>

      {/* grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0 mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── NAV ── */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="shrink-0">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <nav
            className={`${mono.className} hidden md:flex items-center gap-7 text-[13px] text-white/55`}
          >
            <a href="#product" className="hover:text-white transition-colors">product</a>
            <a href="#checks" className="hover:text-white transition-colors">what we check</a>
            <a href="#pricing" className="hover:text-white transition-colors">pricing</a>
            <Link href="/blog" className="hover:text-white transition-colors">the drop</Link>
          </nav>
          <div className={`${mono.className} flex items-center gap-5 text-[13px] shrink-0`}>
            <Link href="/reports" className="hidden sm:inline text-white/55 hover:text-white transition-colors">
              my reports
            </Link>
            <Link href="/login" className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 transition-colors">
              log in
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section id="top" className="relative z-10 max-w-5xl mx-auto px-5 pt-16 sm:pt-24 pb-16 scroll-mt-16">
        <p className={`${mono.className} text-[13px] tracking-tight text-white/40 mb-7`}>
          [ honest feedback before you release ]
        </p>
        <h1 className="text-[14vw] sm:text-[92px] leading-[0.88] tracking-[-0.04em] font-extrabold">
          your friends say
          <br />
          it&apos;s fire. is it
          <br />
          <span style={{ color: ACCENT }}>actually</span>?
        </h1>
        <p className="text-lg sm:text-xl text-white/55 mt-8 max-w-xl normal-case">
          Find out if your track actually lands — an honest, instant read on
          what&apos;s working, where it loses people, and the exact fixes that
          matter, before you put it out.
        </p>

        {/* paste box + preview card */}
        <form onSubmit={start} className="mt-10 max-w-2xl">
          {!isUrl ? (
            <input
              type="url"
              value={trackUrl}
              onChange={(e) => setTrackUrl(e.target.value)}
              placeholder="paste your track link…"
              className={`${mono.className} w-full bg-[#141414] border border-white/15 focus:border-[#6ee7ff] px-5 py-4 text-[15px] text-white placeholder:text-white/30 focus:outline-none transition-colors normal-case`}
            />
          ) : (
            <div
              className="flex items-center gap-4 bg-[#141414] border p-3.5"
              style={{
                borderColor: meta ? ACCENT : "rgba(255,255,255,0.15)",
                animation: "cardIn .25s ease",
              }}
            >
              <div className="w-16 h-16 bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                {meta?.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={meta.artworkUrl} alt="" className="w-full h-full object-cover" />
                ) : metaLoading ? (
                  <Loader2 className="h-5 w-5 text-white/40 animate-spin" />
                ) : (
                  <Music className="h-5 w-5 text-white/40" />
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
                    <p className="text-[16px] font-bold text-white truncate normal-case">
                      {meta.title}
                    </p>
                    <p className={`${mono.className} text-[12px] text-white/45 truncate normal-case mt-0.5`}>
                      {meta.artist ? `by ${meta.artist}` : "track found"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[15px] font-bold text-white truncate normal-case">
                      link added
                    </p>
                    <p className={`${mono.className} text-[12px] text-white/45 truncate normal-case mt-0.5`}>
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
                  className="text-white/35 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!isUrl}
            className={`${
              isUrl
                ? "bg-[#6ee7ff] text-black hover:bg-white"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            } group mt-3 w-full inline-flex items-center justify-center gap-2 font-extrabold text-base px-7 py-4 transition-colors`}
          >
            get feedback
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {error && (
            <p className={`${mono.className} text-[13px] text-red-400 mt-3`}>{error}</p>
          )}
        </form>

        {/* trust tags */}
        <div className={`${mono.className} mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/50`}>
          <span style={{ color: ACCENT }}>instant</span>
          <span className="text-white/20">·</span>
          <span>unbiased</span>
          <span className="text-white/20">·</span>
          <span>audio-aware</span>
          <span className="text-white/20">·</span>
          <span>no waiting on anyone</span>
        </div>

        {/* trusted-by brand strip */}
        <div className="mt-14 pt-8 border-t border-white/10">
          <p className={`${mono.className} text-[11px] text-white/30 mb-5`}>
            works with everything you release on
          </p>
          <div className="flex flex-wrap items-center gap-x-9 gap-y-5 text-white/45">
            {BRANDS.map((b) => (
              <div key={b.name} className="flex items-center gap-2 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d={b.path} />
                </svg>
                <span className={`${mono.className} text-[15px] font-medium`}>{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="product" className="relative z-10 border-t border-white/10 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-12">
            how it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {[
              {
                n: "01",
                t: "drop your link",
                d: "soundcloud, spotify, youtube, a raw mp3 — whatever. free, no card, 60 seconds.",
              },
              {
                n: "02",
                t: "we listen, closely",
                d: "we analyze the actual audio — energy curve, structure, hook — and read it like a sharp first listener, not a yes-man.",
              },
              {
                n: "03",
                t: "get the verdict",
                d: "a score, your percentile, takes from every angle, and the 3 fixes that move the needle.",
              },
            ].map((s) => (
              <div key={s.n} className="bg-[#0a0a0a] p-7">
                <p className={`${mono.className} text-[13px]`} style={{ color: ACCENT }}>{s.n}</p>
                <h3 className="text-xl font-extrabold mt-4 mb-2">{s.t}</h3>
                <p className="text-white/65 text-[15px] leading-relaxed normal-case">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE CHECK ── */}
      <section id="checks" className="relative z-10 border-t border-white/10 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <p className={`${mono.className} text-[13px] text-white/55 mb-2`}>[ what we check ]</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            every track, graded on 6 things
          </h2>
          <p className="text-white/65 text-lg mb-12 normal-case max-w-lg">
            Our AI listens across the things that actually decide whether a
            track lands — and grades each one.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {CHECKS.map((c, i) => (
              <div
                key={c.t}
                className="group bg-[#0a0a0a] p-6 flex flex-col hover:bg-[#0e0e0e] transition-colors"
              >
                <p className={`${mono.className} text-[12px]`} style={{ color: ACCENT }}>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="text-lg font-extrabold mt-3 mb-2">{c.t}</h3>
                <p className="text-white/65 text-[14px] leading-relaxed normal-case flex-1">
                  {c.d}
                </p>
                <a
                  href="#top"
                  className={`${mono.className} mt-5 inline-flex items-center gap-1 text-[12px] text-white/35 group-hover:text-[#6ee7ff] transition-colors`}
                >
                  check yours →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative z-10 border-t border-white/10 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <p className={`${mono.className} text-[13px] text-white/55 mb-2`}>[ pricing ]</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            one plan. no noise.
          </h2>
          <p className="text-white/65 text-lg mb-12 normal-case max-w-md">
            Submitting and your teaser are always free. Unlock one track for $6.95,
            or go unlimited if you&apos;re dropping a lot.
          </p>
          <div className="grid md:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {/* free */}
            <div className="bg-[#0a0a0a] p-8">
              <p className={`${mono.className} text-[13px] text-white/40`}>free</p>
              <p className="text-5xl font-extrabold mt-3">$0</p>
              <p className={`${mono.className} text-white/40 text-[13px] mt-1 normal-case`}>
                no card needed
              </p>
              <ul className={`${mono.className} mt-7 space-y-2.5 text-[13.5px] text-white/55 normal-case`}>
                {["your resonance score out of 100", "verdict + 5-dimension breakdown", "every reaction headline", "the three things to fix"].map((x) => (
                  <li key={x} className="flex gap-2"><span style={{ color: ACCENT }}>+</span>{x}</li>
                ))}
              </ul>
              <a
                href="#top"
                className="mt-7 block w-full text-center bg-white/10 hover:bg-white/20 text-white font-extrabold py-3.5 transition-colors"
              >
                get my read →
              </a>
            </div>
            {/* per track */}
            <div className="bg-[#0a0a0a] p-8">
              <p className={`${mono.className} text-[13px] text-white/40`}>per track</p>
              <p className="text-5xl font-extrabold mt-3">
                $6.95<span className="text-lg text-white/40 font-medium"> once</span>
              </p>
              <p className={`${mono.className} text-white/40 text-[13px] mt-1 normal-case`}>
                one track · yours forever
              </p>
              <ul className={`${mono.className} mt-7 space-y-2.5 text-[13.5px] text-white/70 normal-case`}>
                {["everything in free", "every reaction in full", "the complete written read", "the detail behind all three fixes"].map((x) => (
                  <li key={x} className="flex gap-2"><span style={{ color: ACCENT }}>+</span>{x}</li>
                ))}
              </ul>
              <a
                href="#top"
                className="mt-7 block w-full text-center bg-white/10 hover:bg-white/20 text-white font-extrabold py-3.5 transition-colors"
              >
                start free →
              </a>
            </div>
            {/* unlimited */}
            <div className="bg-[#0a0a0a] p-8 relative">
              <div className="absolute top-0 left-0 h-1 w-full" style={{ background: ACCENT }} />
              <p className={`${mono.className} text-[13px]`} style={{ color: ACCENT }}>unlimited</p>
              <p className="text-5xl font-extrabold mt-3">
                $19.95<span className="text-lg text-white/40 font-medium">/mo</span>
              </p>
              <p className={`${mono.className} text-white/40 text-[13px] mt-1 normal-case`}>
                or $143.40/yr · every track auto-unlocked
              </p>
              <ul className={`${mono.className} mt-7 space-y-2.5 text-[13.5px] text-white/70 normal-case`}>
                {["everything in per-track", "unlock every track you submit", "no $6.95 per report", "your dashboard + history", "cancel anytime — unlocks stay"].map((x) => (
                  <li key={x} className="flex gap-2"><span style={{ color: ACCENT }}>+</span>{x}</li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe("monthly")}
                className="mt-7 block w-full text-center bg-[#6ee7ff] text-black font-extrabold py-3.5 hover:bg-white transition-colors"
              >
                go unlimited — $19.95/mo →
              </button>
              <button
                onClick={() => handleSubscribe("annual")}
                className={`${mono.className} mt-2 block w-full text-center text-[12px] text-white/45 hover:text-white transition-colors`}
              >
                or pay yearly — $143.40/yr (save 40%)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY IT'S DIFFERENT ── */}
      <section id="why" className="relative z-10 border-t border-white/10 bg-[#6ee7ff] text-black lowercase scroll-mt-16">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className={`${mono.className} text-[13px] text-black/50 mb-5`}>
                [ why it hits different ]
              </p>
              <h2 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.03em] leading-[0.9]">
                no friends.
                <br />
                no bias. no wait.
              </h2>
              <p className="text-black/70 text-lg mt-6 max-w-md normal-case">
                Your friends will always say it&apos;s great. This won&apos;t.
                It&apos;s an honest read on your track in seconds — grounded in
                the actual audio, not vibes.
              </p>
              <a
                href="#top"
                className="group mt-8 inline-flex items-center gap-2 bg-black text-[#6ee7ff] font-extrabold text-base px-8 py-4 hover:bg-[#141414] transition-colors"
              >
                get my read
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
            <div className={`${mono.className} grid grid-cols-1 gap-px bg-black/15 border border-black/15`}>
              {[
                ["instant", "your read is ready in seconds, not days"],
                ["audio-aware", "reads the actual audio — energy arc, structure, dynamics"],
                ["brutally honest", "no ego-stroking, no friends being nice"],
              ].map(([t, d]) => (
                <div key={t} className="bg-[#6ee7ff] p-5">
                  <p className="text-base font-bold text-black">{t}</p>
                  <p className="text-[13px] text-black/60 mt-1 normal-case">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LATEST FROM THE DROP ── */}
      <section className="relative z-10 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <p className={`${mono.className} text-[13px] text-white/55 mb-2`}>[ the drop ]</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">latest reads</h2>
            </div>
            <Link
              href="/blog"
              className={`${mono.className} text-[13px] text-white/55 hover:text-white transition-colors shrink-0`}
            >
              all posts →
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {posts.slice(0, 3).map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group bg-[#0a0a0a] p-6 hover:bg-[#0e0e0e] transition-colors flex flex-col"
              >
                <div className={`${mono.className} flex items-center gap-2 mb-3 text-[11px]`}>
                  <span style={{ color: ACCENT }}>{p.category.toLowerCase()}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-white/40">{p.date}</span>
                </div>
                <h3 className="text-lg font-extrabold tracking-tight leading-snug group-hover:text-[#6ee7ff] transition-colors mb-2">
                  {p.title}
                </h3>
                <p className="text-white/45 text-[13.5px] leading-relaxed normal-case line-clamp-2 flex-1">
                  {p.excerpt}
                </p>
                <span className={`${mono.className} mt-4 inline-flex items-center gap-1 text-[12px] text-white/35 group-hover:text-white transition-colors`}>
                  {p.readTime} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/10">
        <div className={`${mono.className} max-w-5xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-white/40`}>
          <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-6" />
          <div className="flex items-center gap-6">
            <Link href="/report/demo" className="hover:text-white transition-colors">sample report</Link>
            <Link href="/terms" className="hover:text-white transition-colors">terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">privacy</Link>
          </div>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>

      {/* ── ASSIGNMENT MODAL (stays in place, page behind) ── */}
      {phase !== "idle" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/85 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) cancel();
          }}
        >
          <div className="w-full max-w-lg bg-[#0e0e0e] border border-white/15 p-7 relative">
            {phase !== "done" && (
              <button
                onClick={cancel}
                className={`${mono.className} absolute top-4 right-4 inline-flex items-center gap-1 text-[12px] text-white/40 hover:text-white transition-colors`}
              >
                <X className="h-3.5 w-3.5" /> esc
              </button>
            )}

            <p className={`${mono.className} text-[13px] text-white/40 mb-3`}>
              {phase === "done" ? "[ analysis complete ]" : "[ analyzing your track… ]"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-7 lowercase">
              {phase === "done" ? (
                <>your read is <span style={{ color: ACCENT }}>ready</span>.</>
              ) : (
                <>reading your track…</>
              )}
            </h2>

            <div
              ref={logRef}
              className={`${mono.className} bg-[#080808] border border-white/12 p-5 text-[13.5px] leading-7 max-h-[260px] overflow-y-auto`}
            >
              {STEPS.map((s, i) => {
                const state =
                  i < step || phase === "done" ? "done" : i === step ? "active" : "pending";
                return (
                  <div
                    key={s}
                    className={
                      state === "pending"
                        ? "text-white/20"
                        : state === "active"
                        ? "text-white"
                        : "text-white/55"
                    }
                  >
                    <span style={{ color: state === "pending" ? undefined : ACCENT }}>
                      {state === "done" ? "✓" : state === "active" ? "▸" : "·"}
                    </span>{" "}
                    {s}
                    {state === "active" && (
                      <span className="inline-block w-2 h-4 ml-1 align-middle bg-[#6ee7ff] animate-pulse" />
                    )}
                  </div>
                );
              })}
              {phase === "done" && (
                <div className="text-white mt-2 pt-2 border-t border-white/10">
                  <span style={{ color: ACCENT }}>✓</span> done · your read is ready
                </div>
              )}
            </div>

            <div className="mt-6">
              {phase === "done" ? (
                <>
                  <button
                    onClick={seeResults}
                    disabled={busy}
                    className="group w-full inline-flex items-center justify-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-base px-8 py-4 hover:bg-white transition-colors disabled:opacity-60"
                  >
                    {busy ? "opening…" : "see results"}
                    {!busy && <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
                  </button>
                  {!session?.user && (
                    <p className={`${mono.className} text-[12px] text-white/35 mt-3 text-center`}>
                      quick log in to keep your report
                    </p>
                  )}
                  {error && (
                    <p className={`${mono.className} text-[13px] text-red-400 mt-3 text-center`}>{error}</p>
                  )}
                </>
              ) : (
                <p className={`${mono.className} text-[13px] text-white/40`}>hang tight…</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
