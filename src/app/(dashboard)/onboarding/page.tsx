"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StepIndicator } from "@/components/ui/step-indicator";
import { GenreSelector } from "@/components/ui/genre-selector";
import { ArrowRight, ArrowLeft, Music, RefreshCw, Gift, Loader2 } from "lucide-react";

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
      const response = await fetch("/api/artist/profile", {
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
          const updateRes = await fetch("/api/artist/profile", {
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
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#faf8f5]">
      <div className="w-full max-w-lg">
        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={step} totalSteps={3} variant="progress" labels={["Artist Name", "Genres", "Ready"]} />
        </div>

        {/* Step 1: Artist Name */}
        {step === 1 && (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
                <Music className="h-7 w-7 text-purple-600" />
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
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-base text-black placeholder:text-black/30 focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none transition-colors"
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
                You&apos;re all set!
              </h1>
              <p className="mt-2 text-sm text-black/40">
                Here&apos;s how MixReflect works
              </p>
            </div>

            <Card variant="soft" elevated>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 border border-black/10">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Gift className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black">You have 2 free credits to start</h3>
                      <p className="text-sm text-black/50">
                        Use them to get feedback on your tracks right away
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 border border-black/10">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Music className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black">Each credit = 1 review on your track</h3>
                      <p className="text-sm text-black/50">
                        Submit a track and spend credits to get detailed peer feedback
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 border border-black/10">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black">Earn more by reviewing others</h3>
                      <p className="text-sm text-black/50">
                        1 review you give = 1 credit earned. Help others, get helped back.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <p className="text-sm text-purple-900 font-medium text-center">
                    Give feedback &rarr; Earn credits &rarr; Get feedback
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
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
