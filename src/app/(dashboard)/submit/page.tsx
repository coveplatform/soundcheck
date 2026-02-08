"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GenreSelector } from "@/components/ui/genre-selector";
import { SupportedPlatforms } from "@/components/ui/supported-platforms";
import { StepIndicator } from "@/components/ui/step-indicator";
import { cn } from "@/lib/utils";
import { validateTrackUrl, fetchTrackMetadata, detectSource } from "@/lib/metadata";
import {
  ArrowRight,
  ArrowLeft,
  Link2,
  Upload,
  Loader2,
  Check,
  Music,
  Star,
  Coins,
  Sparkles,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UploadMode = "link" | "file";
type SourceType = "SOUNDCLOUD" | "BANDCAMP" | "YOUTUBE" | "UPLOAD" | null;

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface ArtistProfile {
  id: string;
  artistName: string;
  totalTracks: number;
  subscriptionStatus: string | null;
  reviewCredits: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REVIEW_OPTIONS = [
  { value: 3, label: "3 reviews", credits: 3, recommended: false },
  { value: 5, label: "5 reviews", credits: 5, recommended: true },
  { value: 10, label: "10 reviews", credits: 10, recommended: false },
] as const;

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SubmitTrackPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // ---- step state ----------------------------------------------------------
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ---- profile / credit state ---------------------------------------------
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ---- step 1: track source state -----------------------------------------
  const [uploadMode, setUploadMode] = useState<UploadMode>("link");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- step 2: details state ----------------------------------------------
  const [title, setTitle] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [feedbackFocus, setFeedbackFocus] = useState("");

  // ---- step 3: reviews state ----------------------------------------------
  const [reviewCount, setReviewCount] = useState<number>(5);

  // ---- shared UI state ----------------------------------------------------
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBuyingCredits, setIsBuyingCredits] = useState(false);

  // ---- data fetching -------------------------------------------------------
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/artist/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile({
            id: data.id,
            artistName: data.artistName,
            totalTracks: data.totalTracks ?? 0,
            subscriptionStatus: data.subscriptionStatus ?? null,
            reviewCredits: data.reviewCredits ?? 0,
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, []);

  useEffect(() => {
    async function loadGenres() {
      try {
        const res = await fetch("/api/genres");
        if (res.ok) {
          const data = await res.json();
          setGenres(data);
        }
      } catch (err) {
        console.error("Failed to load genres:", err);
      }
    }
    loadGenres();
  }, []);

  // ---- step 1 handlers -----------------------------------------------------

  const handleUrlChange = useCallback(
    async (value: string) => {
      setUrl(value);
      setUrlError("");
      setSourceType(detectSource(value));

      if (!value.trim()) return;

      const validation = validateTrackUrl(value);
      if (!validation.valid) {
        setUrlError(validation.error || "Invalid URL");
        return;
      }

      setIsLoadingMetadata(true);
      try {
        const metadata = await fetchTrackMetadata(value);
        if (metadata?.title) {
          setTitle(metadata.title);
        }
      } catch {
        // metadata fetch is best-effort
      } finally {
        setIsLoadingMetadata(false);
      }
    },
    []
  );

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 25 MB.");
      return;
    }

    if (!file.type.includes("audio") && !file.name.toLowerCase().endsWith(".mp3")) {
      setError("Please upload an MP3 file.");
      return;
    }

    setError("");
    setIsUploading(true);
    setUploadedUrl("");
    setUploadedFileName("");

    try {
      // Get presigned URL
      const presignRes = await fetch("/api/uploads/track/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "audio/mpeg",
          contentLength: file.size,
        }),
      });

      if (!presignRes.ok) {
        const presignErr = await presignRes.json().catch(() => null);

        // Fallback to FormData upload for local dev (501 = not configured)
        if (presignRes.status === 501) {
          const formData = new FormData();
          formData.append("file", file);
          const fallbackRes = await fetch("/api/uploads/track", {
            method: "POST",
            body: formData,
          });
          const fallbackData = await fallbackRes.json();
          if (!fallbackRes.ok || !fallbackData.url) {
            setError(fallbackData.error || "Failed to upload MP3");
            return;
          }
          setUploadedUrl(fallbackData.url);
          setUploadedFileName(file.name);
          setSourceType("UPLOAD");
          if (!title.trim()) {
            setTitle(file.name.replace(/\.mp3$/i, "").trim());
          }
          return;
        }

        setError(
          (presignErr as { error?: string })?.error || "Failed to prepare upload"
        );
        return;
      }

      const presignData = await presignRes.json();
      if (!presignData.uploadUrl || !presignData.fileUrl) {
        setError("Failed to prepare upload");
        return;
      }

      // Upload the file
      const putRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": presignData.contentType || "audio/mpeg" },
        body: file,
      });

      if (!putRes.ok) {
        setError("Failed to upload MP3");
        return;
      }

      setUploadedUrl(presignData.fileUrl);
      setUploadedFileName(file.name);
      setSourceType("UPLOAD");

      if (!title.trim()) {
        setTitle(file.name.replace(/\.mp3$/i, "").trim());
      }
    } catch {
      setError("Failed to upload MP3");
    } finally {
      setIsUploading(false);
    }
  }, [title]);

  // ---- step 2 handler ------------------------------------------------------

  const toggleGenre = useCallback((genreId: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) return prev.filter((id) => id !== genreId);
      if (prev.length >= 3) return prev;
      return [...prev, genreId];
    });
  }, []);

  // ---- step 3 handlers -----------------------------------------------------

  const creditBalance = profile?.reviewCredits ?? 0;
  const hasEnoughCredits = creditBalance >= reviewCount;
  const creditDeficit = reviewCount - creditBalance;

  const handleSubmit = useCallback(async () => {
    setError("");
    setIsSubmitting(true);

    try {
      // Build source info
      const isLink = uploadMode === "link";
      const trackSourceUrl = isLink ? url : uploadedUrl;
      const trackSourceType = isLink ? undefined : "UPLOAD";

      // 1. Create the track
      const createRes = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: trackSourceUrl,
          ...(trackSourceType ? { sourceType: trackSourceType } : {}),
          title: title.trim(),
          genreIds: selectedGenres,
          feedbackFocus: feedbackFocus.trim() || undefined,
          packageType: "STARTER",
          isPublic: false,
        }),
      });

      const trackData = await createRes.json();

      if (!createRes.ok) {
        setError(trackData.error || "Failed to create track");
        setIsSubmitting(false);
        return;
      }

      const trackId = trackData.id;

      // 2. Request reviews with credits
      const reviewRes = await fetch(`/api/tracks/${trackId}/request-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desiredReviews: reviewCount,
          useCredits: true,
        }),
      });

      if (!reviewRes.ok) {
        const reviewErr = await reviewRes.json().catch(() => null);
        setError(
          (reviewErr as { error?: string })?.error || "Failed to request reviews"
        );
        setIsSubmitting(false);
        return;
      }

      router.push(`/submit/success?trackId=${trackId}&reviews=${reviewCount}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }, [
    uploadMode,
    url,
    uploadedUrl,
    title,
    selectedGenres,
    feedbackFocus,
    reviewCount,
    router,
  ]);

  const handleUploadOnly = useCallback(async () => {
    setError("");
    setIsSubmitting(true);

    try {
      const isLink = uploadMode === "link";
      const trackSourceUrl = isLink ? url : uploadedUrl;
      const trackSourceType = isLink ? undefined : "UPLOAD";

      const createRes = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: trackSourceUrl,
          ...(trackSourceType ? { sourceType: trackSourceType } : {}),
          title: title.trim(),
          genreIds: selectedGenres,
          feedbackFocus: feedbackFocus.trim() || undefined,
          isPublic: false,
        }),
      });

      const trackData = await createRes.json();

      if (!createRes.ok) {
        setError(trackData.error || "Failed to create track");
        setIsSubmitting(false);
        return;
      }

      router.push(`/submit/success?trackId=${trackData.id}&reviews=0`);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }, [uploadMode, url, uploadedUrl, title, selectedGenres, feedbackFocus, router]);

  const handleBuyCredits = useCallback(async () => {
    setIsBuyingCredits(true);
    try {
      const pack = creditDeficit <= 5 ? 5 : creditDeficit <= 20 ? 20 : 50;
      const res = await fetch("/api/review-credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "pack", pack }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to start checkout");
      }
    } catch {
      setError("Failed to start checkout");
    } finally {
      setIsBuyingCredits(false);
    }
  }, [creditDeficit]);

  // ---- derived values -------------------------------------------------------

  const hasValidSource =
    uploadMode === "link"
      ? url.trim() !== "" && !urlError && !isLoadingMetadata && sourceType !== null
      : !!uploadedUrl && !isUploading;

  const hasValidDetails =
    title.trim().length > 0 && selectedGenres.length > 0;

  // ---- navigation -----------------------------------------------------------

  const goBack = () => {
    setError("");
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const goForward = () => {
    setError("");
    if (step === 1 && hasValidSource) setStep(2);
    if (step === 2 && hasValidDetails) setStep(3);
  };

  // ---- loading state --------------------------------------------------------

  if (profileLoading) {
    return (
      <div className="pt-16 px-6 sm:px-8 lg:px-12">
        <div className="max-w-6xl min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  // ---- render ---------------------------------------------------------------

  return (
    <div className="pt-16 px-6 sm:px-8 lg:px-12 pb-20">
      <div className="max-w-6xl">
        {/* Error display */}
        {error && (
          <Card variant="soft" className="mb-6 bg-red-50 border-red-200">
            <CardContent className="py-4">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* ================================================================= */}
        {/* STEP 1: Upload your track                                         */}
        {/* ================================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="mb-12 pb-8 border-b border-neutral-200">
              <h1 className="text-5xl sm:text-6xl font-light tracking-tight mb-3">
                Submit Track
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-neutral-500">Step 1 of 3</span>
                <span className="text-neutral-300">&bull;</span>
                <span className="text-neutral-500">Upload your track</span>
              </div>
            </div>

            {/* Upload mode toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setUploadMode("link");
                  setUploadedUrl("");
                  setUploadedFileName("");
                  setError("");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all duration-150",
                  uploadMode === "link"
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                )}
              >
                <Link2 className="h-4 w-4" />
                Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMode("file");
                  setUrl("");
                  setUrlError("");
                  setSourceType(null);
                  setError("");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-medium transition-all duration-150",
                  uploadMode === "file"
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                )}
              >
                <Upload className="h-4 w-4" />
                File
              </button>
            </div>

            {/* Link mode */}
            {uploadMode === "link" && (
              <Card variant="soft" elevated>
                <CardContent className="pt-5 space-y-3">
                  <Input
                    placeholder="Paste SoundCloud, Bandcamp, or YouTube link"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className={cn(
                      "h-11 rounded-xl border-neutral-200 bg-white focus:border-purple-500",
                      urlError && "border-red-500"
                    )}
                    autoFocus
                  />
                  <SupportedPlatforms activeSource={sourceType} variant="compact" />
                  {urlError && (
                    <p className="text-sm text-red-600 font-medium">{urlError}</p>
                  )}
                  {isLoadingMetadata && (
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Getting track info...
                    </div>
                  )}
                  {url && !urlError && !isLoadingMetadata && title && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Music className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-700">
                            Track detected
                          </span>
                        </div>
                        <p className="font-medium text-neutral-900 truncate mt-0.5">
                          {title}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* File mode */}
            {uploadMode === "file" && (
              <Card variant="soft" elevated>
                <CardContent className="pt-5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/mpeg,audio/mp3,.mp3"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFileUpload(file);
                    }}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (
                        file &&
                        (file.type === "audio/mpeg" || file.name.endsWith(".mp3"))
                      ) {
                        void handleFileUpload(file);
                      } else {
                        setError("Please upload an MP3 file");
                      }
                    }}
                    className={cn(
                      "rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors duration-150",
                      isDragging && "border-purple-400 bg-purple-50",
                      !isDragging &&
                        !uploadedFileName &&
                        "border-neutral-300 hover:border-purple-400 hover:bg-purple-50/50",
                      uploadedFileName &&
                        !isUploading &&
                        "border-emerald-400 bg-emerald-50"
                    )}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                        <p className="font-medium text-neutral-600">Uploading...</p>
                      </div>
                    ) : uploadedFileName ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-medium text-neutral-900">
                          {uploadedFileName}
                        </p>
                        <p className="text-sm text-neutral-500">Click to change</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <Upload className="h-6 w-6 text-purple-600" />
                        </div>
                        <p className="font-medium text-neutral-900">
                          Drop your MP3 here
                        </p>
                        <p className="text-sm text-neutral-500">
                          or click to browse (max 25 MB)
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Continue button */}
            <Button
              onClick={goForward}
              disabled={!hasValidSource}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2: Track details                                             */}
        {/* ================================================================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="mb-12 pb-8 border-b border-neutral-200">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              </div>
              <h1 className="text-5xl sm:text-6xl font-light tracking-tight mb-3">
                Track Details
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-neutral-500">Step 2 of 3</span>
                <span className="text-neutral-300">&bull;</span>
                <span className="text-neutral-500">Add title and genres</span>
              </div>
            </div>

            {/* Title */}
            <Card variant="soft" elevated>
              <CardContent className="pt-5 pb-5">
                <label
                  htmlFor="track-title"
                  className="block text-xs font-mono tracking-widest text-neutral-400 uppercase mb-2"
                >
                  Title
                </label>
                <Input
                  id="track-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's your track called?"
                  className="h-11 rounded-xl border-neutral-200 bg-white focus:border-purple-500"
                  autoFocus
                />
              </CardContent>
            </Card>

            {/* Genres */}
            <Card variant="soft" elevated>
              <CardContent className="pt-5">
                <p className="text-xs font-mono tracking-widest text-neutral-400 uppercase mb-2">
                  Genre{" "}
                  <span className="normal-case text-neutral-300">(1-3)</span>
                </p>
                {genres.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading genres...
                  </div>
                ) : (
                  <GenreSelector
                    genres={genres}
                    selectedIds={selectedGenres}
                    onToggle={toggleGenre}
                    maxSelections={3}
                    variant="artist"
                  />
                )}
              </CardContent>
            </Card>

            {/* Feedback focus (optional) */}
            <Card variant="soft" elevated>
              <CardContent className="pt-5">
                <label
                  htmlFor="feedback-focus"
                  className="block text-xs font-mono tracking-widest text-neutral-400 uppercase mb-2"
                >
                  Feedback focus{" "}
                  <span className="normal-case text-neutral-300">(optional)</span>
                </label>
                <textarea
                  id="feedback-focus"
                  value={feedbackFocus}
                  onChange={(e) => setFeedbackFocus(e.target.value)}
                  placeholder="Anything you want reviewers to focus on? e.g. mix balance, arrangement, vocal processing..."
                  rows={2}
                  maxLength={1000}
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm placeholder:text-neutral-400 focus:border-purple-500 focus:outline-none resize-none"
                />
              </CardContent>
            </Card>

            {/* Continue button */}
            <Button
              onClick={goForward}
              disabled={!hasValidDetails}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3: Request reviews (credit-based)                            */}
        {/* ================================================================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="mb-12 pb-8 border-b border-neutral-200">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              </div>
              <h1 className="text-5xl sm:text-6xl font-light tracking-tight mb-3">
                Request Reviews
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-neutral-500">Step 3 of 3</span>
                <span className="text-neutral-300">&bull;</span>
                <span className="text-neutral-500">Choose review count</span>
              </div>
            </div>

            {/* Credit balance */}
            <div className="flex items-center gap-3 rounded-xl bg-purple-50 border border-purple-200 px-4 py-3">
              <Coins className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <p className="text-sm font-medium text-purple-900">
                You have{" "}
                <span className="text-lg font-bold text-purple-600">
                  {creditBalance}
                </span>{" "}
                {creditBalance === 1 ? "credit" : "credits"}
              </p>
            </div>

            {/* Review count selector */}
            <div className="grid grid-cols-3 gap-3">
              {REVIEW_OPTIONS.map((option) => {
                const isSelected = reviewCount === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setReviewCount(option.value)}
                    className={cn(
                      "relative flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all duration-150",
                      isSelected
                        ? "border-purple-600 bg-purple-50 ring-1 ring-purple-600"
                        : "border-neutral-200 bg-white hover:border-purple-300"
                    )}
                  >
                    {option.recommended && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                        Recommended
                      </span>
                    )}
                    <Star
                      className={cn(
                        "h-5 w-5",
                        isSelected ? "text-purple-600" : "text-neutral-400"
                      )}
                    />
                    <span
                      className={cn(
                        "text-lg font-bold",
                        isSelected ? "text-purple-600" : "text-neutral-900"
                      )}
                    >
                      {option.value}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {option.credits} credits
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Enough credits -- submit */}
            {hasEnoughCredits && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Submit for Review
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {/* Not enough credits */}
            {!hasEnoughCredits && (
              <div className="space-y-4">
                <Card variant="soft" className="bg-amber-50 border-amber-200">
                  <CardContent className="py-4">
                    <p className="text-sm text-amber-800 font-medium">
                      You need {creditDeficit} more{" "}
                      {creditDeficit === 1 ? "credit" : "credits"} for{" "}
                      {reviewCount} reviews.
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  {/* Primary: earn credits */}
                  <Link href="/review" className="block">
                    <Button variant="primary" size="lg" className="w-full">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Review tracks to earn credits
                    </Button>
                  </Link>

                  {/* Secondary: buy credits */}
                  <Button
                    onClick={handleBuyCredits}
                    disabled={isBuyingCredits}
                    isLoading={isBuyingCredits}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    Buy {creditDeficit <= 5 ? 5 : creditDeficit <= 20 ? 20 : 50}{" "}
                    credits
                  </Button>

                  {/* Upsell: upgrade to Pro */}
                  <Link href="/account" className="block">
                    <Button variant="ghost" size="lg" className="w-full">
                      Upgrade to Pro &mdash; 10 credits/month
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Upload without reviews */}
            <div className="text-center pt-2">
              <button
                onClick={handleUploadOnly}
                disabled={isSubmitting}
                className="text-sm text-neutral-500 hover:text-purple-600 underline underline-offset-2 transition-colors"
              >
                Upload without reviews
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
