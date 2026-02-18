"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { OutOfCreditsBanner } from "@/components/referral/out-of-credits-banner";
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
  ImagePlus,
  Globe,
  Lock,
  Zap,
  Clock,
  Target,
  MessageSquare,
  CreditCard,
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

  // ---- step 3: product selection state ------------------------------------
  const [selectedProduct, setSelectedProduct] = useState<"RELEASE_DECISION" | "PEER">("RELEASE_DECISION");
  const [rdPaymentMethod, setRdPaymentMethod] = useState<"cash" | "credits">("cash");

  // ---- step 3: general feedback state (for PEER product) -----------------
  const [reviewCount, setReviewCount] = useState<number>(5);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [requestProReviewers, setRequestProReviewers] = useState(false);
  const [rushDelivery, setRushDelivery] = useState(false);

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

  // Calculate cash add-ons
  const cashAddOns = useMemo(() => {
    let total = 0;
    if (requestProReviewers) {
      total += reviewCount * 2; // $2 per review
    }
    if (rushDelivery) {
      total += 10; // $10 flat fee
    }
    return total;
  }, [requestProReviewers, rushDelivery, reviewCount]);

  // Release Decision submit handler
  const handleReleaseDecisionSubmit = useCallback(async () => {
    setError("");
    setIsSubmitting(true);

    try {
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
          packageType: "RELEASE_DECISION",
        }),
      });

      const trackData = await createRes.json();

      if (!createRes.ok) {
        setError(trackData.error || "Failed to create track");
        setIsSubmitting(false);
        return;
      }

      const trackId = trackData.id;

      // 2. Route to Release Decision checkout
      const res = await fetch(`/api/tracks/${trackId}/checkout-release-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: rdPaymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to process Release Decision request");
        setIsSubmitting(false);
        return;
      }

      if (rdPaymentMethod === "cash" && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
        return;
      } else {
        // Credits payment successful
        router.push(`/submit/success?trackId=${trackId}&releaseDecision=true`);
      }
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
    rdPaymentMethod,
    router,
  ]);

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

      // 2. Route based on whether there are cash add-ons
      if (cashAddOns > 0) {
        // Route to add-ons checkout
        console.log('Cash add-ons detected:', cashAddOns, 'Creating checkout for track:', trackId);

        const res = await fetch(`/api/tracks/${trackId}/checkout-addons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewCount,
            requestProReviewers,
            rushDelivery,
          }),
        });

        const data = await res.json();
        console.log('Checkout response:', res.status, data);

        if (!res.ok) {
          console.error('Checkout failed:', data);
          setError(data.error || "Failed to create checkout. Please try again.");
          setIsSubmitting(false);
          return;
        }

        if (data.url) {
          console.log('Redirecting to Stripe:', data.url);
          window.location.href = data.url; // Redirect to Stripe
          return; // Stop execution after redirect
        } else {
          console.error('No checkout URL returned:', data);
          setError("Checkout session created but no payment URL returned. Please contact support.");
          setIsSubmitting(false);
          return;
        }
      } else {
        // Credits-only path (existing flow)
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
      }
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
    requestProReviewers,
    rushDelivery,
    cashAddOns,
    router,
    profile,
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  // ---- render ---------------------------------------------------------------

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
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

        {/* Out of credits banner */}
        {profile && profile.reviewCredits <= 3 && <OutOfCreditsBanner />}

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
                  setArtworkUrl(null);
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
                  setArtworkUrl(null);
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
                      <p className="font-semibold text-black truncate">
                        {title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-neutral-500">
                          {sourceType === "SOUNDCLOUD" ? "SoundCloud" : sourceType === "BANDCAMP" ? "Bandcamp" : sourceType === "YOUTUBE" ? "YouTube" : "Ready"}
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
                  className="group relative h-[72px] w-[72px] rounded-xl border-2 border-dashed border-neutral-300 hover:border-purple-400 bg-neutral-50 hover:bg-purple-50/50 overflow-hidden transition-all duration-150 ease-out flex items-center justify-center"
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

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
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
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  )}
                >
                  <Lock className={cn("h-5 w-5", !isPublic ? "text-purple-600" : "text-neutral-400")} />
                  <span className={cn("text-sm font-semibold", !isPublic ? "text-purple-700" : "text-neutral-600")}>Private</span>
                  <span className="text-[11px] text-neutral-500 text-center leading-snug">
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
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  )}
                >
                  <Globe className={cn("h-5 w-5", isPublic ? "text-purple-600" : "text-neutral-400")} />
                  <span className={cn("text-sm font-semibold", isPublic ? "text-purple-700" : "text-neutral-600")}>Public</span>
                  <span className="text-[11px] text-neutral-500 text-center leading-snug">
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
        {/* STEP 3: Choose product                                            */}
        {/* ================================================================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black mb-1">What do you need?</h2>
                <p className="text-sm text-neutral-600">Choose the type of feedback</p>
              </div>
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-neutral-500 hover:text-black transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </div>

            {/* Product Selection Cards */}
            <div className="space-y-4">
              {/* Release Decision Card */}
              <button
                type="button"
                onClick={() => setSelectedProduct("RELEASE_DECISION")}
                className={cn(
                  "w-full text-left rounded-2xl border-2 p-6 transition-all",
                  selectedProduct === "RELEASE_DECISION"
                    ? "border-purple-600 bg-purple-50/60 shadow-lg"
                    : "border-neutral-200 bg-white hover:border-purple-300"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                      selectedProduct === "RELEASE_DECISION" ? "bg-purple-600" : "bg-purple-100"
                    )}
                  >
                    <Target
                      className={cn(
                        "h-5 w-5",
                        selectedProduct === "RELEASE_DECISION" ? "text-white" : "text-purple-600"
                      )}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-black">Release Decision</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                        RECOMMENDED
                      </span>
                    </div>

                    <p className="text-sm text-neutral-600 mb-3">
                      Should I release this track? Get a professional verdict with actionable fixes.
                    </p>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <span>Go/No-Go verdict from experts</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <span>Top 3 fixes ranked by impact</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <span>Release readiness score (0-100)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <span>10-12 expert reviewers only</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <span>48-hour delivery guarantee</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-purple-600">$39</span>
                      <span className="text-sm text-neutral-500">or 15 credits</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* General Feedback Card */}
              <button
                type="button"
                onClick={() => setSelectedProduct("PEER")}
                className={cn(
                  "w-full text-left rounded-2xl border-2 p-6 transition-all",
                  selectedProduct === "PEER"
                    ? "border-purple-600 bg-purple-50/60 shadow-lg"
                    : "border-neutral-200 bg-white hover:border-purple-300"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                      selectedProduct === "PEER" ? "bg-purple-600" : "bg-neutral-100"
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        "h-5 w-5",
                        selectedProduct === "PEER" ? "text-white" : "text-neutral-600"
                      )}
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-black mb-1">General Feedback</h3>

                    <p className="text-sm text-neutral-600 mb-3">
                      Get listener opinions and reactions using your credits.
                    </p>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                        <span>Choose review count (1-50)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                        <span>Genre-matched reviewers</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                        <span>Individual review cards</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                        <span>Optional add-ons available</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-neutral-700">1 credit/review</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Conditional Content - Release Decision */}
            {selectedProduct === "RELEASE_DECISION" && (
              <div className="space-y-4">
                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Payment method
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRdPaymentMethod("cash")}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                        rdPaymentMethod === "cash"
                          ? "border-purple-600 bg-purple-50/60"
                          : "border-neutral-200 bg-white hover:border-neutral-300"
                      )}
                    >
                      <CreditCard
                        className={cn(
                          "h-5 w-5",
                          rdPaymentMethod === "cash" ? "text-purple-600" : "text-neutral-400"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          rdPaymentMethod === "cash" ? "text-purple-700" : "text-neutral-600"
                        )}
                      >
                        Pay $39
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRdPaymentMethod("credits")}
                      disabled={creditBalance < 15}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                        rdPaymentMethod === "credits"
                          ? "border-purple-600 bg-purple-50/60"
                          : "border-neutral-200 bg-white hover:border-neutral-300",
                        creditBalance < 15 && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Coins
                        className={cn(
                          "h-5 w-5",
                          rdPaymentMethod === "credits" ? "text-purple-600" : "text-neutral-400"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          rdPaymentMethod === "credits" ? "text-purple-700" : "text-neutral-600"
                        )}
                      >
                        Use 15 Credits
                      </span>
                      {creditBalance < 15 && (
                        <span className="text-xs text-red-600">Need {15 - creditBalance} more</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Credit Balance Display */}
                <div className="flex items-center gap-3 rounded-xl bg-purple-50 border-2 border-purple-200 px-4 py-3">
                  <Coins className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-purple-900">
                    You have{" "}
                    <span className="text-lg font-bold text-purple-600">{creditBalance}</span>{" "}
                    {creditBalance === 1 ? "credit" : "credits"}
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleReleaseDecisionSubmit}
                  disabled={isSubmitting || (rdPaymentMethod === "credits" && creditBalance < 15)}
                  isLoading={isSubmitting}
                  className="w-full bg-purple-600 text-white hover:bg-purple-700 h-12 rounded-xl font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                >
                  {rdPaymentMethod === "cash" ? "Pay $39" : "Use 15 Credits"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                {/* Info Box */}
                <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
                  <p className="text-sm text-purple-900">
                    <strong>What happens next:</strong> Your track will be assigned to 10-12
                    expert reviewers (100+ reviews, 4.5+ rating). You'll receive your compiled
                    Release Decision Report within 48 hours.
                  </p>
                </div>
              </div>
            )}

            {/* Conditional Content - General Feedback (PEER) */}
            {selectedProduct === "PEER" && (
              <div className="space-y-6">
                {/* Credit Balance Display */}
                <div className="flex items-center gap-3 rounded-xl bg-purple-50 border-2 border-purple-200 px-4 py-3">
                  <Coins className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-purple-900">
                    You have{" "}
                    <span className="text-lg font-bold text-purple-600">{creditBalance}</span>{" "}
                    {creditBalance === 1 ? "credit" : "credits"}
                  </p>
                </div>

                {/* Insufficient credits warning */}
                {!hasEnoughCredits && reviewCount > 0 && (
              <div className="rounded-xl bg-amber-50 border-2 border-amber-300 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold text-xs">!</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900 mb-1">
                      Not enough credits
                    </p>
                    <p className="text-sm text-amber-800">
                      You need <strong>{creditDeficit} more {creditDeficit === 1 ? "credit" : "credits"}</strong> to request {reviewCount} reviews.
                      {cashAddOns > 0 && (
                        <span className="block mt-1 text-xs">
                          (Add-ons are upgrades on top of base credits)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

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

            {/* Estimated turnaround */}
            <div className="rounded-xl border border-black/8 bg-white/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-black/40" />
                <span className="text-sm font-semibold text-black">Estimated turnaround</span>
              </div>
              <p className="text-sm text-black/60">
                {rushDelivery ? '10-24 hours' : `${Math.min(10 + reviewCount * 2, 40)} hours`} for {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Review Quality Card */}
            <div className="bg-white border-2 border-neutral-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-black mb-4">Review Quality</h3>

              <div className="space-y-3">
                {/* Pro Reviewers Checkbox */}
                <label className="flex items-start gap-3 p-4 rounded-xl border-2 hover:border-purple-300 cursor-pointer transition-all"
                  style={{ borderColor: requestProReviewers ? 'rgb(147 51 234)' : 'rgb(229 231 235)' }}>
                  <input
                    type="checkbox"
                    checked={requestProReviewers}
                    onChange={(e) => setRequestProReviewers(e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-black">Verified Reviewers</span>
                      <span className="text-sm text-purple-600 font-bold">+${(reviewCount * 2).toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-neutral-600">100+ reviews completed, 4.5+ average rating</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Delivery Speed Card */}
            <div className="bg-white border-2 border-neutral-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-black mb-4">Delivery Speed</h3>

              <label className="flex items-start gap-3 p-4 rounded-xl border-2 hover:border-purple-300 cursor-pointer transition-all"
                style={{ borderColor: rushDelivery ? 'rgb(147 51 234)' : 'rgb(229 231 235)' }}>
                <input
                  type="checkbox"
                  checked={rushDelivery}
                  onChange={(e) => setRushDelivery(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span className="font-semibold text-black">Rush Delivery</span>
                    <span className="text-sm text-orange-600 font-bold">+$10.00</span>
                  </div>
                  <p className="text-sm text-neutral-600">All reviews delivered within 30 minutes</p>
                </div>
              </label>
            </div>

            {/* Pricing Summary */}
            {(requestProReviewers || rushDelivery) && (
              <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-700">{reviewCount} reviews</span>
                    <span className="font-medium">{reviewCount} credits</span>
                  </div>
                  {requestProReviewers && (
                    <div className="flex justify-between">
                      <span className="text-neutral-700">Verified reviewers</span>
                      <span className="font-medium">+${(reviewCount * 2).toFixed(2)}</span>
                    </div>
                  )}
                  {rushDelivery && (
                    <div className="flex justify-between">
                      <span className="text-neutral-700">Rush delivery</span>
                      <span className="font-medium">+$10.00</span>
                    </div>
                  )}
                  <div className="border-t border-purple-300 pt-2 flex justify-between font-bold text-black">
                    <span>Total</span>
                    <div className="text-right">
                      <div>{reviewCount} credits</div>
                      {cashAddOns > 0 && (
                        <div className="text-purple-600">+ ${cashAddOns.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit button - always visible, disabled if insufficient credits */}
            <Button
              onClick={handleSubmit}
              disabled={!hasEnoughCredits || isSubmitting}
              isLoading={isSubmitting}
              className="w-full bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150 ease-out h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
            >
              Submit for Review
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            {/* Options when not enough credits */}
            {!hasEnoughCredits && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-center text-amber-800 font-medium">
                  Need {creditDeficit} more {creditDeficit === 1 ? "credit" : "credits"}? Get them below:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {/* Earn credits */}
                  <Link href="/review" className="flex-1">
                    <Button variant="outline" className="w-full h-11 text-sm font-semibold">
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Earn credits
                    </Button>
                  </Link>

                  {/* Buy credits */}
                  <Button
                    onClick={handleBuyCredits}
                    disabled={isBuyingCredits}
                    isLoading={isBuyingCredits}
                    variant="outline"
                    className="w-full h-11 text-sm font-semibold"
                  >
                    Buy {creditDeficit <= 3 ? 3 : creditDeficit <= 10 ? 10 : 25} credits
                  </Button>
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
        )}
      </div>
    </div>
  );
}
