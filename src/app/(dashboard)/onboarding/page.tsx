"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StepIndicator } from "@/components/ui/step-indicator";
import { GenreSelector } from "@/components/ui/genre-selector";
import { validateTrackUrl, fetchTrackMetadata, detectSource } from "@/lib/metadata";
import {
  ArrowRight, ArrowLeft, Music, Gift, Loader2, Headphones,
  Crown, Lock, Link2, Check,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

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
        // Track creation failed — still proceed to dashboard without track
        await updateSession();
        router.push("/dashboard");
        return;
      }

      const trackData = await trackRes.json();

      // 3. Request 3 reviews (uses their 3 free credits)
      await fetch(`/api/tracks/${trackData.id}/request-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desiredReviews: 3 }),
      });

      await updateSession();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmittingTrack(false);
    }
  };

  const hasValidTrackUrl =
    trackUrl.trim() !== "" && !trackUrlError && !isLoadingTrackMeta && trackSourceType !== null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 bg-[#faf8f5]">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Logo className="scale-110" />
        </div>

        <div className="mb-8">
          <StepIndicator currentStep={step} totalSteps={4} variant="progress" labels={["Artist Name", "Genres", "How It Works", "First Track"]} />
        </div>

        {/* Step 1: Artist Name */}
        {step === 1 && (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-lime-100 flex items-center justify-center mb-4">
                <Music className="h-7 w-7 text-lime-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight">
                What&apos;s your artist name?
              </h1>
              <p className="mt-2 text-sm text-black/40">
                This is how you&apos;ll appear to other artists
              </p>
            </div>

            <Card variant="soft" elevated>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <label htmlFor="artistName" className="block text-xs font-mono tracking-widest text-black/40 uppercase mb-2">
                    Artist Name
                  </label>
                  <input
                    id="artistName"
                    type="text"
                    placeholder="Your artist or project name"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-base text-black placeholder:text-black/30 focus:bg-white focus:border-lime-600 focus:ring-1 focus:ring-lime-600 outline-none transition-colors"
                  />
                </div>
                <Button variant="primary" size="lg" className="w-full" disabled={!artistName.trim()} onClick={() => { setError(""); setStep(2); }}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 2: Genre Selection */}
        {step === 2 && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight">
                What genres do you make?
              </h1>
              <p className="mt-2 text-sm text-black/40">
                We&apos;ll use these to match you with tracks to review and tag your uploads
              </p>
            </div>

            <Card variant="soft" elevated>
              <CardContent className="pt-6 space-y-6">
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
                <p className="text-xs text-black/40 text-center">Select 1&ndash;5 genres</p>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button variant="primary" size="lg" className="flex-1" disabled={selectedGenres.length < 1} onClick={() => { setError(""); setStep(3); }}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 3: How It Works */}
        {step === 3 && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight">
                Here&apos;s the deal.
              </h1>
              <p className="mt-2 text-sm text-black/40">
                It takes 3 minutes to review. Everyone does it. That&apos;s why it works.
              </p>
            </div>

            <div className="space-y-4">
              <Card variant="soft" elevated>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-black/30">The Loop</p>
                  <div className="flex items-stretch gap-2">
                    <div className="flex-1 rounded-xl bg-white border border-black/5 p-3 text-center">
                      <div className="h-10 w-10 rounded-xl bg-lime-100 flex items-center justify-center mx-auto mb-2">
                        <Headphones className="h-5 w-5 text-lime-600" />
                      </div>
                      <p className="text-xs font-bold text-black">Review</p>
                      <p className="text-[11px] text-black/40 mt-0.5">Listen ~3 min</p>
                    </div>
                    <div className="flex items-center text-black/20 font-bold text-lg">→</div>
                    <div className="flex-1 rounded-xl bg-white border border-black/5 p-3 text-center">
                      <div className="h-10 w-10 rounded-xl bg-lime-100 flex items-center justify-center mx-auto mb-2">
                        <Gift className="h-5 w-5 text-lime-600" />
                      </div>
                      <p className="text-xs font-bold text-black">Credit</p>
                      <p className="text-[11px] text-black/40 mt-0.5">Earn 1 credit</p>
                    </div>
                    <div className="flex items-center text-black/20 font-bold text-lg">→</div>
                    <div className="flex-1 rounded-xl bg-white border border-black/5 p-3 text-center">
                      <div className="h-10 w-10 rounded-xl bg-lime-100 flex items-center justify-center mx-auto mb-2">
                        <Music className="h-5 w-5 text-lime-600" />
                      </div>
                      <p className="text-xs font-bold text-black">Feedback</p>
                      <p className="text-[11px] text-black/40 mt-0.5">Real artists</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="soft" elevated>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-black/30">Your Slots</p>
                  <p className="text-sm text-black/60 leading-relaxed">
                    Think of slots like studio booking times. One at a time on free, or run 3 at once on Pro.
                  </p>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Free</p>
                    <div className="flex gap-2">
                      <div className="flex-1 h-10 rounded-lg bg-lime-500 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Music className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 h-10 rounded-lg border-2 border-dashed border-black/10 bg-white/50 flex items-center justify-center">
                        <Lock className="h-3.5 w-3.5 text-black/15" />
                      </div>
                      <div className="flex-1 h-10 rounded-lg border-2 border-dashed border-black/10 bg-white/50 flex items-center justify-center">
                        <Lock className="h-3.5 w-3.5 text-black/15" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500">Pro</p>
                      <Crown className="h-3 w-3 text-purple-400" />
                    </div>
                    <div className="flex gap-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex-1 h-10 rounded-lg bg-purple-500 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <Music className="h-4 w-4 text-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 rounded-xl bg-lime-50 border border-lime-200">
                <p className="text-sm font-bold text-lime-900 mb-1">🎁 You&apos;re starting with 3 free credits.</p>
                <p className="text-xs text-lime-800/70">
                  That&apos;s enough to get your first track reviewed right away. Drop it in on the next step.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="lg" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button variant="primary" size="lg" className="flex-1" onClick={() => { setError(""); setStep(4); }}>
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
              <div className="mx-auto w-14 h-14 rounded-2xl bg-lime-100 flex items-center justify-center mb-4">
                <Music className="h-7 w-7 text-lime-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight">
                Drop your first track in.
              </h1>
              <p className="mt-2 text-sm text-black/40">
                Paste a SoundCloud, YouTube, or Bandcamp link and we&apos;ll queue it for review straight away.
              </p>
            </div>

            <div className="space-y-4">
              <Card variant="soft" elevated>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-mono tracking-widest text-black/40 uppercase">
                      Track Link
                    </label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
                      <Input
                        placeholder="Paste SoundCloud, YouTube, or Bandcamp link"
                        value={trackUrl}
                        onChange={(e) => handleTrackUrlChange(e.target.value)}
                        className={`pl-9 h-12 rounded-xl border-2 border-neutral-200 bg-white focus:border-lime-500 ${trackUrlError ? "border-red-400" : ""}`}
                        autoFocus
                      />
                    </div>
                    {trackUrlError && <p className="text-sm text-red-600">{trackUrlError}</p>}
                    {isLoadingTrackMeta && (
                      <div className="flex items-center gap-2 text-sm text-black/40">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Getting track info...
                      </div>
                    )}
                  </div>

                  {/* Detected track preview */}
                  {trackUrl && !trackUrlError && !isLoadingTrackMeta && trackSourceType && (
                    <div className="rounded-xl border-2 border-black/10 bg-white p-3 flex items-center gap-3">
                      {trackArtworkUrl ? (
                        <img src={trackArtworkUrl} alt="" className="h-12 w-12 rounded-lg object-cover flex-shrink-0 border border-black/10" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center flex-shrink-0">
                          <Music className="h-5 w-5 text-white/70" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {trackTitle ? (
                          <p className="font-semibold text-black truncate text-sm">{trackTitle}</p>
                        ) : (
                          <p className="text-sm text-black/40">Track detected</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-lime-500" />
                          <span className="text-xs text-black/40">
                            {trackSourceType === "SOUNDCLOUD" ? "SoundCloud" : trackSourceType === "YOUTUBE" ? "YouTube" : trackSourceType === "BANDCAMP" ? "Bandcamp" : "Ready"}
                          </span>
                        </div>
                      </div>
                      <Check className="h-5 w-5 text-lime-500 flex-shrink-0" />
                    </div>
                  )}

                  <div className="rounded-xl bg-lime-50 border border-lime-200 px-4 py-3 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-lime-600 flex-shrink-0" />
                    <p className="text-xs text-lime-800 font-medium">
                      Your 3 free credits will be used — you&apos;ll get 3 real artist reviews.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">{error}</div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full bg-lime-600 text-white hover:bg-lime-700 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
                disabled={!hasValidTrackUrl || isSubmittingTrack}
                isLoading={isSubmittingTrack}
                onClick={handleCompleteWithTrack}
              >
                Submit & Get 3 Reviews
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <div className="flex items-center gap-3 pt-1">
                <button onClick={() => setStep(3)} className="flex items-center gap-1 text-sm text-black/40 hover:text-black transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
                <span className="flex-1" />
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="text-sm text-black/40 hover:text-black transition-colors underline underline-offset-2"
                >
                  {isLoading ? "Setting up..." : "Skip for now →"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
