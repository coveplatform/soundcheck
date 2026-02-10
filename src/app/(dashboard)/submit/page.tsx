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
  CheckCircle2,
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

// Benefits that unlock at different review counts
const REVIEW_BENEFITS = [
  { minReviews: 1, label: "Get initial feedback", icon: "💬" },
  { minReviews: 3, label: "Start seeing patterns", icon: "📊" },
  { minReviews: 5, label: "Reliable consensus", icon: "✓" },
  { minReviews: 8, label: "Detailed insights", icon: "🔍" },
  { minReviews: 12, label: "Statistical significance", icon: "📈" },
  { minReviews: 20, label: "Comprehensive feedback", icon: "⭐" },
  { minReviews: 30, label: "Expert-level analysis", icon: "🎯" },
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
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

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
      // Calculate the best pack size based on deficit
      let pack: 3 | 10 | 25;
      if (creditDeficit <= 3) pack = 3;
      else if (creditDeficit <= 10) pack = 10;
      else pack = 25;

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
      <div className="pt-8 pb-24">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  // ---- render ---------------------------------------------------------------

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-3xl mx-auto px-6 sm:px-8">
        {/* Header with step indicator */}
        <div className="mb-8 pb-6 border-b border-black/10">
          <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-black/40">
            Submit
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-black mt-2">
            Submit Track
          </h1>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-full border-2 transition-all",
                    s < step
                      ? "bg-purple-600 border-purple-600"
                      : s === step
                      ? "bg-purple-600 border-purple-600"
                      : "bg-white border-neutral-200"
                  )}
                >
                  {s < step ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-bold",
                        s === step ? "text-white" : "text-neutral-400"
                      )}
                    >
                      {s}
                    </span>
                  )}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      "h-0.5 w-12 transition-colors",
                      s < step ? "bg-purple-600" : "bg-neutral-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 1: Upload your track                                         */}
        {/* ================================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-black mb-1">Upload your track</h2>
              <p className="text-sm text-neutral-600">Choose how you want to add your music</p>
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
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold transition-all",
                  uploadMode === "link"
                    ? "border-purple-600 bg-purple-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-purple-300"
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
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold transition-all",
                  uploadMode === "file"
                    ? "border-purple-600 bg-purple-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-purple-300"
                )}
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
            </div>

            {/* Link mode */}
            {uploadMode === "link" && (
              <div className="space-y-3">
                <Input
                  placeholder="Paste SoundCloud, Bandcamp, or YouTube link"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={cn(
                    "h-12 rounded-xl border-2 border-neutral-200 bg-white focus:border-purple-500",
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
                  <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
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
              </div>
            )}

            {/* File mode */}
            {uploadMode === "file" && (
              <div>
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
                    "rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all",
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
                      <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                      <p className="font-medium text-neutral-600">Uploading...</p>
                    </div>
                  ) : uploadedFileName ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">
                          {uploadedFileName}
                        </p>
                        <p className="text-sm text-neutral-500 mt-1">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center">
                        <Upload className="h-7 w-7 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">
                          Drop your MP3 here
                        </p>
                        <p className="text-sm text-neutral-500 mt-1">
                          or click to browse (max 25 MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Continue button */}
            <Button
              onClick={goForward}
              disabled={!hasValidSource}
              className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 ease-out h-12 rounded-xl"
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black mb-1">Track details</h2>
                <p className="text-sm text-neutral-600">Add title and genres</p>
              </div>
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-neutral-500 hover:text-black transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="track-title"
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                Title
              </label>
              <Input
                id="track-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your track called?"
                className="h-12 rounded-xl border-2 border-neutral-200 bg-white focus:border-purple-500"
                autoFocus
              />
            </div>

            {/* Genres */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Genres <span className="text-neutral-400">(select 1-3)</span>
              </label>
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
            </div>

            {/* Feedback focus (optional) */}
            <div>
              <label
                htmlFor="feedback-focus"
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                Feedback focus <span className="text-neutral-400">(optional)</span>
              </label>
              <textarea
                id="feedback-focus"
                value={feedbackFocus}
                onChange={(e) => setFeedbackFocus(e.target.value)}
                placeholder="Anything you want reviewers to focus on? e.g. mix balance, arrangement, vocal processing..."
                rows={3}
                maxLength={1000}
                className="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm placeholder:text-neutral-400 focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>

            {/* Continue button */}
            <Button
              onClick={goForward}
              disabled={!hasValidDetails}
              className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 ease-out h-12 rounded-xl"
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black mb-1">Request reviews</h2>
                <p className="text-sm text-neutral-600">How many reviews do you want?</p>
              </div>
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-neutral-500 hover:text-black transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </div>

            {/* Credit balance */}
            <div className="flex items-center gap-3 rounded-xl bg-purple-50 border-2 border-purple-200 px-4 py-3">
              <Coins className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <p className="text-sm font-medium text-purple-900">
                You have{" "}
                <span className="text-lg font-bold text-purple-600">
                  {creditBalance}
                </span>{" "}
                {creditBalance === 1 ? "credit" : "credits"}
              </p>
            </div>

            {/* Review count slider */}
            <div className="bg-white border-2 border-neutral-200 rounded-2xl p-6 shadow-sm">
              {/* Large display */}
              <div className="text-center mb-6">
                <div className="inline-flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-purple-600 tabular-nums">
                    {reviewCount}
                  </span>
                  <span className="text-xl text-neutral-600 font-medium">
                    {reviewCount === 1 ? "review" : "reviews"}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mt-2">
                  {reviewCount} {reviewCount === 1 ? "credit" : "credits"} required
                </p>
              </div>

              {/* Slider */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={reviewCount}
                    onChange={(e) => setReviewCount(parseInt(e.target.value))}
                    onMouseDown={() => setIsDraggingSlider(true)}
                    onMouseUp={() => setIsDraggingSlider(false)}
                    onTouchStart={() => setIsDraggingSlider(true)}
                    onTouchEnd={() => setIsDraggingSlider(false)}
                    className="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110"
                    style={{
                      background: `linear-gradient(to right, rgb(147 51 234) 0%, rgb(147 51 234) ${((reviewCount - 1) / 49) * 100}%, rgb(229 231 235) ${((reviewCount - 1) / 49) * 100}%, rgb(229 231 235) 100%)`
                    }}
                  />

                  {/* Quick select markers */}
                  <div className="flex justify-between mt-2 px-1">
                    {[1, 5, 10, 20, 30, 50].map((mark) => (
                      <button
                        key={mark}
                        type="button"
                        onClick={() => setReviewCount(mark)}
                        className={cn(
                          "text-xs font-medium transition-colors",
                          reviewCount === mark
                            ? "text-purple-600"
                            : "text-neutral-400 hover:text-purple-600"
                        )}
                      >
                        {mark}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Unlocked benefits - show current level */}
              <div className="text-center py-4 border-t border-neutral-200">
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  {REVIEW_BENEFITS.map((benefit) => (
                    <div
                      key={benefit.label}
                      className={cn(
                        "h-1.5 w-8 rounded-full transition-all duration-300",
                        reviewCount >= benefit.minReviews
                          ? "bg-purple-600"
                          : "bg-neutral-200"
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm font-medium text-neutral-900">
                  {REVIEW_BENEFITS.filter((b) => reviewCount >= b.minReviews).slice(-1)[0]?.label || "Select reviews"}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Current insight level
                </p>
              </div>
            </div>

            {/* Enough credits -- submit */}
            {hasEnoughCredits && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 ease-out h-12 rounded-xl"
              >
                Submit for Review
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {/* Not enough credits */}
            {!hasEnoughCredits && (
              <div className="space-y-4">
                <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-4">
                  <p className="text-sm text-amber-800 font-medium">
                    You need {creditDeficit} more{" "}
                    {creditDeficit === 1 ? "credit" : "credits"} for{" "}
                    {reviewCount} reviews.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Primary: earn credits */}
                  <Link href="/review">
                    <Button className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 ease-out h-12 rounded-xl">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Review tracks to earn credits
                    </Button>
                  </Link>

                  {/* Secondary: buy credits */}
                  <Button
                    onClick={handleBuyCredits}
                    disabled={isBuyingCredits}
                    isLoading={isBuyingCredits}
                    className="w-full border-2 border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 h-12 rounded-xl font-semibold"
                  >
                    Buy {creditDeficit <= 3 ? 3 : creditDeficit <= 10 ? 10 : 25} credits — {
                      creditDeficit <= 3 ? "$2.95" :
                      creditDeficit <= 10 ? "$7.95" :
                      "$14.95"
                    }
                  </Button>

                  {/* Upsell: upgrade to Pro */}
                  <Link href="/account">
                    <Button className="w-full border-2 border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 h-12 rounded-xl font-medium">
                      Upgrade to Pro — 10 credits/month
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
