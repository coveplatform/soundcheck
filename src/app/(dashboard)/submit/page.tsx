"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GenreSelector } from "@/components/ui/genre-selector";
import { SupportedPlatforms } from "@/components/ui/supported-platforms";
import { cn } from "@/lib/utils";
import { validateTrackUrl, fetchTrackMetadata, detectSource } from "@/lib/metadata";
import { OutOfCreditsBanner } from "@/components/referral/out-of-credits-banner";
import {
  ArrowRight,
  ArrowLeft,
  Link2,
  Upload,
  Loader2,
  Check,
  Music,
  Coins,
  Sparkles,
  CheckCircle2,
  ImagePlus,
  Globe,
  Lock,
  AlertTriangle,
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
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);

  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingArtwork, setIsUploadingArtwork] = useState(false);

  // ---- step 2: details state ----------------------------------------------
  const [title, setTitle] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [feedbackFocus, setFeedbackFocus] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  // ---- step 3: review count state ----------------------------------------
  const [reviewCount, setReviewCount] = useState<number>(5);
  const [slotInfo, setSlotInfo] = useState<{ maxSlots: number; activeCount: number; isPro: boolean } | null>(null);

  // ---- shared UI state ----------------------------------------------------
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---- data fetching -------------------------------------------------------
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile({
            id: data.id,
            artistName: data.artistName,
            totalTracks: data.totalTracks ?? 0,
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
        console.error("Failed to load Genre:", err);
      }
    }
    loadGenres();
  }, []);

  // Fetch slot info
  useEffect(() => {
    async function loadSlots() {
      try {
        const res = await fetch("/api/slots");
        if (res.ok) {
          const data = await res.json();
          setSlotInfo({ maxSlots: data.maxSlots, activeCount: data.activeCount, isPro: data.isPro });
        }
      } catch (err) {
        console.error("Failed to load slots:", err);
      }
    }
    loadSlots();
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
        setArtworkUrl(metadata?.artworkUrl ?? null);
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

  const handleArtworkUpload = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("Image is too large. Maximum size is 5 MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WebP).");
      return;
    }

    setError("");
    setIsUploadingArtwork(true);

    try {
      const presignRes = await fetch("/api/uploads/artwork/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          contentLength: file.size,
        }),
      });

      if (!presignRes.ok) {
        // If cloud uploads not configured, create a local object URL as fallback
        if (presignRes.status === 501) {
          const objectUrl = URL.createObjectURL(file);
          setArtworkUrl(objectUrl);
          return;
        }
        const err = await presignRes.json().catch(() => null);
        setError((err as { error?: string })?.error || "Failed to upload artwork");
        return;
      }

      const presignData = await presignRes.json();

      const putRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": presignData.contentType },
        body: file,
      });

      if (!putRes.ok) {
        setError("Failed to upload artwork");
        return;
      }

      setArtworkUrl(presignData.fileUrl);
    } catch {
      setError("Failed to upload artwork");
    } finally {
      setIsUploadingArtwork(false);
    }
  }, []);

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
  const slotAvailable = !slotInfo || slotInfo.activeCount < slotInfo.maxSlots;

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
          artworkUrl: artworkUrl || undefined,
          genreIds: selectedGenres,
          feedbackFocus: feedbackFocus.trim() || undefined,
          isPublic,
        }),
      });

      const trackData = await createRes.json();

      if (!createRes.ok) {
        setError(trackData.error || "Failed to create track");
        setIsSubmitting(false);
        return;
      }

      const trackId = trackData.id;

      // 2. Request reviews using credits
      const reviewRes = await fetch(`/api/tracks/${trackId}/request-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desiredReviews: reviewCount,
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
    artworkUrl,
    selectedGenres,
    feedbackFocus,
    isPublic,
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
          artworkUrl: artworkUrl || undefined,
          genreIds: selectedGenres,
          feedbackFocus: feedbackFocus.trim() || undefined,
          isPublic,
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
  }, [uploadMode, url, uploadedUrl, title, artworkUrl, selectedGenres, feedbackFocus, router]);



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
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  // ---- render ---------------------------------------------------------------

  const stepLabels = ["Track", "Details", "Reviews"];

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
                Submit.
              </h1>
              <p className="text-sm text-black/40 font-medium mt-2">
                Get real feedback from fellow artists in your genre.
              </p>
            </div>
            {/* Step pills */}
            <div className="flex-shrink-0 flex items-center gap-2">
              {stepLabels.map((label, i) => {
                const s = i + 1;
                return (
                  <div key={s} className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-[11px] font-black uppercase tracking-wider transition-all",
                    s < step ? "bg-lime-400 border-lime-400 text-black" :
                    s === step ? "bg-black border-black text-white" :
                    "bg-white border-black/10 text-black/25"
                  )}>
                    {s < step ? <CheckCircle2 className="h-3 w-3" /> : <span>{s}</span>}
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Error display */}
        {error && (
          <div className="mb-6 bg-red-500 text-white rounded-2xl px-4 py-3">
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {/* Out of credits banner */}
        {profile && profile.reviewCredits <= 3 && <OutOfCreditsBanner />}

        {/* ================================================================= */}
        {/* STEP 1: Upload your track                                         */}
        {/* ================================================================= */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-1">Step 1</p>
              <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-none">Upload your track</h2>
              <p className="text-sm text-black/40 font-medium mt-1">Choose how you want to add your music</p>
            </div>

            {/* Upload mode toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setUploadMode("link");
                  setUploadedUrl("");
                  setUploadedFileName("");
                  setArtworkUrl(null);
                  setError("");
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border-2 font-black text-[11px] uppercase tracking-wider transition-all",
                  uploadMode === "link"
                    ? "bg-black border-black text-white"
                    : "bg-white border-black/10 text-black/40 hover:border-black/25 hover:text-black/70"
                )}
              >
                <Link2 className="h-3.5 w-3.5" />
                Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMode("file");
                  setUrl("");
                  setUrlError("");
                  setSourceType(null);
                  setArtworkUrl(null);
                  setError("");
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border-2 font-black text-[11px] uppercase tracking-wider transition-all",
                  uploadMode === "file"
                    ? "bg-black border-black text-white"
                    : "bg-white border-black/10 text-black/40 hover:border-black/25 hover:text-black/70"
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload MP3
              </button>
            </div>

            {/* Link mode */}
            {uploadMode === "link" && (
              <div className="space-y-3">
                <Input
                  placeholder="Paste SoundCloud, Bandcamp, YouTube, or Spotify link"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={cn(
                    "h-12 rounded-xl border-2 border-black/10 bg-white focus:border-purple-500",
                    urlError && "border-red-500"
                  )}
                  autoFocus
                />
                <SupportedPlatforms activeSource={sourceType} variant="compact" />
                {urlError && (
                  <p className="text-sm text-red-600 font-medium">{urlError}</p>
                )}
                {isLoadingMetadata && (
                  <div className="flex items-center gap-2 text-sm text-black/40">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting track info...
                  </div>
                )}
                {url && !urlError && !isLoadingMetadata && title && (
                  <div className="rounded-xl border-2 border-black/10 bg-white p-4 flex items-center gap-4 shadow-sm">
                    {artworkUrl ? (
                      <img
                        src={artworkUrl}
                        alt=""
                        className="h-14 w-14 rounded-lg object-cover flex-shrink-0 border border-black/10"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Music className="h-6 w-6 text-white/70" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-black truncate">
                        {title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-black/40">
                          {sourceType === "SOUNDCLOUD" ? "SoundCloud" : sourceType === "BANDCAMP" ? "Bandcamp" : sourceType === "YOUTUBE" ? "YouTube" : sourceType === "SPOTIFY" ? "Spotify" : "Ready"}
                        </span>
                      </div>
                    </div>
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
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
                      "border-black/10 hover:border-purple-400 hover:bg-purple-50/50",
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
                        <p className="font-black text-black">
                          {uploadedFileName}
                        </p>
                        <p className="text-sm text-black/40 mt-1">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center">
                        <Upload className="h-7 w-7 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-black text-black">
                          Drop your MP3 here
                        </p>
                        <p className="text-sm text-black/40 mt-1">
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
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-1">Step 2</p>
                <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-none">Track details</h2>
                <p className="text-sm text-black/40 font-medium mt-1">Add title and genres</p>
              </div>
              <button
                onClick={goBack}
                className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors mt-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
            </div>

            {/* Title + Artwork */}
            <div className="flex gap-4 items-start">
              {/* Artwork thumbnail - clickable */}
              <div className="flex-shrink-0">
                <input
                  ref={artworkInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleArtworkUpload(file);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => artworkInputRef.current?.click()}
                  disabled={isUploadingArtwork}
                  className="group relative h-[72px] w-[72px] rounded-xl border-2 border-dashed border-black/10 hover:border-black/20 bg-white hover:bg-neutral-50 overflow-hidden transition-all duration-150 ease-out flex items-center justify-center"
                >
                  {isUploadingArtwork ? (
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                  ) : artworkUrl ? (
                    <>
                      <img src={artworkUrl} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <ImagePlus className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5">
                      <ImagePlus className="h-5 w-5 text-neutral-400 group-hover:text-purple-500 transition-colors" />
                      <span className="text-[10px] font-medium text-neutral-400 group-hover:text-purple-500 transition-colors">Art</span>
                    </div>
                  )}
                </button>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="track-title"
                  className="block text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2"
                >
                  Title
                </label>
                <Input
                  id="track-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's your track called?"
                  className="h-12 rounded-xl border-2 border-black/10 bg-white focus:border-purple-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Genres */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2">
                Genres <span className="text-neutral-400">(select 1-3)</span>
              </label>
              {genres.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-black/40">
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
                className="block text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2"
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
                className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm placeholder:text-black/25 focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-3">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-150 ease-out",
                    !isPublic
                      ? "border-purple-500 bg-purple-50/60"
                      : "border-black/10 bg-white hover:border-black/20"
                  )}
                >
                  <Lock className={cn("h-5 w-5", !isPublic ? "text-purple-600" : "text-neutral-400")} />
                  <span className={cn("text-sm font-semibold", !isPublic ? "text-purple-700" : "text-neutral-600")}>Private</span>
                  <span className="text-[11px] text-black/40 text-center leading-snug">
                    Only you and assigned reviewers can access this track
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-150 ease-out",
                    isPublic
                      ? "border-purple-500 bg-purple-50/60"
                      : "border-black/10 bg-white hover:border-black/20"
                  )}
                >
                  <Globe className={cn("h-5 w-5", isPublic ? "text-purple-600" : "text-neutral-400")} />
                  <span className={cn("text-sm font-semibold", isPublic ? "text-purple-700" : "text-neutral-600")}>Public</span>
                  <span className="text-[11px] text-black/40 text-center leading-snug">
                    Discoverable by the community, eligible for Top Rated charts, and shareable via link
                  </span>
                </button>
              </div>
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
        {/* STEP 3: Review count                                              */}
        {/* ================================================================= */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-1">Step 3</p>
                <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-none">How many reviews?</h2>
                <p className="text-sm text-black/40 font-medium mt-1">Each review costs 1 credit</p>
              </div>
              <button
                onClick={goBack}
                className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors mt-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
            </div>

            {/* Slot full warning */}
            {!slotAvailable && (
              <div className="bg-amber-400 rounded-2xl px-5 py-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-black mb-1">Your review slot is full</p>
                  <p className="text-sm text-black/70 font-medium">
                    You can have {slotInfo?.maxSlots ?? 1} track{(slotInfo?.maxSlots ?? 1) > 1 ? "s" : ""} in the queue at a time. Wait for current reviews to complete, or{" "}
                    <Link href="/pro" className="font-black underline underline-offset-2">upgrade to Pro</Link>{" "}for 3 slots.
                  </p>
                </div>
              </div>
            )}

            {/* Review count card */}
            <div className="bg-white rounded-2xl border-2 border-black/8 p-6 space-y-6">
              {/* Big number */}
              <div className="text-center">
                <div className="inline-flex items-baseline gap-2">
                  <span className="text-6xl font-black text-black tabular-nums">{reviewCount}</span>
                  <span className="text-xl text-black/40 font-black">{reviewCount === 1 ? "review" : "reviews"}</span>
                </div>
                <p className="text-sm text-black/40 font-medium mt-1">
                  {reviewCount} {reviewCount === 1 ? "credit" : "credits"} required
                </p>
              </div>

              {/* Slider */}
              <div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={reviewCount}
                  onChange={(e) => setReviewCount(parseInt(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(147 51 234) 0%, rgb(147 51 234) ${((reviewCount - 1) / 9) * 100}%, rgb(229 231 235) ${((reviewCount - 1) / 9) * 100}%, rgb(229 231 235) 100%)`
                  }}
                />
                <div className="flex justify-between mt-2">
                  {[1, 3, 5, 7, 10].map((mark) => (
                    <button
                      key={mark}
                      type="button"
                      onClick={() => setReviewCount(mark)}
                      className={cn(
                        "text-xs font-black transition-colors",
                        reviewCount === mark ? "text-purple-600" : "text-black/25 hover:text-purple-600"
                      )}
                    >
                      {mark}
                    </button>
                  ))}
                </div>
              </div>

              {/* Insight level */}
              <div className="border-t-2 border-black/8 pt-5">
                <div className="flex items-center gap-1.5 mb-2">
                  {REVIEW_BENEFITS.filter((b) => b.minReviews <= 10).map((benefit) => (
                    <div
                      key={benefit.label}
                      className={cn(
                        "h-2 flex-1 rounded-full transition-all duration-300",
                        reviewCount >= benefit.minReviews ? "bg-purple-600" : "bg-black/8"
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm font-black text-black">
                  {REVIEW_BENEFITS.filter((b) => reviewCount >= b.minReviews).slice(-1)[0]?.icon}{" "}
                  {REVIEW_BENEFITS.filter((b) => reviewCount >= b.minReviews).slice(-1)[0]?.label || "Select reviews"}
                </p>
                <p className="text-[11px] text-black/30 font-medium mt-0.5">Current insight level</p>
              </div>

              {/* Credit balance */}
              <div className="border-t-2 border-black/8 pt-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-black/30">Available</p>
                  <p className={`text-3xl font-black tabular-nums ${creditBalance === 0 ? "text-red-500" : "text-black"}`}>{creditBalance}</p>
                  <p className="text-[11px] text-black/30 font-medium">credits</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-black uppercase tracking-wider text-black/30">Will use</p>
                  <p className={`text-3xl font-black tabular-nums ${!hasEnoughCredits ? "text-red-500" : "text-purple-600"}`}>{reviewCount}</p>
                  <p className="text-[11px] text-black/30 font-medium">credits</p>
                </div>
              </div>
            </div>

            {/* Not enough credits */}
            {!hasEnoughCredits && (
              <div className="bg-neutral-900 rounded-2xl px-5 py-5 space-y-3">
                <p className="text-base font-black text-white">
                  You need {creditDeficit} more {creditDeficit === 1 ? "credit" : "credits"}
                </p>
                <p className="text-sm text-white/40 font-medium">Earn free credits by reviewing other artists&apos; tracks.</p>
                <Link
                  href="/review"
                  className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-[11px] font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  Earn credits by reviewing
                </Link>
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!hasEnoughCredits || !slotAvailable || isSubmitting}
              isLoading={isSubmitting}
              className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all h-12 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
            >
              Submit for Review
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <div className="text-center">
              <button
                onClick={handleUploadOnly}
                disabled={isSubmitting}
                className="text-sm text-black/30 hover:text-purple-600 font-bold underline underline-offset-2 transition-colors"
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
