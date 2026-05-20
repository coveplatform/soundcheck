"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/ui/logo";
import { ScoreRing } from "@/components/score/score-ring";
import {
  ArrowRight,
  Lock,
  Music,
  CheckCircle2,
  Clock,
} from "lucide-react";

const GENRES = [
  "Electronic",
  "Hip-Hop",
  "Pop",
  "R&B / Soul",
  "Rock",
  "Indie",
  "Lo-Fi",
  "Dance / Club",
  "Ambient",
  "Singer-Songwriter",
  "Metal",
  "Jazz",
  "Classical",
  "Country",
  "Latin",
  "Other",
];

export default function SubmitScorePage() {
  const { data: session } = useSession();

  const [trackUrl, setTrackUrl] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValid = trackUrl.trim().length > 0 && email.trim().length > 0 && genre.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/score/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackUrl, trackTitle, genre, notes, email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as any)?.error ?? "Something went wrong");
        setSubmitting(false);
        return;
      }
      if ((data as any)?.url) {
        window.location.href = (data as any).url;
      }
    } catch {
      setError("Failed to start checkout. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]" style={{ paddingTop: "56px" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8f5]/90 backdrop-blur-sm border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <Link
              href="/score"
              className="text-xs font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* ── LEFT: Form ─────────────────────────── */}
          <div>
            <div className="mb-8">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-black/25 mb-2">
                Track Score
              </p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.05]">
                Submit your track.
              </h1>
              <p className="mt-3 text-neutral-600 text-base">
                5 real listeners. One score. $9. Results in 24 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Track URL */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-black/40 mb-2">
                  Track Link *
                </label>
                <div className="relative">
                  <Music className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/25" />
                  <input
                    type="url"
                    value={trackUrl}
                    onChange={(e) => setTrackUrl(e.target.value)}
                    placeholder="SoundCloud, Spotify, YouTube or direct URL"
                    required
                    className="w-full pl-10 pr-4 py-3.5 bg-white border-2 border-black/8 rounded-xl text-sm font-medium text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5">
                  Works with SoundCloud, Spotify, YouTube, Bandcamp, or a direct
                  .mp3 link
                </p>
              </div>

              {/* Track title */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-black/40 mb-2">
                  Track Title <span className="font-medium normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  placeholder="e.g. Midnight Drive"
                  className="w-full px-4 py-3.5 bg-white border-2 border-black/8 rounded-xl text-sm font-medium text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-black/40 mb-2">
                  Genre *
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-white border-2 border-black/8 rounded-xl text-sm font-medium text-neutral-950 focus:outline-none focus:border-purple-400 transition-colors appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                    paddingRight: "38px",
                  }}
                >
                  <option value="">Select a genre</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              {!session?.user?.email && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-black/40 mb-2">
                    Email for delivery *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3.5 bg-white border-2 border-black/8 rounded-xl text-sm font-medium text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1.5">
                    Your report will be emailed here within 24 hours
                  </p>
                </div>
              )}

              {session?.user?.email && (
                <div className="flex items-center gap-2.5 bg-purple-50 border border-purple-200/60 rounded-xl px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <p className="text-sm text-purple-700">
                    Report delivered to{" "}
                    <span className="font-black">{session.user.email}</span>
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-black/40 mb-2">
                  Notes for reviewers{" "}
                  <span className="font-medium normal-case">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. First full release, targeting streaming playlists. Focus on the drop and whether the intro is too long."
                  rows={3}
                  className="w-full px-4 py-3.5 bg-white border-2 border-black/8 rounded-xl text-sm font-medium text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-purple-400 transition-colors resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl font-medium">
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 font-black text-base py-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Setting up checkout...
                    </>
                  ) : (
                    <>
                      Pay $9 and Get My Score
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="mt-3 text-xs text-neutral-400 flex items-center justify-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Secure payment via Stripe · No subscription · Cancel anytime
                  isn&apos;t a thing — it&apos;s one charge.
                </p>
              </div>
            </form>
          </div>

          {/* ── RIGHT: What you get ─────────────────── */}
          <div className="lg:pt-16">
            {/* Score ring preview */}
            <div className="bg-neutral-950 rounded-2xl p-8 flex flex-col items-center gap-5 mb-5">
              <ScoreRing score={null} size="lg" dark animate={false} />
              <div className="text-center">
                <p className="text-sm font-black text-white/60">
                  Your score is waiting
                </p>
                <p className="text-xs text-white/30 mt-1">
                  Submit your track to find out where you stand
                </p>
              </div>
            </div>

            {/* What's included */}
            <div className="bg-white rounded-2xl border border-black/6 p-6">
              <p className="text-[11px] font-black uppercase tracking-wider text-black/30 mb-4">
                What you get
              </p>
              <div className="space-y-3">
                {[
                  "MixReflect Score out of 100",
                  "Percentile rank vs. all tracks",
                  "5 reviewer scores across 5 dimensions",
                  "Individual reviewer quotes",
                  "AI synthesis of findings",
                  "Top 2–3 priority improvements",
                  "Permanent shareable report link",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span className="text-sm text-neutral-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-black/6 flex items-center gap-2 text-sm text-neutral-500">
                <Clock className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span>
                  Delivered within{" "}
                  <span className="font-black text-neutral-800">24 hours</span>
                </span>
              </div>
            </div>

            {/* Sample link */}
            <div className="mt-4 text-center">
              <Link
                href="/report/demo"
                className="text-sm text-neutral-500 hover:text-purple-600 transition-colors font-medium"
              >
                See a sample report first →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
