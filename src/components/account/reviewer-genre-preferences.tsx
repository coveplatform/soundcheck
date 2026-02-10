"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  const [isEditing, setIsEditing] = useState(false);

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

  const selectedGenreNames = genres
    .filter((g) => selectedGenres.includes(g.id))
    .map((g) => g.name);

  return (
    <div className="bg-white border-2 border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h3 className="text-lg font-bold text-neutral-950">Genre Preferences</h3>
        <p className="text-sm text-neutral-600 mt-1">
          {isEditing
            ? "Select 3-5 genres you want to listen to. You'll be matched with tracks in these genres."
            : "Genres you'll review"}
        </p>
      </div>
      <div className="p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium rounded-lg">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-sm p-3 font-medium rounded-lg">
            Genre preferences saved
          </div>
        )}

        {isLoadingGenres ? (
          <div className="text-sm text-neutral-600">Loading genres...</div>
        ) : isEditing ? (
          <>
            <div className="max-w-xl">
              <GenreSelector
                genres={genres}
                selectedIds={selectedGenres}
                onToggle={toggleGenre}
                minSelections={3}
                maxSelections={5}
                variant="reviewer"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={async () => {
                  await handleSave();
                  setIsEditing(false);
                }}
                isLoading={isLoading}
                disabled={!hasChanges || selectedGenres.length < 3}
              >
                Save genre preferences
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedGenres(initialGenreIds);
                  setIsEditing(false);
                  setError("");
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {selectedGenreNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200"
                >
                  {name}
                </span>
              ))}
            </div>

            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Change genres
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
