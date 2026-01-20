"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Music, ArrowRight, Link2, ArrowLeft, Loader2, Upload, Info, Lock, Globe } from "lucide-react";
import { GenreSelector } from "@/components/ui/genre-selector";
import { cn } from "@/lib/utils";
import { validateTrackUrl, fetchTrackMetadata, detectSource } from "@/lib/metadata";
import { AudioPlayer } from "@/components/audio/audio-player";
import { SupportedPlatforms, PlatformBadge } from "@/components/ui/supported-platforms";
import { VerifyEmailBanner } from "@/components/ui/verify-email-banner";
import type { Genre, Step, UploadMode } from "./types";

export default function SubmitTrackPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("track");

  // Artist profile state
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [artistName, setArtistName] = useState("");
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [trackCount, setTrackCount] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [canUpload, setCanUpload] = useState<boolean>(true);

  // Form state
  const [uploadMode, setUploadMode] = useState<UploadMode>("file");
  const [url, setUrl] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedDuration, setUploadedDuration] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [artworkUrl, setArtworkUrl] = useState<string | undefined>();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);

  // UI state
  const [genres, setGenres] = useState<Genre[]>([]);
  const [urlError, setUrlError] = useState("");
  const [urlWarning, setUrlWarning] = useState("");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sourceType, setSourceType] = useState<"SOUNDCLOUD" | "BANDCAMP" | "YOUTUBE" | "UPLOAD" | null>(null);

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
          setHasProfile(true);
          setTrackCount(data.totalTracks || 0);
          setIsSubscribed(data.subscriptionStatus === "active");

          // Can upload if: subscribed OR track count < 1 (free trial)
          const canUploadNow = data.subscriptionStatus === "active" || (data.totalTracks || 0) < 1;
          setCanUpload(canUploadNow);

          // If they can't upload, show upgrade step
          if (!canUploadNow) {
            setStep("upgrade");
          }
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

    if (uploadMode === "link") {
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
      // Build track data
      const trackData: any = {
        title: title.trim(),
        ...(artworkUrl ? { artworkUrl } : {}),
        genreIds: selectedGenres,
        isPublic,
      };

      // Set sourceUrl based on upload mode
      if (uploadMode === "link") {
        trackData.sourceUrl = url;
      } else if (uploadedUrl) {
        trackData.sourceUrl = uploadedUrl;
        trackData.sourceType = "UPLOAD";
        if (uploadedDuration) {
          trackData.duration = uploadedDuration;
        }
      }

      console.log("Submitting track data:", trackData);

      const response = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackData),
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

      // Redirect to track page after successful submission
      router.push(`/artist/tracks/${data.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // For URL mode: require verified link (no warning)
  const hasTrack = uploadMode === "link"
    ? (url && !urlError && !urlWarning && !isLoadingMetadata && title)
    : (!!uploadedUrl && !isUploading);
  const hasDetails = title.trim() && selectedGenres.length > 0;

  const goBack = () => {
    if (step === "track" && !hasProfile) setStep("artist");
    else if (step === "details") setStep("track");
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
      <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
        <div className="max-w-2xl mx-auto min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-black/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-2xl mx-auto min-h-[60vh] flex flex-col">
        {session?.user?.email && !session.user.emailVerified && (
          <VerifyEmailBanner className="mb-6" />
        )}

        {error && (
          <Card variant="soft" className="mb-6 bg-red-50 border-red-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Step: Artist Name */}
        {step === "artist" && (
          <div className="flex-1 flex flex-col">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight">Welcome! What&apos;s your artist name?</h1>
              <p className="mt-2 text-sm text-black/40">This is how you&apos;ll appear to reviewers</p>
            </div>

            <Card variant="soft" elevated className="flex-1">
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-3">artist name</p>
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Your artist or project name"
                  className="h-12 rounded-xl border-black/10 bg-white/60 focus:bg-white"
                  autoFocus
                />
              </CardContent>
            </Card>

            <div className="mt-6">
              <Button
                onClick={handleCreateProfile}
                disabled={!artistName.trim() || isCreatingProfile}
                isLoading={isCreatingProfile}
                variant="airyPrimary"
                className="w-full h-12"
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
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight">Upload your track</h1>
            <p className="mt-2 text-sm text-black/40">Share a link or upload an MP3</p>
          </div>

          {/* Upload mode toggle */}
          <Card variant="soft" className="mb-6">
            <CardContent className="pt-6">
              <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-4">upload method</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode("link");
                    setUploadedUrl("");
                    setUploadedFileName("");
                    setError("");
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-colors duration-150 ease-out",
                    uploadMode === "link"
                      ? "bg-black text-white border-black"
                      : "bg-white/60 text-black border-black/10 hover:bg-white"
                  )}
                >
                  <Link2 className="h-5 w-5" />
                  <span className="text-xs font-medium">Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode("file");
                    setUrl("");
                    setUrlError("");
                    setError("");
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-colors duration-150 ease-out",
                    uploadMode === "file"
                      ? "bg-black text-white border-black"
                      : "bg-white/60 text-black border-black/10 hover:bg-white"
                  )}
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-xs font-medium">MP3</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Link Mode */}
          {uploadMode === "link" && (
            <Card variant="soft" elevated className="flex-1">
              <CardContent className="pt-6 space-y-4">
                <Input
                  placeholder="Paste SoundCloud, Bandcamp, or YouTube link"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={cn(
                    "h-12 rounded-xl border-black/10 bg-white/60 focus:bg-white",
                    urlError && "border-red-500"
                  )}
                  autoFocus
                />
                <SupportedPlatforms activeSource={sourceType} />
                {urlError && <p className="text-sm text-red-600 font-medium">{urlError}</p>}
                {!urlError && urlWarning && (
                  <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                    <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{urlWarning}</span>
                  </div>
                )}
                {isLoadingMetadata && (
                  <div className="flex items-center gap-2 text-sm text-black/50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting track info...
                  </div>
                )}
                {url && !urlError && !isLoadingMetadata && title && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-4">
                    {artworkUrl ? (
                      <img src={artworkUrl} alt="" className="w-14 h-14 object-cover rounded-xl" />
                    ) : (
                      <div className="w-14 h-14 bg-black/5 rounded-xl flex items-center justify-center">
                        <Music className="h-6 w-6 text-black/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Track found</span>
                        {sourceType && <PlatformBadge source={sourceType} />}
                      </div>
                      <p className="font-medium text-black truncate mt-1">{title}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* File Mode */}
          {uploadMode === "file" && (
            <Card variant="soft" elevated className="flex-1">
              <CardContent className="pt-6">
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
                    "rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors duration-150 ease-out",
                    isDragging && "border-emerald-400 bg-emerald-50",
                    !isDragging && !uploadedFileName && "border-black/20 hover:border-black/40 hover:bg-white/50",
                    uploadedFileName && !isUploading && "border-emerald-400 bg-emerald-50"
                  )}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-black/30" />
                      <p className="font-medium text-black/60">Uploading...</p>
                    </div>
                  ) : uploadedFileName ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="h-6 w-6 text-white" />
                      </div>
                      <p className="font-medium text-black">{uploadedFileName}</p>
                      <p className="text-sm text-black/40">Click to change</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-black/5 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-black/40" />
                      </div>
                      <p className="font-medium text-black">Drop your MP3 here</p>
                      <p className="text-sm text-black/40">or click to browse (max 25MB)</p>
                    </div>
                  )}
                </div>
                {uploadedUrl && (
                  <div className="mt-4">
                    <AudioPlayer sourceUrl={uploadedUrl} sourceType="UPLOAD" showListenTracker={false} showWaveform={true} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}


          {/* Next button */}
          {hasTrack && (
            <div className="mt-6">
              <Button
                onClick={() => setStep("details")}
                variant="airyPrimary"
                className="w-full h-12"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step: Upgrade */}
      {step === "upgrade" && (
        <div className="flex-1 flex flex-col">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight">Ready to unlock unlimited uploads?</h1>
            <p className="mt-2 text-sm text-black/40">You've used your free track. Subscribe to upload as many tracks as you want.</p>
          </div>

          <Card variant="soft" elevated className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-light tracking-tight">MixReflect Pro</h3>
                  <p className="text-sm text-black/50 mt-1">Unlimited uploads & review requests</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-light tracking-tight">$9.95</p>
                  <p className="text-xs text-black/40">per month</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-black/60 mb-6">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Upload unlimited tracks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Request reviews anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Build your track library</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Cancel anytime</span>
                </div>
              </div>

              <Button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/subscriptions/checkout", {
                      method: "POST",
                    });
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    }
                  } catch (error) {
                    console.error("Checkout error:", error);
                    setError("Failed to start checkout");
                  }
                }}
                variant="airyPrimary"
                className="w-full h-12"
              >
                Subscribe Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-black/40">
            Have questions? <Link href="/support" className="text-black hover:underline">Contact support</Link>
          </p>
        </div>
      )}

      {/* Step: Details */}
      {step === "details" && (
        <div className="flex-1 flex flex-col">
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-black/40 hover:text-black mb-6 transition-colors duration-150 ease-out">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight">Track details</h1>
            <p className="mt-2 text-sm text-black/40">Help us match you with the right listeners</p>
          </div>

          <div className="space-y-6 flex-1">
            <Card variant="soft" elevated>
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-3">title</p>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's it called?"
                  className="h-12 rounded-xl border-black/10 bg-white/60 focus:bg-white"
                  autoFocus
                />
              </CardContent>
            </Card>

            <Card variant="soft" elevated>
              <CardContent className="pt-6">
                <p className="text-xs font-mono tracking-widest text-black/40 uppercase mb-3">genre <span className="normal-case text-black/30">(up to 3)</span></p>
                {genres.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-black/50">
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

            <Card variant="soft" elevated>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono tracking-widest text-black/40 uppercase">Visibility</p>
                    <div className="group relative">
                      <Info className="h-3.5 w-3.5 text-black/30 cursor-help" />
                      <div className="invisible group-hover:visible absolute left-0 top-6 z-10 w-64 p-3 bg-black text-white text-xs rounded-lg shadow-lg">
                        <p className="font-bold mb-1">Private (default)</p>
                        <p className="mb-2">Only you and assigned reviewers can see this track.</p>
                        <p className="font-bold mb-1">Public</p>
                        <p>Anyone can discover and listen to your track. View counts are tracked.</p>
                        <div className="absolute -top-1 left-3 w-2 h-2 bg-black transform rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
                      !isPublic
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white text-black/60 hover:border-black/20"
                    )}
                  >
                    <Lock className="h-4 w-4" />
                    <span className="text-sm font-bold">Private</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
                      isPublic
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white text-black/60 hover:border-black/20"
                    )}
                  >
                    <Globe className="h-4 w-4" />
                    <span className="text-sm font-bold">Public</span>
                  </button>
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="mt-6">
            <Button
              onClick={handleSubmit}
              disabled={!hasDetails || isSubmitting}
              isLoading={isSubmitting}
              variant="airyPrimary"
              className="w-full h-12"
            >
              Submit Track
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
