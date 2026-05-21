"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateTrackUrl, fetchTrackMetadata, detectSource } from "@/lib/metadata";
import { ArrowRight, ArrowLeft, Music, Loader2, Link2, Check } from "lucide-react";
import { Logo } from "@/components/ui/logo";

type SourceType = "SOUNDCLOUD" | "BANDCAMP" | "YOUTUBE" | "UPLOAD" | null;

export default function OnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [step, setStep] = useState(1);
  const [artistName, setArtistName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [trackUrl, setTrackUrl] = useState("");
  const [trackUrlError, setTrackUrlError] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [trackSourceType, setTrackSourceType] = useState<SourceType>(null);
  const [isLoadingTrackMeta, setIsLoadingTrackMeta] = useState(false);
  const [trackArtworkUrl, setTrackArtworkUrl] = useState<string | null>(null);
  const [isSubmittingTrack, setIsSubmittingTrack] = useState(false);

  const handleTrackUrlChange = useCallback(async (value: string) => {
    setTrackUrl(value);
    setTrackUrlError("");
    setTrackSourceType(detectSource(value) as SourceType);
    if (!value.trim()) return;
    const validation = validateTrackUrl(value);
    if (!validation.valid) { setTrackUrlError(validation.error || "Invalid URL"); return; }
    setIsLoadingTrackMeta(true);
    try {
      const metadata = await fetchTrackMetadata(value);
      if (metadata?.title) setTrackTitle(metadata.title);
      setTrackArtworkUrl(metadata?.artworkUrl ?? null);
    } catch { /* best-effort */ } finally { setIsLoadingTrackMeta(false); }
  }, []);

  const saveProfile = async () => {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistName: artistName.trim(), genreIds: [], completedOnboarding: true }),
    });
    if (!res.ok) {
      if (res.status === 401) { await signOut({ callbackUrl: "/signup" }); return false; }
      if (res.status === 409) {
        const patchRes = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artistName: artistName.trim(), genreIds: [], completedOnboarding: true }),
        });
        if (!patchRes.ok) { const d = await patchRes.json().catch(() => null); setError((d as any)?.error || "Something went wrong"); return false; }
      } else { const d = await res.json().catch(() => null); setError((d as any)?.error || "Something went wrong"); return false; }
    }
    return true;
  };

  const handleComplete = async () => {
    setError(""); setIsLoading(true);
    try {
      const ok = await saveProfile();
      if (!ok) { setIsLoading(false); return; }
      await updateSession();
      router.push("/dashboard"); router.refresh();
    } catch { setError("Something went wrong. Please try again."); setIsLoading(false); }
  };

  const handleCompleteWithTrack = async () => {
    setError(""); setIsSubmittingTrack(true);
    try {
      const ok = await saveProfile();
      if (!ok) { setIsSubmittingTrack(false); return; }
      const trackRes = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: trackUrl, title: trackTitle.trim() || "My Track", artworkUrl: trackArtworkUrl || undefined, genreIds: [] }),
      });
      if (!trackRes.ok) {
        const trackErr = await trackRes.json().catch(() => null);
        setError((trackErr as { error?: string })?.error || "Couldn't add your track. Try a different link, or tap \"I'll do this later\".");
        setIsSubmittingTrack(false); await updateSession(); return;
      }
      const trackData = await trackRes.json();
      await fetch(`/api/tracks/${trackData.id}/request-reviews`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desiredReviews: 1 }),
      });
      await updateSession();
      router.push("/dashboard?welcome=1"); router.refresh();
    } catch { setError("Something went wrong. Please try again."); setIsSubmittingTrack(false); }
  };

  const hasValidTrackUrl = trackUrl.trim() !== "" && !trackUrlError && !isLoadingTrackMeta && trackSourceType !== null;

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col px-4 sm:px-6 py-10">

      {/* Logo row */}
      <div className="flex justify-center mb-12">
        <Logo />
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-md">

          {/* Progress bar */}
          <div className="flex gap-1.5 mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-black" : "bg-black/10"}`} />
            ))}
          </div>

          {/* ── STEP 1: Artist name ──────────────────────────── */}
          {step === 1 && (
            <div>
              <h1 className="text-5xl font-black tracking-tighter text-black leading-[0.9] mb-3">
                What&apos;s your<br />artist name?
              </h1>
              <p className="text-sm text-black/40 font-medium mb-8">
                This is how you&apos;ll appear to other artists.
              </p>

              <input
                type="text"
                placeholder="Your artist or project name"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && artistName.trim()) { setError(""); setStep(2); } }}
                autoFocus
                className="w-full border-0 border-b-2 border-black/20 bg-transparent px-0 py-3 text-2xl font-black text-black placeholder:text-black/20 focus:border-black focus:outline-none transition-colors mb-8"
              />

              {error && <div className="bg-red-500 text-white text-sm px-4 py-3 font-bold rounded-xl mb-4">{error}</div>}

              <Button
                className="w-full h-13 bg-black text-white hover:bg-neutral-800 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl text-base py-3.5"
                disabled={!artistName.trim()}
                onClick={() => { setError(""); setStep(2); }}
              >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* ── STEP 2: How it works ─────────────────────────── */}
          {step === 2 && (
            <div>
              <h1 className="text-5xl font-black tracking-tighter text-black leading-[0.9] mb-3">
                Here&apos;s how<br />it works.
              </h1>
              <p className="text-sm text-black/40 font-medium mb-8">
                Real feedback from real artists. Simple.
              </p>

              <div className="space-y-3 mb-8">
                <div className="bg-lime-400 border-2 border-black rounded-2xl px-5 py-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-4">
                  <span className="text-4xl font-black text-black leading-none w-8 flex-shrink-0">1</span>
                  <div>
                    <p className="text-base font-black text-black leading-tight">You start with 1 free credit.</p>
                    <p className="text-xs text-black/60 font-medium mt-1">No reviewing needed yet — use it straight away.</p>
                  </div>
                </div>

                <div className="bg-neutral-900 border-2 border-black rounded-2xl px-5 py-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-4">
                  <span className="text-4xl font-black text-white leading-none w-8 flex-shrink-0">2</span>
                  <div>
                    <p className="text-base font-black text-white leading-tight">Review others to earn more.</p>
                    <p className="text-xs text-white/40 font-medium mt-1">Each review takes ~3 mins. +1 credit per review.</p>
                  </div>
                </div>

                <div className="bg-white border-2 border-black rounded-2xl px-5 py-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.12)] flex items-start gap-4">
                  <span className="text-4xl font-black text-black leading-none w-8 flex-shrink-0">3</span>
                  <div>
                    <p className="text-base font-black text-black leading-tight">Spend credits to get reviewed.</p>
                    <p className="text-xs text-black/40 font-medium mt-1">1 credit = 1 structured review on your track.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors">
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
                <Button
                  className="flex-1 h-13 bg-black text-white hover:bg-neutral-800 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl text-base py-3.5"
                  onClick={() => { setError(""); setStep(3); }}
                >
                  Submit your first track <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: First track ──────────────────────────── */}
          {step === 3 && (
            <div>
              <h1 className="text-5xl font-black tracking-tighter text-black leading-[0.9] mb-3">
                Drop your<br />first track in.
              </h1>
              <p className="text-sm text-black/40 font-medium mb-8">
                SoundCloud, YouTube, or Bandcamp — we&apos;ll queue it for review straight away.
              </p>

              <div className="space-y-4">
                {/* Input card */}
                <div className="bg-white border-2 border-black rounded-2xl p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/25" />
                    <Input
                      placeholder="Paste your track link here"
                      value={trackUrl}
                      onChange={(e) => handleTrackUrlChange(e.target.value)}
                      className={`pl-9 h-12 rounded-xl border-2 bg-white focus:border-black focus:outline-none text-base ${trackUrlError ? "border-red-400" : "border-black/20"}`}
                      autoFocus
                    />
                  </div>

                  {trackUrlError && <p className="text-sm text-red-500 font-bold">{trackUrlError}</p>}

                  {isLoadingTrackMeta && (
                    <div className="flex items-center gap-2 text-sm text-black/40 font-medium">
                      <Loader2 className="h-4 w-4 animate-spin" /> Getting track info...
                    </div>
                  )}

                  {trackUrl && !trackUrlError && !isLoadingTrackMeta && trackSourceType && (
                    <div className="bg-[#faf7f2] border-2 border-black/20 rounded-xl p-3 flex items-center gap-3">
                      {trackArtworkUrl ? (
                        <img src={trackArtworkUrl} alt="" className="h-12 w-12 rounded-xl object-cover flex-shrink-0 border-2 border-black/10" />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-lime-400 border-2 border-black flex items-center justify-center flex-shrink-0">
                          <Music className="h-5 w-5 text-black" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-black truncate text-sm">{trackTitle || "Track detected"}</p>
                        <p className="text-[10px] font-black uppercase tracking-wider text-black/35 mt-0.5">
                          {trackSourceType === "SOUNDCLOUD" ? "SoundCloud" : trackSourceType === "YOUTUBE" ? "YouTube" : trackSourceType === "BANDCAMP" ? "Bandcamp" : "Ready"}
                        </p>
                      </div>
                      <Check className="h-5 w-5 text-lime-500 flex-shrink-0" />
                    </div>
                  )}
                </div>

                {/* Credit callout */}
                <div className="bg-lime-400 border-2 border-black rounded-2xl px-5 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-sm font-black text-black">Your 1 free credit gets used here.</p>
                  <p className="text-xs text-black/60 font-medium mt-0.5">You&apos;ll get 1 real artist review back.</p>
                </div>

                {error && <div className="bg-red-500 text-white rounded-xl px-4 py-3 text-sm font-bold">{error}</div>}

                <Button
                  className="w-full bg-black text-white hover:bg-neutral-800 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl text-base py-3.5 h-13"
                  disabled={!hasValidTrackUrl || isSubmittingTrack}
                  isLoading={isSubmittingTrack}
                  onClick={handleCompleteWithTrack}
                >
                  Submit &amp; Get Reviewed <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <div className="flex items-center justify-between">
                  <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors">
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="text-xs text-black/25 hover:text-black/50 font-medium transition-colors"
                  >
                    {isLoading ? "Setting up..." : "I'll do this later"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
