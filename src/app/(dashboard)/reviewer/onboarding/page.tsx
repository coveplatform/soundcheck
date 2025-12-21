"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Headphones, DollarSign, TrendingUp } from "lucide-react";
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
}

export default function ReviewerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "quiz" | "genres">("intro");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);

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
      try {
        const res = await fetch("/api/reviewer/profile");
        if (!res.ok) return;

        const data = (await res.json()) as ReviewerProfileState;
        if (data.completedOnboarding) {
          router.push("/reviewer/dashboard");
          router.refresh();
          return;
        }

        if (data.onboardingQuizPassed) {
          setStep("genres");
        }

        if (Array.isArray(data.genres) && data.genres.length > 0) {
          setSelectedGenres(data.genres.map((g) => g.id));
        }
      } catch {
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

    setIsLoading(true);

    try {
      const response = await fetch("/api/reviewer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genreIds: selectedGenres }),
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

      router.push("/reviewer/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "intro") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center mb-4">
              <Headphones className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Welcome to SoundCheck</CardTitle>
            <CardDescription>
              Get paid to discover new music and share your honest feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-xs text-neutral-400 text-center">Step 1 of 3</p>
            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg">
                  <Headphones className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <h3 className="font-medium">Listen to New Tracks</h3>
                  <p className="text-sm text-neutral-500">
                    Discover unreleased music matched to your genres
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg">
                  <DollarSign className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <h3 className="font-medium">Earn Money</h3>
                  <p className="text-sm text-neutral-500">
                    Start at $0.15 per review, earn up to $0.50 as you level up
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg">
                  <TrendingUp className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <h3 className="font-medium">Build Your Reputation</h3>
                  <p className="text-sm text-neutral-500">
                    Level up from Rookie to Verified to Pro based on quality
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2">
                Tier System
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-700">Rookie</span>
                  <span className="text-amber-600">$0.15/review</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">
                    Verified (25 reviews, 4.0+ rating)
                  </span>
                  <span className="text-amber-600">$0.30/review</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">
                    Pro (100 reviews, 4.5+ rating)
                  </span>
                  <span className="text-amber-600">$0.50/review</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setStep("quiz")} className="w-full">
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
            <p className="text-xs text-neutral-400">Step 2 of 3</p>
            <p className="text-sm text-neutral-500">
              Pass requirement: <strong>3/4 correct</strong>
            </p>
            {error && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Label>What is compression primarily used for?</Label>
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
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors border text-left",
                      quizAnswers.compression === opt.value
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "border-neutral-200 hover:border-neutral-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>What does BPM measure?</Label>
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
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors border text-left",
                      quizAnswers.bpm === opt.value
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "border-neutral-200 hover:border-neutral-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>What does EQ primarily change?</Label>
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
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors border text-left",
                      quizAnswers.eq === opt.value
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "border-neutral-200 hover:border-neutral-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>What is a DAW?</Label>
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
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors border text-left",
                      quizAnswers.daw === opt.value
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "border-neutral-200 hover:border-neutral-300"
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
          <p className="text-xs text-neutral-400">Step 3 of 3</p>
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Label>
              Your Genres{" "}
              <span className="text-neutral-500 font-normal">
                ({selectedGenres.length}/5 selected, minimum 3)
              </span>
            </Label>
            {isLoadingGenres ? (
              <div className="text-sm text-neutral-500">Loading genres...</div>
            ) : genres.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-neutral-500">
                  No genres available right now. Try reloading.
                </p>
                <Button variant="outline" onClick={fetchGenres}>
                  Retry
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
                        isSelected
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {genre.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setStep("intro")}>
            Back
          </Button>
          <Button
            onClick={handleSubmit}
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
