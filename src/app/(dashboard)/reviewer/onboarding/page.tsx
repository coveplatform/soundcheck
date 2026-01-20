"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorAlert } from "@/components/ui/error-alert";
import { StepIndicator } from "@/components/ui/step-indicator";
import { Headphones, DollarSign, TrendingUp, XCircle, Loader2 } from "lucide-react";
import { GenreSelector } from "@/components/ui/genre-selector";
import { cn } from "@/lib/utils";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface ReviewerProfileState {
  completedOnboarding: boolean;
  onboardingQuizPassed: boolean;
  genres?: { id: string }[];
  country?: string | null;
}

export default function ReviewerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "quiz" | "genres" | "closed">("intro");
  const [isAlreadyComplete, setIsAlreadyComplete] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [country, setCountry] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const [quizAnswers, setQuizAnswers] = useState({
    compression: "",
    bpm: "",
    eq: "",
    daw: "",
  });

  const fetchGenres = async () => {
    setIsLoadingGenres(true);
    try {
      const response = await fetch("/api/genres");
      if (response.ok) {
        const data = await response.json();
        setGenres(data);
      }
    } catch (error) {
      console.error("Failed to fetch genres:", error);
    } finally {
      setIsLoadingGenres(false);
    }
  };

  useEffect(() => {
    fetchGenres();

    async function fetchProfileState() {
      setIsCheckingStatus(true);
      try {
        const res = await fetch("/api/listener/profile");

        if (res.status === 403) {
          // Check if signups are closed
          const data = await res.json().catch(() => ({}));
          if (data.error?.includes("closed")) {
            setStep("closed");
            return;
          }
        }

        if (!res.ok) {
          // Profile doesn't exist yet, check if we can create one
          // Try a minimal PATCH to see if signups are closed
          const checkRes = await fetch("/api/listener/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          if (checkRes.status === 403) {
            const data = await checkRes.json().catch(() => ({}));
            if (data.error?.includes("closed")) {
              setStep("closed");
              return;
            }
          }
          return;
        }

        const data = (await res.json()) as ReviewerProfileState;
        if (data.completedOnboarding) {
          setIsAlreadyComplete(true);
          return;
        }

        if (data.onboardingQuizPassed) {
          setStep("genres");
        }

        if (Array.isArray(data.genres) && data.genres.length > 0) {
          setSelectedGenres(data.genres.map((g) => g.id));
        }

        if (typeof data.country === "string" && data.country.trim()) {
          setCountry(data.country.trim().toUpperCase());
        }
      } catch {
      } finally {
        setIsCheckingStatus(false);
      }
    }

    void fetchProfileState();
  }, [router]);

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

  const handleQuizSubmit = async () => {
    setError("");

    if (
      !quizAnswers.compression ||
      !quizAnswers.bpm ||
      !quizAnswers.eq ||
      !quizAnswers.daw
    ) {
      setError("Please answer all questions");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/listener/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizAnswers }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      if (!data?.passed) {
        setError(
          "Quiz not passed. Please review the questions and try again."
        );
        return;
      }

      setStep("genres");
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");

    if (selectedGenres.length < 3) {
      setError("Please select at least 3 genres");
      return;
    }

    const normalizedCountry = country.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
      setError("Please enter your country as a 2-letter code (e.g. AU, US)");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/listener/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genreIds: selectedGenres, country: normalizedCountry }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Something went wrong");
        return;
      }

      // Mark onboarding as complete
      await fetch("/api/listener/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedOnboarding: true }),
      });

      setIsAlreadyComplete(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isCheckingStatus) {
    return (
      <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12 max-w-xl mx-auto">
        <Card variant="soft">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-black/30" />
              <p className="text-black/40">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAlreadyComplete) {
    return (
      <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12 max-w-xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">All set!</h1>
          <p className="mt-2 text-sm text-black/40">You&apos;re set up as a listener</p>
        </div>
        <Card variant="soft" elevated>
          <CardContent className="pt-6 space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">
                {error}
              </div>
            )}
            <Button
              variant="airyPrimary"
              className="w-full h-12"
              onClick={() => {
                router.push("/listener/dashboard");
                router.refresh();
              }}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="airyOutline"
              className="w-full h-12"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Applications closed
  if (step === "closed") {
    return (
      <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12 max-w-xl mx-auto">
        <div className="mb-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center mb-4">
            <XCircle className="h-7 w-7 text-black/40" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight">Applications Closed</h1>
          <p className="mt-2 text-sm text-black/40">We&apos;re not accepting new listeners right now</p>
        </div>
        <Card variant="soft" elevated>
          <CardContent className="pt-6 space-y-6">
            <div className="p-4 rounded-xl bg-black/5 text-center">
              <p className="text-sm text-black/60">
                We have reached capacity. Check back later or follow us for updates.
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-black/40 mb-4">
                In the meantime, you can submit your own music:
              </p>
              <Button
                variant="airyPrimary"
                className="h-12 px-6"
                onClick={() => router.push("/artist/submit")}
              >
                Submit Your Music
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12 max-w-xl mx-auto">
        <div className="mb-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
            <Headphones className="h-7 w-7 text-orange-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight">Welcome</h1>
          <p className="mt-2 text-sm text-black/40">Get paid to discover new music</p>
        </div>

        <Card variant="soft" elevated>
          <CardContent className="pt-6 space-y-6">
            <p className="text-xs font-mono tracking-widest text-black/40 uppercase text-center">step 1 of 3</p>
            
            <div className="grid gap-3">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 border border-black/10">
                <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Headphones className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-black">Listen to New Tracks</h3>
                  <p className="text-sm text-black/50">Discover unreleased music matched to your genres</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 border border-black/10">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-medium text-black">Earn Money</h3>
                  <p className="text-sm text-black/50">Start at $0.50 per review, earn up to $1.50</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 border border-black/10">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-black">Build Your Reputation</h3>
                  <p className="text-sm text-black/50">Level up from Normal to Pro based on quality</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/5">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-3">earnings per review</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-black/60">Normal</span>
                  <span className="font-medium text-black">$0.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Pro</span>
                  <span className="font-medium text-black">$1.50</span>
                </div>
              </div>
            </div>

            <Button onClick={() => setStep("quiz")} variant="airyPrimary" className="w-full h-12">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "quiz") {
    return (
      <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12 max-w-xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight">Quick Quiz</h1>
          <p className="mt-2 text-sm text-black/40">Answer 4 questions to confirm you can give useful feedback</p>
        </div>

        <Card variant="soft" elevated>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase">step 2 of 3</p>
              <p className="text-xs text-black/40">Pass: 3/4 correct</p>
            </div>
            
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium text-black">What is compression primarily used for?</Label>
              <div className="grid gap-2">
                {[
                  { value: "make_louder", label: "Make audio louder" },
                  { value: "dynamic_range", label: "Control dynamic range" },
                  { value: "remove_noise", label: "Remove background noise" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, compression: opt.value }))}
                    className={cn(
                      "px-4 py-3 text-sm font-medium transition-colors duration-150 ease-out rounded-xl text-left",
                      quizAnswers.compression === opt.value
                        ? "bg-lime-400 text-black border border-lime-500"
                        : "bg-white/60 border border-black/10 hover:bg-white"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-black">What does BPM measure?</Label>
              <div className="grid gap-2">
                {[
                  { value: "volume", label: "Volume" },
                  { value: "tempo", label: "Tempo" },
                  { value: "pitch", label: "Pitch" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, bpm: opt.value }))}
                    className={cn(
                      "px-4 py-3 text-sm font-medium transition-colors duration-150 ease-out rounded-xl text-left",
                      quizAnswers.bpm === opt.value
                        ? "bg-lime-400 text-black border border-lime-500"
                        : "bg-white/60 border border-black/10 hover:bg-white"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-black">What does EQ primarily change?</Label>
              <div className="grid gap-2">
                {[
                  { value: "frequency_balance", label: "Frequency balance" },
                  { value: "song_structure", label: "Song structure" },
                  { value: "reverb", label: "Reverb amount" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, eq: opt.value }))}
                    className={cn(
                      "px-4 py-3 text-sm font-medium transition-colors duration-150 ease-out rounded-xl text-left",
                      quizAnswers.eq === opt.value
                        ? "bg-lime-400 text-black border border-lime-500"
                        : "bg-white/60 border border-black/10 hover:bg-white"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-black">What is a DAW?</Label>
              <div className="grid gap-2">
                {[
                  { value: "digital_audio_workstation", label: "Digital Audio Workstation" },
                  { value: "audio_codec", label: "An audio codec" },
                  { value: "midi_controller", label: "A MIDI controller" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQuizAnswers((prev) => ({ ...prev, daw: opt.value }))}
                    className={cn(
                      "px-4 py-3 text-sm font-medium transition-colors duration-150 ease-out rounded-xl text-left",
                      quizAnswers.daw === opt.value
                        ? "bg-lime-400 text-black border border-lime-500"
                        : "bg-white/60 border border-black/10 hover:bg-white"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="airyOutline" onClick={() => setStep("intro")} className="h-12">Back</Button>
              <Button onClick={handleQuizSubmit} variant="airyPrimary" className="flex-1 h-12" isLoading={isLoading}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12 max-w-xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight">Select Genres</h1>
        <p className="mt-2 text-sm text-black/40">Choose 3-5 genres you&apos;re most familiar with</p>
      </div>

      <Card variant="soft" elevated>
        <CardContent className="pt-6 space-y-6">
          <p className="text-xs font-mono tracking-widest text-black/40 uppercase text-center">step 3 of 3</p>
          
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-mono tracking-widest text-black/40 uppercase">country</p>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
              placeholder="US"
              maxLength={2}
              autoComplete="country"
              className="h-12 rounded-xl border-black/10 bg-white/60 focus:bg-white"
            />
            <p className="text-xs text-black/40">
              2-letter code (AU, US, GB) for Stripe payouts
            </p>
          </div>

          {isLoadingGenres ? (
            <div className="flex items-center gap-2 text-sm text-black/40">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading genres...
            </div>
          ) : genres.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-black/40">No genres available. Try reloading.</p>
              <Button variant="airyOutline" onClick={fetchGenres}>Retry</Button>
            </div>
          ) : (
            <GenreSelector
              genres={genres}
              selectedIds={selectedGenres}
              onToggle={toggleGenre}
              minSelections={3}
              maxSelections={5}
              variant="reviewer"
            />
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="airyOutline" onClick={() => setStep("intro")} className="h-12">
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              variant="airyPrimary"
              className="flex-1 h-12"
              isLoading={isLoading}
              disabled={selectedGenres.length < 3}
            >
              Complete Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
