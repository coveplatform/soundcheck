"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Music, ExternalLink, Check, Loader2 } from "lucide-react";
import { GenreSelector } from "@/components/ui/genre-selector";
import { cn } from "@/lib/utils";
import { validateTrackUrl, fetchTrackMetadata, ACTIVE_PACKAGE_TYPES, PACKAGES, PackageType } from "@/lib/metadata";
import { AudioPlayer } from "@/components/audio/audio-player";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

export default function SubmitTrackPage() {
  const router = useRouter();

  // Form state
  const [inputMode, setInputMode] = useState<"url" | "upload">("url");
  const [url, setUrl] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [uploadedDuration, setUploadedDuration] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [bpm, setBpm] = useState<string>("");
  const [feedbackFocus, setFeedbackFocus] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>("STANDARD");

  // UI state
  const [genres, setGenres] = useState<Genre[]>([]);
  const [urlError, setUrlError] = useState("");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      }
    }
    fetchGenres();
  }, []);

  const handleUrlChange = async (value: string) => {
    setUrl(value);
    setUrlError("");

    if (!value.trim()) return;

    const validation = validateTrackUrl(value);
    if (!validation.valid) {
      setUrlError(validation.error || "Invalid URL");
      return;
    }

    // Fetch metadata
    setIsLoadingMetadata(true);
    try {
      const metadata = await fetchTrackMetadata(value);
      if (metadata && typeof metadata.title === "string" && metadata.title.trim()) {
        setTitle(metadata.title);
      }
    } catch {
      // Silently fail - user can enter title manually
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleUpload = async (file: File) => {
    setError("");
    setUrlError("");
    setIsUploading(true);
    setUploadedDuration(null);

    try {
      let finalUrl = "";

      const presignRes = await fetch("/api/uploads/track/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "audio/mpeg",
          contentLength: file.size,
        }),
      });

      if (presignRes.ok) {
        const presignData = (await presignRes.json()) as {
          uploadUrl?: string;
          fileUrl?: string;
          contentType?: string;
          error?: string;
          missing?: string[];
        };

        if (!presignData.uploadUrl || !presignData.fileUrl) {
          setError(presignData.error || "Failed to prepare upload");
          return;
        }

        const putRes = await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": presignData.contentType || "audio/mpeg" },
          body: file,
        });

        if (!putRes.ok) {
          setError("Failed to upload MP3");
          return;
        }

        finalUrl = presignData.fileUrl;
      } else {
        const presignError = (await presignRes.json().catch(() => null)) as
          | { error?: string; missing?: string[] }
          | null;

        // In production on Vercel, the local filesystem upload fallback is unreliable
        // (request body limits + non-persistent filesystem). If cloud uploads aren't configured,
        // fail fast with an actionable message.
        if (presignRes.status === 501 && process.env.NODE_ENV === "production") {
          const missing = presignError?.missing?.length
            ? ` Missing: ${presignError.missing.join(", ")}`
            : "";
          setError((presignError?.error || "Cloud uploads not configured") + missing);
          return;
        }

        // For other presign failures (auth, validation), surface the error instead of falling back.
        if (presignRes.status !== 501) {
          setError(presignError?.error || "Failed to prepare upload");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/uploads/track", {
          method: "POST",
          body: formData,
        });

        const data = (await res.json()) as { url?: string; error?: string };

        if (!res.ok || !data.url) {
          setError(data.error || "Failed to upload MP3");
          return;
        }

        finalUrl = data.url;
      }

      if (!finalUrl) {
        setError("Failed to upload MP3");
        return;
      }

      setUploadedUrl(finalUrl);

      await new Promise<void>((resolve) => {
        const audio = new Audio();
        audio.preload = "metadata";
        audio.src = finalUrl;

        const cleanup = () => {
          audio.removeEventListener("loadedmetadata", onLoaded);
          audio.removeEventListener("error", onError);
        };

        const onLoaded = () => {
          cleanup();
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setUploadedDuration(Math.round(audio.duration));
          }
          resolve();
        };

        const onError = () => {
          cleanup();
          resolve();
        };

        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("error", onError);
      });

      if (!title.trim()) {
        const base = file.name.replace(/\.mp3$/i, "").trim();
        if (base) {
          setTitle(base);
        }
      }
    } catch {
      setError("Failed to upload MP3");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, genreId];
    });
  };

  const handleSubmit = async () => {
    setError("");

    if (inputMode === "url") {
      const validation = validateTrackUrl(url);
      if (!validation.valid) {
        setUrlError(validation.error || "Invalid URL");
        return;
      }
    } else {
      if (!uploadedUrl) {
        setError("Please upload an MP3 first");
        return;
      }
    }

    if (!title.trim()) {
      setError("Please enter a track title");
      return;
    }

    if (selectedGenres.length === 0) {
      setError("Please select at least one genre");
      return;
    }

    if (!bpm.trim()) {
      setError("Please enter the BPM of your track");
      return;
    }

    const bpmValue = parseInt(bpm, 10);
    if (isNaN(bpmValue) || bpmValue < 1 || bpmValue > 999) {
      setError("BPM must be a number between 1 and 999");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: inputMode === "upload" ? uploadedUrl : url,
          ...(inputMode === "upload" ? { sourceType: "UPLOAD" } : {}),
          ...(inputMode === "upload" && uploadedDuration
            ? { duration: uploadedDuration }
            : {}),
          title: title.trim(),
          bpm: bpmValue,
          genreIds: selectedGenres,
          feedbackFocus: feedbackFocus.trim() || undefined,
          packageType: selectedPackage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && typeof data?.error === "string" && data.error.toLowerCase().includes("verify")) {
          router.push("/verify-email");
          router.refresh();
          return;
        }
        setError(data.error || "Something went wrong");
        return;
      }

      // Redirect to checkout
      router.push(`/artist/submit/checkout?trackId=${data.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPackageDetails = PACKAGES[selectedPackage];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black">Submit a Track</h1>
        <p className="text-neutral-600 mt-1">
          Get structured feedback from a curated, genre-matched listener panel. Rate reviews (and mark Gems) to keep the panel high-signal.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
          {error}
        </div>
      )}

      {/* Track URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Track</CardTitle>
          <CardDescription>
            Submit via URL or upload an MP3
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => {
                setInputMode("url");
                setUploadedUrl("");
              }}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 text-sm font-bold border-2 border-black transition-colors",
                inputMode === "url"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-neutral-100"
              )}
            >
              Link
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode("upload");
                setUrl("");
                setUrlError("");
              }}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 text-sm font-bold border-2 border-black transition-colors",
                inputMode === "upload"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-neutral-100"
              )}
            >
              Upload MP3
            </button>
          </div>

          <div className="space-y-2">
            {inputMode === "url" ? (
              <>
                <Input
                  key="track-url"
                  placeholder="https://soundcloud.com/artist/track"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={cn(urlError && "border-red-500")}
                />
                {urlError && <p className="text-sm text-red-500 font-medium">{urlError}</p>}
              </>
            ) : (
              <>
                <Input
                  key="track-upload"
                  type="file"
                  accept="audio/mpeg,audio/mp3,.mp3"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleUpload(file);
                    }
                  }}
                />
                <p className="text-xs text-neutral-600 font-mono">
                  MP3 only (max 25MB)
                </p>
              </>
            )}
          </div>

          {(inputMode === "url" ? url && !urlError : !!uploadedUrl) && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 p-3 bg-neutral-50 border-2 border-black">
                <Music className="h-5 w-5 text-black" />
                <div className="flex-1 min-w-0">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Track title"
                    className="border-0 bg-transparent p-0 h-auto font-bold focus-visible:ring-0"
                  />
                </div>
                {inputMode === "url" ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-600 hover:text-black"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="bpm" className="text-sm font-bold text-black whitespace-nowrap">
                  BPM *
                </label>
                <Input
                  id="bpm"
                  type="number"
                  min={1}
                  max={999}
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="e.g., 128"
                  className="w-24"
                />
                <span className="text-xs text-neutral-500">Required</span>
              </div>
            </div>
          )}

          {inputMode === "upload" && isUploading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-600 font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading your track...
            </div>
          ) : null}

          {inputMode === "upload" && uploadedUrl ? (
            <AudioPlayer
              sourceUrl={uploadedUrl}
              sourceType="UPLOAD"
              showListenTracker={false}
              showWaveform={true}
            />
          ) : null}

          {isLoadingMetadata && (
            <div className="flex items-center gap-2 text-sm text-neutral-600 font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching track info...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Genre Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Genres</CardTitle>
          <CardDescription>
            Help us match your track with the right reviewers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenreSelector
            genres={genres}
            selectedIds={selectedGenres}
            onToggle={toggleGenre}
            maxSelections={3}
            variant="artist"
          />
        </CardContent>
      </Card>

      {/* Feedback Focus (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Explain Your Track (Optional)</CardTitle>
          <CardDescription>
            Describe the context in your own words (vibe, inspiration, what you were going for, anything you want them to know).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            placeholder="e.g., This is a demo for my next EP. I'm going for a dark club vibe. I'm unsure if the vocal sits right and whether the drop hits hard enough..."
            value={feedbackFocus}
            onChange={(e) => setFeedbackFocus(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black text-sm min-h-[100px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            maxLength={1000}
          />
          <p className="text-xs text-neutral-600 mt-1 font-mono">
            {feedbackFocus.length}/1000
          </p>
        </CardContent>
      </Card>

      {/* Package Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Choose Your Package</CardTitle>
          <CardDescription>
            Select how many structured reviews you&apos;d like (higher tiers prioritize top-rated reviewers)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {ACTIVE_PACKAGE_TYPES.map((key) => {
              const pkg = PACKAGES[key];
              const isSelected = selectedPackage === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPackage(key)}
                  className={cn(
                    "p-4 border-2 border-black text-left transition-colors",
                    isSelected
                      ? "bg-lime-500"
                      : "bg-white hover:bg-neutral-50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">{pkg.name}</h3>
                      <p className="text-sm text-neutral-600 mt-0.5">
                        {pkg.reviews} reviews
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-lg">
                        ${(pkg.price / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-neutral-600 font-mono">
                        ${(pkg.price / pkg.reviews / 100).toFixed(2)}/review
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 mt-2">{pkg.mix}</p>
                  {isSelected && (
                    <div className="flex items-center gap-1.5 mt-2 text-black">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-bold">Selected</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary & Submit */}
      <Card className="bg-black text-white border-black">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="min-w-0">
              <p className="text-neutral-400 text-sm font-medium">Total</p>
              <p className="text-3xl font-black">
                ${(selectedPackageDetails.price / 100).toFixed(2)}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-neutral-400 text-sm font-mono">
                {selectedPackageDetails.reviews} reviews
              </p>
              <p className="text-neutral-400 text-sm font-mono">
                24 hours max (usually shorter)
              </p>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={
              isUploading ||
              isSubmitting ||
              !title.trim() ||
              !bpm.trim() ||
              selectedGenres.length === 0 ||
              (inputMode === "url"
                ? !url || !!urlError
                : !uploadedUrl)
            }
            variant="primary"
            className="w-full"
          >
            Continue to Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
