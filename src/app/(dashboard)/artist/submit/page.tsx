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
import { Check, Music, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateTrackUrl, fetchTrackMetadata, PACKAGES, PackageType } from "@/lib/metadata";
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
      if (metadata) {
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
          genreIds: selectedGenres,
          feedbackFocus: feedbackFocus.trim() || undefined,
          packageType: selectedPackage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
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
        <h1 className="text-2xl font-bold">Submit a Track</h1>
        <p className="text-neutral-500 mt-1">
          Get genuine feedback from real listeners
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md">
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setInputMode("url");
                setUploadedUrl("");
              }}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium border transition-colors",
                inputMode === "url"
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
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
                "px-3 py-2 rounded-md text-sm font-medium border transition-colors",
                inputMode === "upload"
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
              )}
            >
              Upload MP3
            </button>
          </div>

          <div className="space-y-2">
            {inputMode === "url" ? (
              <>
                <Input
                  placeholder="https://soundcloud.com/artist/track"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={cn(urlError && "border-red-500")}
                />
                {urlError && <p className="text-sm text-red-500">{urlError}</p>}
              </>
            ) : (
              <>
                <Input
                  type="file"
                  accept="audio/mpeg,audio/mp3,.mp3"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleUpload(file);
                    }
                  }}
                />
                <p className="text-xs text-neutral-500">
                  MP3 only (max 25MB). Files are stored locally in dev.
                </p>
              </>
            )}
          </div>

          {(inputMode === "url" ? url && !urlError : !!uploadedUrl) && (
            <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
              <Music className="h-5 w-5 text-neutral-400" />
              <div className="flex-1 min-w-0">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Track title"
                  className="border-0 bg-transparent p-0 h-auto font-medium focus-visible:ring-0"
                />
              </div>
              {inputMode === "url" ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          )}

          {inputMode === "upload" && isUploading ? (
            <p className="text-sm text-neutral-500">Uploading...</p>
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
            <p className="text-sm text-neutral-500">Fetching track info...</p>
          )}
        </CardContent>
      </Card>

      {/* Genre Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Genres</CardTitle>
          <CardDescription>
            Select up to 3 genres that best describe this track
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Feedback Focus (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feedback Focus (Optional)</CardTitle>
          <CardDescription>
            Is there anything specific you want reviewers to focus on?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            placeholder="e.g., I'm wondering if the mix sounds muddy, or if the vocals sit well in the track..."
            value={feedbackFocus}
            onChange={(e) => setFeedbackFocus(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm min-h-[100px] resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950"
            maxLength={500}
          />
          <p className="text-xs text-neutral-400 mt-1">
            {feedbackFocus.length}/500 characters
          </p>
        </CardContent>
      </Card>

      {/* Package Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Choose Your Package</CardTitle>
          <CardDescription>
            Select how many reviews you&apos;d like to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {(Object.keys(PACKAGES) as PackageType[]).map((key) => {
              const pkg = PACKAGES[key];
              const isSelected = selectedPackage === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPackage(key)}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-colors",
                    isSelected
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{pkg.name}</h3>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        {pkg.reviews} reviews
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${(pkg.price / 100).toFixed(0)}
                      </p>
                      <p className="text-xs text-neutral-400">
                        ${(pkg.price / pkg.reviews / 100).toFixed(2)}/review
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">{pkg.mix}</p>
                  {isSelected && (
                    <div className="flex items-center gap-1.5 mt-2 text-neutral-900">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary & Submit */}
      <Card className="bg-neutral-900 text-white border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-neutral-400 text-sm">Total</p>
              <p className="text-2xl font-bold">
                ${(selectedPackageDetails.price / 100).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-neutral-400 text-sm">
                {selectedPackageDetails.reviews} reviews
              </p>
              <p className="text-neutral-400 text-sm">
                Est. delivery: 24-72 hours
              </p>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!url || !!urlError || !title.trim() || selectedGenres.length === 0}
            className="w-full bg-white text-neutral-900 hover:bg-neutral-100"
          >
            Continue to Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
