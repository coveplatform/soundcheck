"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GenreSelector } from "@/components/ui/genre-selector";
import { validateTrackUrl, fetchTrackMetadata, detectSource } from "@/lib/metadata";
import {
  ArrowRight, ArrowLeft, Music, Gift, Loader2,
  Link2, Check,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { SparklesDoodle } from "@/components/dashboard/doodles";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

type SourceType = "SOUNDCLOUD" | "BANDCAMP" | "YOUTUBE" | "UPLOAD" | null;

export default function OnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [step, setStep] = useState(1);
  const [artistName, setArtistName] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);

  // Step 4: track submission
  const [trackUrl, setTrackUrl] = useState("");
  const [trackUrlError, setTrackUrlError] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [trackSourceType, setTrackSourceType] = useState<SourceType>(null);
  const [isLoadingTrackMeta, setIsLoadingTrackMeta] = useState(false);
  const [trackArtworkUrl, setTrackArtworkUrl] = useState<string | null>(null);
  const [isSubmittingTrack, setIsSubmittingTrack] = useState(false);

  useEffect(() => {
    async function fetchGenres() {
      setIsLoadingGenres(true);
      try {
        const response = await fetch("/api/genres");
        if (response.ok) {
          const data = await response.json();
          setGenres(data);
        }
      } catch (err) {
        console.error("Failed to fetch Genre:", err);
      } finally {
        setIsLoadingGenres(false);
      }
    }
    fetchGenres();
  }, []);

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) return prev.filter((id) => id !== genreId);
      if (prev.length >= 5) return prev;
      return [...prev, genreId];
    });
  };

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

  // Save profile only (skip track)
  const handleComplete = async () => {
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistName: artistName.trim(), genreIds: selectedGenres, completedOnboarding: true }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 401) {
          // Stale session from before the DB wipe — sign out and redirect to sign in
          await signOut({ callbackUrl: "/signup" });
          return;
        }
        if (response.status === 409) {
          const updateRes = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ artistName: artistName.trim(), genreIds: selectedGenres, completedOnboarding: true }),
          });
          if (!updateRes.ok) {
            const updateData = await updateRes.json().catch(() => null);
            setError((updateData as any)?.error || "Something went wrong");
            setIsLoading(false);
            return;
          }
        } else {
          setError((data as any)?.error || "Something went wrong");
          setIsLoading(false);
          return;
        }
      }

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
      // 1. Create profile
      const profileRes = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistName: artistName.trim(), genreIds: selectedGenres, completedOnboarding: true }),
      });

      if (!profileRes.ok && profileRes.status !== 409) {
        const profileData = await profileRes.json().catch(() => null);
        if (profileRes.status === 401) {
          // Stale session from before the DB wipe — sign out and redirect to sign in
          await signOut({ callbackUrl: "/signup" });
          return;
        }
        // Try PATCH if POST fails
        const patchRes = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artistName: artistName.trim(), genreIds: selectedGenres, completedOnboarding: true }),
        });
        if (!patchRes.ok) {
          setError((profileData as any)?.error || "Something went wrong");
          setIsSubmittingTrack(false);
          return;
        }
      }

      // 2. Create track
      const trackRes = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: trackUrl,
          title: trackTitle.trim() || "My Track",
          artworkUrl: trackArtworkUrl || undefined,
          genreIds: selectedGenres,
        }),
      });

      if (!trackRes.ok) {
        const trackErr = await trackRes.json().catch(() => null);
        setError((trackErr as { error?: string })?.error || "Couldn't add your track. Try a different link, or tap \"I'll do this later\" to set up your track from the dashboard.");
        setIsSubmittingTrack(false);
        await updateSession();
        return;
      }

      const trackData = await trackRes.json();

      // Request 1 review (uses their free credit)
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
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8 relative">
          <SparklesDoodle className="absolute -top-3 -right-6 w-12 h-12 text-purple-400/25 pointer-events-none" />
          <Logo className="scale-110 relative" />
        </div>

        {/* Step pills */}
        <div className="flex justify-center gap-2 mb-8">
          {["Name", "Genres", "How it works", "First track"].map((label, i) => {
            const s = i + 1;
            return (
              <div key={s} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                s < step ? "bg-lime-400 border-lime-400 text-black" :
                s === step ? "bg-black border-black text-white" :
                "bg-white border-black/10 text-black/20"
              }`}>
                {s < step ? <Check className="h-2.5 w-2.5" /> : null}
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{s}</span>
              </div>
            );
          })}
        </div>

        {/* Step 1: Artist Name */}
        {step === 1 && (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-4">
                <Music className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-black leading-tight">
                What&apos;s your artist name?
              </h1>
              <p className="mt-2 text-sm text-black/40 font-medium">
                This is how you&apos;ll appear to other artists.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-black/8 p-6 space-y-5">
              <div>
                <label htmlFor="artistName" className="block text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2">
                  Artist Name
                </label>
                <input
                  id="artistName"
                  type="text"
                  placeholder="Your artist or project name"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-base font-medium text-black placeholder:text-black/25 focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
              <Button
                variant="primary"
                size="lg"
                className="w-full bg-purple-600 text-white hover:bg-purple-700 font-black border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
                disabled={!artistName.trim()}
                onClick={() => { setError(""); setStep(2); }}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Genre Selection */}
        {step === 2 && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-black leading-tight">
                What genres do you make?
              </h1>
              <p className="mt-2 text-sm text-black/40 font-medium">
                We&apos;ll match you with tracks to review and tag your uploads.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-black/8 p-6 space-y-5">
              {isLoadingGenres ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-black/40">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading genres...
                </div>
              ) : genres.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-black/40">No genres available. Try reloading.</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
                </div>
              ) : (
                <GenreSelector genres={genres} selectedIds={selectedGenres} onToggle={toggleGenre} minSelections={1} maxSelections={5} variant="artist" />
              )}
              <p className="text-[11px] font-black uppercase tracking-wider text-black/25 text-center">Select 1–5 genres</p>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors">
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1 bg-purple-600 text-white hover:bg-purple-700 font-black border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
                  disabled={selectedGenres.length < 1}
                  onClick={() => { setError(""); setStep(3); }}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: How It Works */}
        {step === 3 && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-black leading-tight">
                Here&apos;s how it works.
              </h1>
              <p className="mt-2 text-sm text-black/40 font-medium">
                Simple credit system. Real feedback from real artists.
              </p>
            </div>

            <div className="space-y-3">
              {/* Free credits — most important, first */}
              <div className="bg-lime-400 rounded-2xl px-5 py-4 border-2 border-black flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-lime-400 text-sm font-black">1</span>
                </div>
                <div>
                  <p className="text-sm font-black text-black">You start with 1 free credit.</p>
                  <p className="text-xs text-black/60 font-medium mt-0.5">
                    No reviewing needed yet — use it to get your first track reviewed right away.
                  </p>
                </div>
              </div>

              {/* Earn credits */}
              <div className="bg-white rounded-2xl border-2 border-black/8 px-5 py-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-black">2</span>
                </div>
                <div>
                  <p className="text-sm font-black text-black">Review others to earn more credits.</p>
                  <p className="text-xs text-black/50 font-medium mt-0.5">
                    Each review takes about 3 minutes. You earn 1 credit per completed review.
                  </p>
                </div>
              </div>

              {/* Spend credits */}
              <div className="bg-white rounded-2xl border-2 border-black/8 px-5 py-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-black">3</span>
                </div>
                <div>
                  <p className="text-sm font-black text-black">1 credit = 1 peer review on your track.</p>
                  <p className="text-xs text-black/50 font-medium mt-0.5">
                    Artists in your genre listen and give you written feedback. Free plan: one track at a time.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors">
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1 bg-purple-600 text-white hover:bg-purple-700 font-black border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
                  onClick={() => { setError(""); setStep(4); }}
                >
                  Next: Submit Your Track
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Submit first track */}
        {step === 4 && (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-lime-400 border-2 border-black flex items-center justify-center mb-4">
                <Music className="h-7 w-7 text-black" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-black leading-tight">
                Drop your first track in.
              </h1>
              <p className="mt-2 text-sm text-black/40 font-medium">
                Paste a SoundCloud, YouTube, or Bandcamp link — we&apos;ll queue it for review straight away.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl border-2 border-black/8 p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-black/30">
                    Track Link
                  </label>
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
                  {trackUrlError && <p className="text-sm text-red-500 font-bold">{trackUrlError}</p>}
                  {isLoadingTrackMeta && (
                    <div className="flex items-center gap-2 text-sm text-black/40 font-medium">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Getting track info...
                    </div>
                  )}
                </div>

                {/* Detected track preview */}
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
                      <p className="font-black text-black truncate text-sm">
                        {trackTitle || "Track detected"}
                      </p>
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

                {/* Credits callout */}
                <div className="bg-lime-400 rounded-xl border-2 border-black px-4 py-3 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-black flex-shrink-0" />
                  <p className="text-xs text-black font-black">
                    Your free credit will be used — you&apos;ll get 1 real artist review.
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500 text-white rounded-2xl px-4 py-3 text-sm font-bold">{error}</div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full bg-purple-600 text-white hover:bg-purple-700 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
                disabled={!hasValidTrackUrl || isSubmittingTrack}
                isLoading={isSubmittingTrack}
                onClick={handleCompleteWithTrack}
              >
                Submit &amp; Get 1 Review
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <div className="flex items-center gap-3">
                <button onClick={() => setStep(3)} className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors">
                  <ArrowLeft className="h-3 w-3" />
                  Back
                </button>
                <span className="flex-1" />
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="text-xs text-black/20 hover:text-black/40 font-medium transition-colors"
                >
                  {isLoading ? "Setting up..." : "I'll do this later"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
