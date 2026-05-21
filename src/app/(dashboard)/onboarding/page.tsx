"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateTrackUrl, fetchTrackMetadata, detectSource } from "@/lib/metadata";
import {
  ArrowRight, ArrowLeft, Music, Loader2,
  Link2, Check,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

type SourceType = "SOUNDCLOUD" | "BANDCAMP" | "YOUTUBE" | "UPLOAD" | null;

export default function OnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [step, setStep] = useState(1);
  const [artistName, setArtistName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Step 2: track submission
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
    if (!validation.valid) {
      setTrackUrlError(validation.error || "Invalid URL");
      return;
    }

    setIsLoadingTrackMeta(true);
    try {
      const metadata = await fetchTrackMetadata(value);
      if (metadata?.title) setTrackTitle(metadata.title);
      setTrackArtworkUrl(metadata?.artworkUrl ?? null);
    } catch {
      // best-effort
    } finally {
      setIsLoadingTrackMeta(false);
    }
  }, []);

  const saveProfile = async () => {
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistName: artistName.trim(), genreIds: [], completedOnboarding: true }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        await signOut({ callbackUrl: "/signup" });
        return false;
      }
      if (response.status === 409) {
        const updateRes = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artistName: artistName.trim(), genreIds: [], completedOnboarding: true }),
        });
        if (!updateRes.ok) {
          const d = await updateRes.json().catch(() => null);
          setError((d as any)?.error || "Something went wrong");
          return false;
        }
      } else {
        const d = await response.json().catch(() => null);
        setError((d as any)?.error || "Something went wrong");
        return false;
      }
    }
    return true;
  };

  // Skip track — just save profile
  const handleComplete = async () => {
    setError("");
    setIsLoading(true);
    try {
      const ok = await saveProfile();
      if (!ok) { setIsLoading(false); return; }
      await updateSession();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  // Save profile + submit track
  const handleCompleteWithTrack = async () => {
    setError("");
    setIsSubmittingTrack(true);
    try {
      const ok = await saveProfile();
      if (!ok) { setIsSubmittingTrack(false); return; }

      const trackRes = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: trackUrl,
          title: trackTitle.trim() || "My Track",
          artworkUrl: trackArtworkUrl || undefined,
          genreIds: [],
        }),
      });

      if (!trackRes.ok) {
        const trackErr = await trackRes.json().catch(() => null);
        setError((trackErr as { error?: string })?.error || "Couldn't add your track. Try a different link, or tap \"I'll do this later\".");
        setIsSubmittingTrack(false);
        await updateSession();
        return;
      }

      const trackData = await trackRes.json();

      await fetch(`/api/tracks/${trackData.id}/request-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desiredReviews: 1 }),
      });

      await updateSession();
      router.push("/dashboard?welcome=1");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmittingTrack(false);
    }
  };

  const hasValidTrackUrl =
    trackUrl.trim() !== "" && !trackUrlError && !isLoadingTrackMeta && trackSourceType !== null;

  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo />
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? "w-8 bg-black" : s < step ? "w-4 bg-lime-400" : "w-4 bg-black/10"
              }`}
            />
          ))}
        </div>

        {/* ── STEP 1: Artist name ─────────────────────────────── */}
        {step === 1 && (
          <div>
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
                What&apos;s your artist name?
              </h1>
              <p className="mt-3 text-sm text-black/40 font-medium">
                This is how you&apos;ll appear to other artists on the platform.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your artist or project name"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && artistName.trim()) { setError(""); setStep(2); } }}
                autoFocus
                className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3.5 text-base font-medium text-black placeholder:text-black/25 focus:border-purple-500 focus:outline-none transition-colors"
              />

              {error && (
                <div className="bg-red-500 text-white text-sm px-4 py-3 font-bold rounded-xl">{error}</div>
              )}

              <Button
                variant="primary"
                className="w-full h-12 bg-black text-white hover:bg-neutral-800 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl text-base"
                disabled={!artistName.trim()}
                onClick={() => { setError(""); setStep(2); }}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: First track ─────────────────────────────── */}
        {step === 2 && (
          <div>
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
                Drop your first track in.
              </h1>
              <p className="mt-3 text-sm text-black/40 font-medium">
                Paste a SoundCloud, YouTube, or Bandcamp link. We&apos;ll queue it for review straight away using your free credit.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl border-2 border-black/8 p-5 space-y-4">
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
                  <Input
                    placeholder="Paste SoundCloud, YouTube, or Bandcamp link"
                    value={trackUrl}
                    onChange={(e) => handleTrackUrlChange(e.target.value)}
                    className={`pl-9 h-12 rounded-xl border-2 bg-white focus:border-purple-500 focus:outline-none ${trackUrlError ? "border-red-400" : "border-black/10"}`}
                    autoFocus
                  />
                </div>

                {trackUrlError && (
                  <p className="text-sm text-red-500 font-bold">{trackUrlError}</p>
                )}

                {isLoadingTrackMeta && (
                  <div className="flex items-center gap-2 text-sm text-black/40 font-medium">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting track info...
                  </div>
                )}

                {trackUrl && !trackUrlError && !isLoadingTrackMeta && trackSourceType && (
                  <div className="rounded-xl border-2 border-black/8 bg-[#faf7f2] p-3 flex items-center gap-3">
                    {trackArtworkUrl ? (
                      <img src={trackArtworkUrl} alt="" className="h-12 w-12 rounded-xl object-cover flex-shrink-0 border-2 border-black/8" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-lime-400 border-2 border-black flex items-center justify-center flex-shrink-0">
                        <Music className="h-5 w-5 text-black" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-black truncate text-sm">{trackTitle || "Track detected"}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-lime-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
                          {trackSourceType === "SOUNDCLOUD" ? "SoundCloud" : trackSourceType === "YOUTUBE" ? "YouTube" : trackSourceType === "BANDCAMP" ? "Bandcamp" : "Ready"}
                        </span>
                      </div>
                    </div>
                    <Check className="h-5 w-5 text-lime-500 flex-shrink-0" />
                  </div>
                )}

                {/* What you get */}
                <div className="bg-lime-400 rounded-xl border-2 border-black px-4 py-3">
                  <p className="text-xs text-black font-black">Your free credit gets used — you&apos;ll get 1 real review back.</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500 text-white rounded-xl px-4 py-3 text-sm font-bold">{error}</div>
              )}

              <Button
                variant="primary"
                className="w-full h-12 bg-purple-600 text-white hover:bg-purple-700 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl text-base"
                disabled={!hasValidTrackUrl || isSubmittingTrack}
                isLoading={isSubmittingTrack}
                onClick={handleCompleteWithTrack}
              >
                Submit &amp; Get Reviewed
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors"
                >
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
  );
}
