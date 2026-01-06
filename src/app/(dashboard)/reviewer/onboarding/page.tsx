"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Headphones, DollarSign, TrendingUp, Loader2, XCircle } from "lucide-react";
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
        const res = await fetch("/api/reviewer/profile");

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
          const checkRes = await fetch("/api/reviewer/profile", {
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
      const response = await fetch("/api/reviewer/profile", {
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
      const response = await fetch("/api/reviewer/profile", {
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
      await fetch("/api/reviewer/profile", {
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
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              <p className="text-neutral-500">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAlreadyComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Onboarding complete</CardTitle>
            <CardDescription>
              You&apos;re set up as a reviewer. If you just got enabled, you may need to refresh once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && (
              <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
                {error}
              </div>
            )}
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                router.push("/reviewer/dashboard");
                router.refresh();
              }}
            >
              Go to Reviewer Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full"
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
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-neutral-200 border-2 border-black flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-neutral-600" />
            </div>
            <CardTitle className="text-2xl">Reviewer Applications Closed</CardTitle>
            <CardDescription>
              We&apos;re not accepting new reviewer applications at this time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-neutral-100 border-2 border-black p-4 text-center">
              <p className="text-neutral-600">
                We have reached capacity for reviewers. Check back later or follow us for updates on when applications reopen.
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-neutral-500 mb-4">
                In the meantime, you can submit your own music for feedback:
              </p>
              <Button
                variant="primary"
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
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-400 border-2 border-black flex items-center justify-center mb-4">
              <Headphones className="h-6 w-6 text-black" />
            </div>
            <CardTitle className="text-2xl">Welcome to MixReflect</CardTitle>
            <CardDescription>
              Get paid to discover new music and share your honest feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-xs text-neutral-600 text-center font-mono">Step 1 of 3</p>
            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-4 border-2 border-black">
                <div className="p-2 bg-orange-400 border-2 border-black">
                  <Headphones className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h3 className="font-bold">Listen to New Tracks</h3>
                  <p className="text-sm text-neutral-600">
                    Discover unreleased music matched to your genres
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 border-2 border-black">
                <div className="p-2 bg-lime-400 border-2 border-black">
                  <DollarSign className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h3 className="font-bold">Earn Money</h3>
                  <p className="text-sm text-neutral-600">
                    Start at $0.50 per review, earn up to $1.50 as you level up
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 border-2 border-black">
                <div className="p-2 bg-purple-400 border-2 border-black">
                  <TrendingUp className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h3 className="font-bold">Build Your Reputation</h3>
                  <p className="text-sm text-neutral-600">
                    Level up from Normal to Pro based on quality
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-100 border-2 border-black p-4">
              <h4 className="font-bold text-black mb-3">
                Earnings per review
              </h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span>Normal</span>
                  <span className="font-bold">$0.50/review</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro (50 reviews, 4.7+ rating OR 10 gems)</span>
                  <span className="font-bold">$1.50/review</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setStep("quiz")} variant="primary" className="w-full">
              Get Started
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (step === "quiz") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Quick Music Basics Quiz</CardTitle>
            <CardDescription>
              Answer 4 questions to confirm you can give useful feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-xs text-neutral-600 font-mono">Step 2 of 3</p>
            <p className="text-sm text-neutral-600">
              Pass requirement: <strong>3/4 correct</strong>
            </p>
            {error && (
              <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Label className="font-bold">What is compression primarily used for?</Label>
              <div className="grid gap-2">
                {[
                  { value: "make_louder", label: "Make audio louder" },
                  { value: "dynamic_range", label: "Control dynamic range" },
                  { value: "remove_noise", label: "Remove background noise" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setQuizAnswers((prev) => ({
                        ...prev,
                        compression: opt.value,
                      }))
                    }
                    className={cn(
                      "px-4 py-3 text-sm font-medium transition-colors border-2 border-black text-left",
                      quizAnswers.compression === opt.value
                        ? "bg-lime-400 text-black"
                        : "bg-white hover:bg-neutral-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold">What does BPM measure?</Label>
              <div className="grid gap-2">
                {[
                  { value: "volume", label: "Volume" },
                  { value: "tempo", label: "Tempo" },
                  { value: "pitch", label: "Pitch" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setQuizAnswers((prev) => ({ ...prev, bpm: opt.value }))
                    }
                    className={cn(
                      "px-4 py-3 text-sm font-medium transition-colors border-2 border-black text-left",
                      quizAnswers.bpm === opt.value
                        ? "bg-lime-400 text-black"
                        : "bg-white hover:bg-neutral-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold">What does EQ primarily change?</Label>
              <div className="grid gap-2">
                {[
                  { value: "frequency_balance", label: "Frequency balance" },
                  { value: "song_structure", label: "Song structure" },
                  { value: "reverb", label: "Reverb amount" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setQuizAnswers((prev) => ({ ...prev, eq: opt.value }))
                    }
                    className={cn(
                      "px-4 py-3 text-sm font-medium transition-colors border-2 border-black text-left",
                      quizAnswers.eq === opt.value
                        ? "bg-lime-400 text-black"
                        : "bg-white hover:bg-neutral-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold">What is a DAW?</Label>
              <div className="grid gap-2">
                {[
                  { value: "digital_audio_workstation", label: "Digital Audio Workstation" },
                  { value: "audio_codec", label: "An audio codec" },
                  { value: "midi_controller", label: "A MIDI controller" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setQuizAnswers((prev) => ({ ...prev, daw: opt.value }))
                    }
                    className={cn(
                      "px-4 py-3 text-sm font-medium transition-colors border-2 border-black text-left",
                      quizAnswers.daw === opt.value
                        ? "bg-lime-400 text-black"
                        : "bg-white hover:bg-neutral-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("intro")}>Back</Button>
            <Button onClick={handleQuizSubmit} className="flex-1" isLoading={isLoading}>
              Continue
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Select Your Genres</CardTitle>
          <CardDescription>
            Choose 3-5 genres you&apos;re most familiar with. You&apos;ll be matched
            with tracks in these genres.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-neutral-600 font-mono">Step 3 of 3</p>
          {error && (
            <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="font-bold">Country (for payouts)</Label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
              placeholder="US"
              maxLength={2}
              autoComplete="country"
            />
            <p className="text-xs text-neutral-600 font-mono">
              Use a 2-letter code like AU, US, GB. This is required to connect Stripe payouts.
            </p>
          </div>

          {isLoadingGenres ? (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading genres...
            </div>
          ) : genres.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                No genres available right now. Try reloading.
              </p>
              <Button variant="outline" onClick={fetchGenres}>
                Retry
              </Button>
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
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setStep("intro")}>
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            className="flex-1"
            isLoading={isLoading}
            disabled={selectedGenres.length < 3}
          >
            Complete Setup
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
