"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GenreSelector } from "@/components/ui/genre-selector";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface ReviewerGenrePreferencesProps {
  initialGenreIds: string[];
}

export function ReviewerGenrePreferences({
  initialGenreIds,
}: ReviewerGenrePreferencesProps) {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenreIds);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

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
    setSaved(false);
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

  const handleSave = async () => {
    setError("");
    setSaved(false);

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
        setError(data.error || "Failed to update genres");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("Failed to update genres");
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges =
    JSON.stringify([...selectedGenres].sort()) !==
    JSON.stringify([...initialGenreIds].sort());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Genre Preferences</CardTitle>
        <CardDescription>
          Select 3-5 genres you want to listen to. You&apos;ll be matched with tracks in these genres.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-lime-50 border-2 border-lime-500 text-lime-800 text-sm p-3 font-medium">
            Genre preferences saved
          </div>
        )}

        {isLoadingGenres ? (
          <div className="text-sm text-neutral-600">Loading genres...</div>
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

        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isLoading}
          disabled={!hasChanges || selectedGenres.length < 3}
        >
          Save genre preferences
        </Button>
      </CardContent>
    </Card>
  );
}
