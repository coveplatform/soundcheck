"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { GenreSelector } from "@/components/ui/genre-selector";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [artistName, setArtistName] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);

  useEffect(() => {
    async function fetchGenres() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!artistName.trim()) {
      setError("Please enter your artist name");
      return;
    }

    if (selectedGenres.length === 0) {
      setError("Please select at least one genre");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/artist/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistName: artistName.trim(),
          genreIds: selectedGenres,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Something went wrong");
        return;
      }

      // Refresh the session to update the JWT token with isArtist = true
      // This prevents middleware from redirecting back due to stale token
      await updateSession();
      router.push("/artist/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Set Up Your Artist Profile</CardTitle>
          <CardDescription>
            Tell us about yourself so we can match you with the right reviewers
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="artistName">Artist / Project Name</Label>
              <Input
                id="artistName"
                placeholder="Your artist name"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
              />
              <p className="text-sm text-neutral-500">
                This is how you&apos;ll appear to reviewers
              </p>
            </div>

            <div className="space-y-3">
              <Label>
                Your Genres{" "}
                <span className="text-neutral-500 font-normal">
                  (select up to 5)
                </span>
              </Label>
              {isLoadingGenres ? (
                <div className="text-sm text-neutral-500">Loading genres...</div>
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
              <p className="text-sm text-neutral-500">
                These help us match your tracks with reviewers who understand
                your sound
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={!artistName.trim() || selectedGenres.length === 0}
            >
              Complete Setup
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
