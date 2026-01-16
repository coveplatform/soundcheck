"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Upload, Gift, Music, ArrowRight, ChevronDown } from "lucide-react";
import { GenreSelector } from "@/components/ui/genre-selector";
import { cn } from "@/lib/utils";
import { validateTrackUrl, fetchTrackMetadata, detectSource, ACTIVE_PACKAGE_TYPES, PACKAGES, PackageType } from "@/lib/metadata";
import { AudioPlayer } from "@/components/audio/audio-player";
import { SupportedPlatforms, PlatformBadge } from "@/components/ui/supported-platforms";
import { VerifyEmailBanner } from "@/components/ui/verify-email-banner";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

type Step = "artist" | "track" | "details" | "package" | "confirm";

export default function SubmitTrackPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("track");

  // Artist profile state
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [artistName, setArtistName] = useState("");
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Form state
  const [inputMode, setInputMode] = useState<"url" | "upload">("url");
  const [url, setUrl] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedDuration, setUploadedDuration] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [artworkUrl, setArtworkUrl] = useState<string | undefined>();
  const [feedbackFocus, setFeedbackFocus] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>("STANDARD");
  const [useFreeTrial, setUseFreeTrial] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [allowPurchase, setAllowPurchase] = useState(false);

  // UI state
  const [genres, setGenres] = useState<Genre[]>([]);
  const [urlError, setUrlError] = useState("");
  const [urlWarning, setUrlWarning] = useState("");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sourceType, setSourceType] = useState<"SOUNDCLOUD" | "BANDCAMP" | "YOUTUBE" | "UPLOAD" | null>(null);

  // Free credit state
  const [freeCredits, setFreeCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);

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

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/artist/profile");
        if (response.ok) {
          const data = await response.json();
          setFreeCredits(data.freeReviewCredits ?? 0);
          setHasProfile(true);
        } else if (response.status === 404) {
          // No profile yet - need to ask for artist name
          setHasProfile(false);
          setStep("artist");
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        // On error, assume no profile and ask for artist name
        setHasProfile(false);
        setStep("artist");
      } finally {
        setIsLoadingCredits(false);
      }
    }
    fetchProfile();
  }, []);

  const handleUrlChange = async (value: string) => {
    setUrl(value);
    setUrlError("");
    setUrlWarning("");
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
      if (metadata) {
        if (typeof metadata.title === "string" && metadata.title.trim()) {
          setTitle(metadata.title);
          setUrlWarning(""); // Clear warning if metadata was fetched successfully
        }
        if (metadata.artworkUrl) {
          setArtworkUrl(metadata.artworkUrl);
        }
      } else {
        // Metadata fetch returned null - link might be private or invalid
        setUrlWarning("We couldn't verify this link. Make sure it's public and accessible.");
      }
    } catch {
      // Metadata fetch failed - link might be private, deleted, or invalid
      setUrlWarning("We couldn't verify this link. Make sure it's public and accessible.");
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleUpload = async (file: File) => {
    setError("");
    setUrlError("");
    setRequiresEmailVerification(false);
    setIsUploading(true);
    setUploadedDuration(null);
    setUploadedUrl("");
    const fileName = file.name;

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
        if (presignRes.status === 403) {
          setRequiresEmailVerification(true);
          setError("Please verify your email to upload tracks");
          return;
        }

        const presignError = (await presignRes.json().catch(() => null)) as
          | { error?: string; missing?: string[] }
          | null;

        if (presignRes.status === 501 && process.env.NODE_ENV === "production") {
          const missing = presignError?.missing?.length
            ? ` Missing: ${presignError.missing.join(", ")}`
            : "";
          setError((presignError?.error || "Cloud uploads not configured") + missing);
          return;
        }

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
      setUploadedFileName(fileName);

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
    setRequiresEmailVerification(false);

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
          ...(inputMode === "upload" ? { allowPurchase } : {}),
          title: title.trim(),
          ...(artworkUrl ? { artworkUrl } : {}),
          genreIds: selectedGenres,
          feedbackFocus: feedbackFocus.trim() || undefined,
          packageType: selectedPackage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 403 &&
          typeof data?.error === "string" &&
          data.error.toLowerCase().includes("verify")
        ) {
          setRequiresEmailVerification(true);
          setError("Please verify your email to submit tracks");
          return;
        }
        setError(data.error || "Something went wrong");
        return;
      }

      let checkoutUrl = `/artist/submit/checkout?trackId=${data.id}`;
      if (useFreeTrial) {
        checkoutUrl += "&useFreeCredit=true";
      }
      router.push(checkoutUrl);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // For URL mode: require verified link (no warning)
  const hasTrack = inputMode === "url" ? (url && !urlError && !urlWarning && !isLoadingMetadata && title) : (!!uploadedUrl && !isUploading);
  const hasDetails = title.trim() && selectedGenres.length > 0;
  const selectedPackageDetails = PACKAGES[selectedPackage];

  const goBack = () => {
    if (step === "track" && !hasProfile) setStep("artist");
    else if (step === "details") setStep("track");
    else if (step === "package") setStep("details");
    else if (step === "confirm") setStep("package");
  };

  const handleCreateProfile = async () => {
    if (!artistName.trim()) {
      setError("Please enter your artist name");
      return;
    }

    setError("");
    setIsCreatingProfile(true);

    try {
      const response = await fetch("/api/artist/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistName: artistName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Something went wrong");
        return;
      }

      const data = await response.json();
      setFreeCredits(data.freeReviewCredits ?? 0);
      setHasProfile(true);
      setStep("track");
    } catch {
      setError("Something went wrong");
    } finally {
      setIsCreatingProfile(false);
    }
  };

  // Show loading while checking profile
  if (hasProfile === null) {
    return (
      <div className="max-w-xl mx-auto min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto min-h-[60vh] flex flex-col">
      {session?.user?.email && !session.user.emailVerified && (
        <VerifyEmailBanner className="mb-6" />
      )}

      {/* Free Credit Banner - always visible */}
      {!isLoadingCredits && freeCredits > 0 && hasProfile && (
        <div className="mb-6 bg-lime-400 border-2 border-black p-3 flex items-center gap-3">
          <Gift className="h-5 w-5 text-black flex-shrink-0" />
          <p className="text-sm font-bold text-black">You have a free review credit!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
          {error}
        </div>
      )}

      {/* Step: Artist Name */}
      {step === "artist" && (
        <div className="flex-1 flex flex-col">
          <div className="mb-8">
            <h1 className="text-2xl font-black">First, what&apos;s your artist name?</h1>
            <p className="text-neutral-500 mt-1">This is how you&apos;ll appear to reviewers</p>
          </div>

          <div className="flex-1">
            <label htmlFor="artistName" className="block text-sm font-bold mb-2">Artist / Project name</label>
            <Input
              id="artistName"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Your artist or project name"
              className="text-base h-12"
              autoFocus
            />
          </div>

          <div className="mt-6">
            <Button
              onClick={handleCreateProfile}
              disabled={!artistName.trim() || isCreatingProfile}
              isLoading={isCreatingProfile}
              variant="primary"
              className="w-full h-12 text-base"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Track */}
      {step === "track" && (
        <div className="flex-1 flex flex-col">
          <div className="mb-6">
            <h1 className="text-2xl font-black">What track do you want feedback on?</h1>
            <p className="text-neutral-500 mt-1">Share a link or upload an MP3</p>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setInputMode("url");
                setUploadedUrl("");
                setUploadedFileName("");
                setError("");
              }}
              className={cn(
                "px-4 py-2 text-sm font-bold border-2 border-black transition-colors",
                inputMode === "url" ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
              )}
            >
              Paste link
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode("upload");
                setUrl("");
                setUrlError("");
                setError("");
              }}
              className={cn(
                "px-4 py-2 text-sm font-bold border-2 border-black transition-colors",
                inputMode === "upload" ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
              )}
            >
              Upload MP3
            </button>
          </div>

          {inputMode === "url" ? (
            <div className="space-y-3 flex-1">
              <Input
                placeholder="SoundCloud, Bandcamp, or YouTube link"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={cn("text-base h-12", urlError && "border-red-500")}
                autoFocus
              />
              <SupportedPlatforms activeSource={sourceType} />
              {urlError && <p className="text-sm text-red-500 font-medium">{urlError}</p>}
              {!urlError && urlWarning && (
                <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded">
                  <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{urlWarning}</span>
                </div>
              )}
              {isLoadingMetadata && (
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting track info...
                </div>
              )}
              {/* Track preview when URL is valid */}
              {url && !urlError && !isLoadingMetadata && title && (
                <div className="border-2 border-lime-500 bg-lime-50 p-4 flex items-center gap-4">
                  {artworkUrl ? (
                    <img
                      src={artworkUrl}
                      alt="Track artwork"
                      className="w-16 h-16 object-cover border-2 border-black"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-neutral-200 border-2 border-black flex items-center justify-center">
                      <Music className="h-6 w-6 text-neutral-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-lime-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-lime-700">Track found</span>
                      {sourceType && <PlatformBadge source={sourceType} />}
                    </div>
                    <p className="font-bold text-black truncate mt-1">{title}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,.mp3"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && (file.type === "audio/mpeg" || file.name.endsWith(".mp3"))) {
                    void handleUpload(file);
                  } else {
                    setError("Please upload an MP3 file");
                  }
                }}
                className={cn(
                  "border-2 border-dashed p-10 text-center cursor-pointer transition-all",
                  isDragging && "border-lime-500 bg-lime-50",
                  !isDragging && !uploadedFileName && "border-neutral-300 hover:border-black",
                  uploadedFileName && !isUploading && "border-lime-500 bg-lime-50"
                )}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
                    <p className="font-medium text-neutral-600">Uploading...</p>
                  </div>
                ) : uploadedFileName ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-lime-500 flex items-center justify-center">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-bold text-black">{uploadedFileName}</p>
                    <p className="text-sm text-neutral-500">Click to change</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-neutral-400" />
                    </div>
                    <p className="font-bold text-black">Drop your MP3 here</p>
                    <p className="text-sm text-neutral-500">or click to browse</p>
                  </div>
                )}
              </div>
              {uploadedUrl && (
                <div className="mt-4">
                  <AudioPlayer sourceUrl={uploadedUrl} sourceType="UPLOAD" showListenTracker={false} showWaveform={true} />
                </div>
              )}
              {uploadedUrl && !isUploading && (
                <label className="mt-4 flex items-start gap-3 p-4 border-2 border-neutral-200 hover:border-black cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={allowPurchase}
                    onChange={(e) => setAllowPurchase(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-2 border-neutral-300 text-lime-500 focus:ring-lime-500"
                  />
                  <div>
                    <span className="font-bold text-black">Allow reviewers to purchase this track</span>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      Reviewers can buy the track for $0.50 and download the MP3
                    </p>
                  </div>
                </label>
              )}
            </div>
          )}

          {/* Only show Next button when track is confirmed */}
          {hasTrack && (
            <div className="mt-4">
              <Button
                onClick={() => setStep("details")}
                variant="primary"
                className="w-full h-12 text-base"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step: Details */}
      {step === "details" && (
        <div className="flex-1 flex flex-col">
          <button onClick={goBack} className="text-sm text-neutral-500 hover:text-black mb-4 self-start">
            ← Back
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-black">Tell us about your track</h1>
            <p className="text-neutral-500 mt-1">So we can match you with the right listeners</p>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <label htmlFor="title" className="block text-sm font-bold mb-2">Track title</label>
              <div className="relative">
                <Music className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's it called?"
                  className="pl-10 text-base h-12"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Genre <span className="font-normal text-neutral-400">(up to 3)</span>
              </label>
              <GenreSelector
                genres={genres}
                selectedIds={selectedGenres}
                onToggle={toggleGenre}
                maxSelections={3}
                variant="artist"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", showNotes && "rotate-180")} />
                Add notes for reviewers
                <span className="text-neutral-400">(optional)</span>
              </button>
              {showNotes && (
                <textarea
                  placeholder="What were you going for? Anything specific you want feedback on?"
                  value={feedbackFocus}
                  onChange={(e) => setFeedbackFocus(e.target.value)}
                  className="mt-3 w-full px-3 py-3 border-2 border-neutral-200 text-base min-h-[100px] resize-none focus:border-black focus:outline-none"
                  maxLength={1000}
                />
              )}
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={() => setStep("package")}
              disabled={!hasDetails}
              variant="primary"
              className="w-full h-12 text-base"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Package */}
      {step === "package" && (
        <div className="flex-1 flex flex-col">
          <button onClick={goBack} className="text-sm text-neutral-500 hover:text-black mb-4 self-start">
            ← Back
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-black">How many reviews do you want?</h1>
            <p className="text-neutral-500 mt-1">More opinions = clearer patterns = more confidence</p>
          </div>

          <div className="space-y-4">
            {/* Free Trial Option */}
            {freeCredits > 0 && (
              <button
                type="button"
                onClick={() => {
                  setUseFreeTrial(true);
                }}
                className={cn(
                  "relative w-full text-left border-2 border-black transition-all",
                  useFreeTrial
                    ? "ring-2 ring-lime-500 ring-offset-2"
                    : "hover:bg-neutral-50"
                )}
              >
                <div className={cn(
                  "p-4 flex items-center justify-between",
                  useFreeTrial ? "bg-lime-400" : "bg-lime-100"
                )}>
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5" />
                    <div>
                      <h3 className="font-bold text-lg">Free Trial</h3>
                      <p className="text-sm text-neutral-600">Try it out with 1 review</p>
                    </div>
                  </div>
                  <div className={cn(
                    "h-12 w-12 border-2 border-black flex items-center justify-center font-black text-xl flex-shrink-0",
                    useFreeTrial ? "bg-black text-white" : "bg-lime-400"
                  )}>
                    1
                  </div>
                </div>
                <div className="px-4 py-3 border-t-2 border-black bg-white">
                  <span className="text-3xl font-black">FREE</span>
                </div>
                {useFreeTrial && (
                  <div className="px-4 py-2 bg-lime-400 border-t-2 border-black flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-bold">Selected</span>
                  </div>
                )}
              </button>
            )}

            {/* Paid Packages */}
            {ACTIVE_PACKAGE_TYPES.map((key) => {
              const pkg = PACKAGES[key];
              const isSelected = selectedPackage === key && !useFreeTrial;
              const isPopular = key === "STANDARD";

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedPackage(key);
                    setUseFreeTrial(false);
                  }}
                  className={cn(
                    "relative w-full text-left border-2 border-black transition-all",
                    isSelected
                      ? "ring-2 ring-lime-500 ring-offset-2"
                      : "hover:bg-neutral-50",
                    isPopular && !isSelected && "shadow-[4px_4px_0px_0px_rgba(132,204,22,1)]"
                  )}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <span className="absolute -top-3 left-4 text-xs font-bold bg-lime-500 text-black px-3 py-1 border-2 border-black">
                      RECOMMENDED
                    </span>
                  )}
                  
                  {/* Header */}
                  <div className={cn(
                    "p-4 flex items-center justify-between",
                    isSelected ? "bg-lime-500" : isPopular ? "bg-lime-50" : "bg-white"
                  )}>
                    <div>
                      <h3 className="font-bold text-lg">{pkg.name}</h3>
                      <p className="text-sm text-neutral-600">{pkg.description}</p>
                    </div>
                    <div className={cn(
                      "h-12 w-12 border-2 border-black flex items-center justify-center font-black text-xl flex-shrink-0",
                      isSelected ? "bg-black text-white" : isPopular ? "bg-lime-500" : "bg-neutral-100"
                    )}>
                      {pkg.reviews}
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="px-4 py-3 border-t-2 border-black bg-white">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black">${(pkg.price / 100).toFixed(2)}</span>
                      <span className="text-sm text-neutral-500">AUD</span>
                      <span className="text-sm text-neutral-400 ml-auto font-mono">
                        ${(pkg.price / pkg.reviews / 100).toFixed(2)}/review
                      </span>
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="px-4 py-3 border-t-2 border-black bg-neutral-50 space-y-2">
                    {pkg.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className={cn(
                          "h-4 w-4 flex-shrink-0",
                          feature.includes("Consensus") || feature.includes("Pattern")
                            ? "text-orange-500"
                            : "text-lime-600"
                        )} />
                        <span className={cn(
                          feature.includes("Consensus") || feature.includes("Pattern")
                            ? "font-semibold"
                            : ""
                        )}>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="px-4 py-2 bg-lime-500 border-t-2 border-black flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-bold">Selected</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <Button
              onClick={() => setStep("confirm")}
              variant="primary"
              className="w-full h-12 text-base"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && (
        <div className="flex-1 flex flex-col">
          <button onClick={goBack} className="text-sm text-neutral-500 hover:text-black mb-4 self-start">
            ← Back
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-black">Ready to submit?</h1>
            <p className="text-neutral-500 mt-1">Review your order</p>
          </div>

          {/* Track Card */}
          <div className="bg-neutral-50 border-2 border-black p-4 flex gap-4 items-center">
            {artworkUrl ? (
              <img 
                src={artworkUrl} 
                alt="Track artwork" 
                className="w-20 h-20 object-cover border-2 border-black flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 bg-neutral-200 border-2 border-black flex items-center justify-center flex-shrink-0">
                <Music className="h-8 w-8 text-neutral-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-black text-lg truncate">{title}</p>
              <p className="text-sm text-neutral-600 truncate">
                {selectedGenres.map(id => genres.find(g => g.id === id)?.name).filter(Boolean).join(" · ")}
              </p>
              {feedbackFocus && (
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{feedbackFocus}</p>
              )}
            </div>
          </div>

          {/* Package Selection Summary */}
          <div className="mt-4 border-2 border-black">
            <div className={cn(
              "p-4 flex items-center justify-between",
              useFreeTrial ? "bg-lime-400" : "bg-lime-500"
            )}>
              <div className="flex items-center gap-3">
                {useFreeTrial && <Gift className="h-5 w-5" />}
                <div>
                  <p className="font-black text-lg">{useFreeTrial ? "Free Trial" : selectedPackageDetails.name}</p>
                  <p className="text-sm font-medium">{useFreeTrial ? "1 review" : selectedPackageDetails.description}</p>
                </div>
              </div>
              <div className="text-right">
                {useFreeTrial ? (
                  <span className="text-2xl font-black">FREE</span>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-black">${(selectedPackageDetails.price / 100).toFixed(2)}</span>
                    <span className="text-xs opacity-70">AUD</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price per review - only for paid packages */}
            {!useFreeTrial && (
              <div className="px-4 py-2 bg-neutral-100 border-t-2 border-black flex items-center justify-between text-sm">
                <span className="text-neutral-600">{selectedPackageDetails.reviews} reviews</span>
                <span className="font-mono text-neutral-500">${(selectedPackageDetails.price / selectedPackageDetails.reviews / 100).toFixed(2)}/review</span>
              </div>
            )}

            {/* What you get - actual features from package */}
            {!useFreeTrial && (
              <div className="p-4 bg-white border-t-2 border-black space-y-2">
                {selectedPackageDetails.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className={cn(
                      "h-4 w-4 flex-shrink-0",
                      feature.includes("Consensus") || feature.includes("Pattern")
                        ? "text-orange-500"
                        : "text-lime-600"
                    )} />
                    <span className={cn(
                      feature.includes("Consensus") || feature.includes("Pattern")
                        ? "font-semibold"
                        : ""
                    )}>{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              variant="primary"
              className="w-full h-14 text-lg font-bold"
            >
              {useFreeTrial ? (
                <>
                  <Gift className="h-5 w-5 mr-2" />
                  Get Your Free Review
                </>
              ) : (
                <>
                  Continue to Payment
                </>
              )}
            </Button>
            <p className="text-center text-xs text-neutral-500 mt-3">
              {useFreeTrial ? "No payment required" : "Secure payment via Stripe"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
