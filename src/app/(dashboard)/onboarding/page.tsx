"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StepIndicator } from "@/components/ui/step-indicator";
import { GenreSelector } from "@/components/ui/genre-selector";
import { ArrowRight, ArrowLeft, Music, RefreshCw, Gift, Loader2, Headphones, Crown, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

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
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, genreId];
    });
  };

  const handleComplete = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistName: artistName.trim(),
          genreIds: selectedGenres,
          completedOnboarding: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 409) {
          // Profile already exists, try updating instead
          const updateRes = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              artistName: artistName.trim(),
              genreIds: selectedGenres,
              completedOnboarding: true,
            }),
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 bg-[#faf8f5]">
      <div className="w-full max-w-lg">
        {/* Logo - always visible */}
        <div className="flex justify-center mb-8">
          <Logo className="scale-110" />
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={step} totalSteps={3} variant="progress" labels={["Artist Name", "Genres", "Ready"]} />
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
                  <label
                    htmlFor="artistName"
                    className="block text-xs font-mono tracking-widest text-black/40 uppercase mb-2"
                  >
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

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!artistName.trim()}
                  onClick={() => {
                    setError("");
                    setStep(2);
                  }}
                >
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
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <GenreSelector
                    genres={genres}
                    selectedIds={selectedGenres}
                    onToggle={toggleGenre}
                    minSelections={1}
                    maxSelections={5}
                    variant="artist"
                  />
                )}

                <p className="text-xs text-black/40 text-center">
                  Select 1&ndash;5 genres
                </p>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    disabled={selectedGenres.length < 1}
                    onClick={() => {
                      setError("");
                      setStep(3);
                    }}
                  >
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
                How MixReflect works
              </h1>
              <p className="mt-2 text-sm text-black/40">
                Artists helping artists — give feedback, get feedback
              </p>
            </div>

            <div className="space-y-4">
              {/* The Loop */}
              <Card variant="soft" elevated>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-black/30">The Loop</p>

                  <div className="relative space-y-0">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4 pb-4">
                      <div className="relative flex flex-col items-center">
                        <div className="h-10 w-10 rounded-xl bg-lime-100 flex items-center justify-center flex-shrink-0 z-10">
                          <Headphones className="h-5 w-5 text-lime-600" />
                        </div>
                        <div className="w-px h-full bg-black/10 absolute top-10 left-1/2 -translate-x-1/2" />
                      </div>
                      <div className="pt-1.5">
                        <h3 className="text-sm font-bold text-black">Review a track in your genre</h3>
                        <p className="text-xs text-black/50 mt-0.5">Listen for at least 3 minutes and give structured feedback. Takes ~5 min.</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4 pb-4">
                      <div className="relative flex flex-col items-center">
                        <div className="h-10 w-10 rounded-xl bg-lime-100 flex items-center justify-center flex-shrink-0 z-10">
                          <Gift className="h-5 w-5 text-lime-600" />
                        </div>
                        <div className="w-px h-full bg-black/10 absolute top-10 left-1/2 -translate-x-1/2" />
                      </div>
                      <div className="pt-1.5">
                        <h3 className="text-sm font-bold text-black">Earn a credit</h3>
                        <p className="text-xs text-black/50 mt-0.5">Every review you submit earns 1 credit. You start with 3 free credits.</p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-lime-100 flex items-center justify-center flex-shrink-0">
                        <Music className="h-5 w-5 text-lime-600" />
                      </div>
                      <div className="pt-1.5">
                        <h3 className="text-sm font-bold text-black">Submit your track &amp; spend credits</h3>
                        <p className="text-xs text-black/50 mt-0.5">Your track enters a review queue slot. Other artists in your genre will review it.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Queue Slots */}
              <Card variant="soft" elevated>
                <CardContent className="pt-6 space-y-3">
                  <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-black/30">Review Queue</p>
                  <p className="text-sm text-black/60 leading-relaxed">
                    Your track sits in a <span className="font-semibold text-black">queue slot</span> while it waits for reviews.
                    Each slot holds one track at a time.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/70 border border-black/5 text-center">
                      <p className="text-2xl font-bold text-black">1</p>
                      <p className="text-[11px] text-black/40 font-medium">Free slot</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <p className="text-2xl font-bold text-purple-700">3</p>
                        <Crown className="h-4 w-4 text-purple-500" />
                      </div>
                      <p className="text-[11px] text-purple-600 font-medium">Pro slots</p>
                    </div>
                  </div>
                  <p className="text-xs text-black/40">
                    Once a track finishes reviews, the slot frees up for your next track.
                  </p>
                </CardContent>
              </Card>

              {/* What you get */}
              <div className="p-4 rounded-xl bg-lime-50 border border-lime-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-lime-600 flex-shrink-0" />
                  <p className="text-sm text-lime-900 font-bold">You&apos;re starting with 3 free credits</p>
                </div>
                <p className="text-xs text-lime-800/70 ml-6">
                  Enough to get feedback on your first track right away. Earn more anytime by reviewing others.
                </p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  isLoading={isLoading}
                  onClick={handleComplete}
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
