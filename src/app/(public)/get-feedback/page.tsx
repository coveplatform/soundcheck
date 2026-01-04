"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  Loader2,
  Upload,
  Music,
  ArrowRight,
  ArrowLeft,
  Link2,
  Sparkles,
  Zap,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  validateTrackUrl,
  fetchTrackMetadata,
  detectSource,
  PACKAGES,
  PackageType,
} from "@/lib/metadata";
import { AudioPlayer } from "@/components/audio/audio-player";
import { GenreSelector } from "@/components/ui/genre-selector";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { trackTikTokEvent } from "@/components/providers";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

type Step = "track" | "details" | "package";

const STORAGE_KEY = "get-feedback-progress-v2";

interface StoredProgress {
  trackUrl: string;
  inputMode: "url" | "upload";
  uploadedUrl: string;
  uploadedFileName: string;
  title: string;
  artworkUrl: string | null;
  email: string;
  password: string;
  artistName: string;
  selectedGenres: string[];
  feedbackFocus: string;
  packageType: PackageType;
  sourceType: string;
}

export default function GetFeedbackPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isLoggedIn = !!session?.user;
  const hasArtistProfile = !!(session?.user as { artistProfileId?: string })?.artistProfileId;

  // Step state
  const [step, setStep] = useState<Step>("track");
  const [isInitialized, setIsInitialized] = useState(false);

  // Track state
  const [inputMode, setInputMode] = useState<"url" | "upload">("upload");
  const [trackUrl, setTrackUrl] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedDuration, setUploadedDuration] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Account state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [emailExists, setEmailExists] = useState(false);

  // Track details state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [feedbackFocus, setFeedbackFocus] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);

  // Package state
  const [selectedPackage, setSelectedPackage] = useState<PackageType>("STANDARD");

  // UI state
  const [urlError, setUrlError] = useState("");
  const [urlWarning, setUrlWarning] = useState("");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load genres on mount
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

  // Load artist profile data if logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    async function fetchProfile() {
      try {
        const response = await fetch("/api/artist/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.artistName) {
            setArtistName(data.artistName);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    }
    fetchProfile();
  }, [isLoggedIn]);

  // Load progress from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredProgress = JSON.parse(stored);
        if (data.trackUrl) setTrackUrl(data.trackUrl);
        if (data.inputMode) setInputMode(data.inputMode);
        if (data.uploadedUrl) setUploadedUrl(data.uploadedUrl);
        if (data.uploadedFileName) setUploadedFileName(data.uploadedFileName);
        if (data.title) setTitle(data.title);
        if (data.artworkUrl) setArtworkUrl(data.artworkUrl);
        if (data.email && !isLoggedIn) setEmail(data.email);
        if (data.password && !isLoggedIn) setPassword(data.password);
        if (data.artistName && !hasArtistProfile) setArtistName(data.artistName);
        if (data.selectedGenres) setSelectedGenres(data.selectedGenres);
        if (data.feedbackFocus) setFeedbackFocus(data.feedbackFocus);
        if (data.packageType) setSelectedPackage(data.packageType);
        if (data.sourceType) setSourceType(data.sourceType);
      }
    } catch {
      // Ignore parse errors
    }
    setIsInitialized(true);
  }, [isLoggedIn, hasArtistProfile]);

  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    if (typeof window === "undefined" || !isInitialized) return;
    const data: StoredProgress = {
      trackUrl,
      inputMode,
      uploadedUrl,
      uploadedFileName,
      title,
      artworkUrl,
      email: isLoggedIn ? "" : email,
      password: isLoggedIn ? "" : password,
      artistName: hasArtistProfile ? "" : artistName,
      selectedGenres,
      feedbackFocus,
      packageType: selectedPackage,
      sourceType,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [
    trackUrl,
    inputMode,
    uploadedUrl,
    uploadedFileName,
    title,
    artworkUrl,
    email,
    password,
    artistName,
    selectedGenres,
    feedbackFocus,
    selectedPackage,
    sourceType,
    isLoggedIn,
    hasArtistProfile,
    isInitialized,
  ]);

  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  // Clear storage on successful submit
  const clearProgress = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Handle URL input
  const handleUrlChange = async (value: string) => {
    setTrackUrl(value);
    setUrlError("");
    setUrlWarning("");
    setTitle("");
    setArtworkUrl(null);
    setSourceType("");

    if (!value.trim()) return;

    const validation = validateTrackUrl(value);
    if (!validation.valid) {
      setUrlError(validation.error || "Invalid URL");
      return;
    }

    const detectedSource = detectSource(value);
    setSourceType(detectedSource || "");
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

  // Handle file upload
  const handleUpload = async (file: File) => {
    setError("");
    setUrlError("");
    setIsUploading(true);
    setUploadedDuration(null);
    setUploadedUrl("");
    setSourceType("UPLOAD");
    const fileName = file.name;

    try {
      let finalUrl = "";

      // Use the onboarding-specific upload endpoint (doesn't require auth)
      const presignEndpoint = isLoggedIn
        ? "/api/uploads/track/presign"
        : "/api/get-feedback/upload-presign";

      const presignRes = await fetch(presignEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "audio/mpeg",
          contentLength: file.size,
        }),
      });

      if (presignRes.ok) {
        const presignData = await presignRes.json();
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
          setError("Failed to upload file");
          return;
        }

        finalUrl = presignData.fileUrl;
      } else {
        const errorData = await presignRes.json().catch(() => ({}));
        setError(errorData.error || "Failed to prepare upload");
        return;
      }

      if (!finalUrl) {
        setError("Failed to upload file");
        return;
      }

      setUploadedUrl(finalUrl);
      setUploadedFileName(fileName);

      // Get duration
      await new Promise<void>((resolve) => {
        const audio = new Audio();
        audio.preload = "metadata";
        audio.src = finalUrl;
        const onLoaded = () => {
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setUploadedDuration(Math.round(audio.duration));
          }
          resolve();
        };
        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("error", () => resolve());
      });

      // Set title from filename if not set
      if (!title.trim()) {
        const base = file.name.replace(/\.mp3$/i, "").trim();
        if (base) setTitle(base);
      }

      // Track TikTok event - track uploaded
      trackTikTokEvent("AddToCart", {
        content_type: "product",
        content_id: "track_upload",
      });
    } catch {
      setError("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  // Check if email exists
  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToCheck }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.exists;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Toggle genre
  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      }
      if (prev.length >= 3) return prev;
      return [...prev, genreId];
    });
  };

  // Password validation
  const passwordErrors = (() => {
    const errors: string[] = [];
    if (password.length > 0) {
      if (password.length < 8) errors.push("8+ characters");
      if (!/[A-Z]/.test(password)) errors.push("uppercase");
      if (!/[a-z]/.test(password)) errors.push("lowercase");
      if (!/\d/.test(password)) errors.push("number");
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("symbol");
    }
    return errors;
  })();

  const isPasswordValid = password.length >= 8 && passwordErrors.length === 0;

  // Navigation
  const goBack = () => {
    if (step === "details") setStep("track");
    if (step === "package") setStep("details");
    setFieldErrors({});
  };

  // Validate and go to details
  const goToDetails = () => {
    // For URL mode: require verified link (no warning) and title
    // For upload mode: just need uploaded URL and title
    const hasTrack = inputMode === "url"
      ? trackUrl && !urlError && !urlWarning && !isLoadingMetadata && title
      : !!uploadedUrl && !isUploading && title;

    if (!hasTrack) {
      if (inputMode === "url" && urlWarning) {
        setError("We couldn't verify your link. Please check it's public and accessible, or upload an MP3 instead.");
      } else {
        setError("Please add your track first");
      }
      return;
    }

    // Track TikTok event
    trackTikTokEvent("ViewContent", {
      content_type: "product",
      content_id: "feedback_flow",
    });

    setStep("details");
  };

  // Validate and go to package
  const goToPackage = async () => {
    const errors: Record<string, string> = {};

    if (!isLoggedIn) {
      if (!email.trim()) errors.email = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Invalid email";

      if (!password) errors.password = "Required";
      else if (!isPasswordValid) errors.password = "Password too weak";

      if (!artistName.trim()) errors.artistName = "Required";
    }

    if (selectedGenres.length === 0) errors.genres = "Select at least one genre";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Check if email exists for login flow
    if (!isLoggedIn && email) {
      const exists = await checkEmailExists(email.trim().toLowerCase());
      setEmailExists(exists);
      if (exists) {
        // Try to log in with provided credentials
        const result = await signIn("credentials", {
          redirect: false,
          email: email.trim().toLowerCase(),
          password,
        });

        if (result?.error) {
          setFieldErrors({ password: "Incorrect password for existing account" });
          return;
        }

        // Successfully logged in
        router.refresh();
      }
    }

    // Track TikTok event
    trackTikTokEvent("InitiateCheckout", {
      content_type: "product",
      content_id: selectedPackage,
      value: PACKAGES[selectedPackage].price / 100,
      currency: "AUD",
    });

    setStep("package");
  };

  // Handle final submission
  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      // Build submission data
      const submitData = {
        sourceUrl: inputMode === "upload" ? uploadedUrl : trackUrl,
        sourceType: inputMode === "upload" ? "UPLOAD" : sourceType,
        title: title.trim(),
        artworkUrl,
        duration: uploadedDuration,
        genreIds: selectedGenres,
        feedbackFocus: feedbackFocus.trim() || undefined,
        packageType: selectedPackage,
        ...(!isLoggedIn && {
          email: email.trim().toLowerCase(),
          password,
          artistName: artistName.trim(),
        }),
      };

      const response = await fetch("/api/get-feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Clear saved progress
      clearProgress();

      // Track registration if new account
      if (!isLoggedIn && data.signIn) {
        await signIn("credentials", {
          redirect: false,
          email: email.trim().toLowerCase(),
          password,
        });

        trackTikTokEvent("CompleteRegistration", {
          content_name: "artist",
        });
      }

      // Redirect to checkout
      router.push(data.checkoutUrl || data.successUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if we can proceed from track step
  // For URL mode: require verified link (no warning) and title
  const hasTrack = inputMode === "url"
    ? trackUrl && !urlError && !urlWarning && !isLoadingMetadata && title
    : !!uploadedUrl && !isUploading;

  // Show loading while checking session
  if (sessionStatus === "loading" || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-lime-500" />
      </div>
    );
  }

  const progress = step === "track" ? 33 : step === "details" ? 66 : 100;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-neutral-800 z-50">
        <div
          className="h-full bg-lime-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
              <span className={cn(step === "track" && "text-lime-500")}>TRACK</span>
              <span>→</span>
              <span className={cn(step === "details" && "text-lime-500")}>DETAILS</span>
              <span>→</span>
              <span className={cn(step === "package" && "text-lime-500")}>CHECKOUT</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-500/20 border-2 border-red-500 text-red-400 text-sm p-4 font-medium">
            {error}
          </div>
        )}

        {/* ============================================ */}
        {/* STEP 1: TRACK */}
        {/* ============================================ */}
        {step === "track" && (
          <div className="space-y-8">
            {/* Hero */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-lime-500 text-black px-4 py-2 text-sm font-black uppercase tracking-wider">
                <Zap className="h-4 w-4" />
                Get Real Feedback
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
                Drop your track
              </h1>
              <p className="text-neutral-400 text-lg max-w-md mx-auto">
                Upload a file or paste a link. We&apos;ll match you with listeners who actually love your genre.
              </p>
            </div>

            {/* Input mode toggle */}
            <div className="flex gap-2 bg-neutral-900 p-1 rounded-none border-2 border-neutral-700">
              <button
                type="button"
                onClick={() => {
                  setInputMode("upload");
                  setTrackUrl("");
                  setUrlError("");
                }}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-black transition-all flex items-center justify-center gap-2",
                  inputMode === "upload"
                    ? "bg-lime-500 text-black"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <Upload className="h-4 w-4" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode("url");
                  setUploadedUrl("");
                  setUploadedFileName("");
                }}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-black transition-all flex items-center justify-center gap-2",
                  inputMode === "url"
                    ? "bg-lime-500 text-black"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <Link2 className="h-4 w-4" />
                Paste Link
              </button>
            </div>

            {/* Upload area */}
            {inputMode === "upload" ? (
              <div>
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
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
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
                    "border-2 border-dashed p-12 text-center cursor-pointer transition-all",
                    isDragging && "border-lime-500 bg-lime-500/10",
                    !isDragging && !uploadedFileName && "border-neutral-700 hover:border-lime-500 hover:bg-neutral-900",
                    uploadedFileName && !isUploading && "border-lime-500 bg-lime-500/10"
                  )}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-16 w-16 animate-spin text-lime-500" />
                      <p className="font-bold text-lg">Uploading...</p>
                    </div>
                  ) : uploadedFileName ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 bg-lime-500 flex items-center justify-center">
                        <Check className="h-8 w-8 text-black" />
                      </div>
                      <div>
                        <p className="font-black text-xl text-lime-500">{uploadedFileName}</p>
                        <p className="text-sm text-neutral-500 mt-1">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 bg-neutral-800 border-2 border-neutral-600 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-neutral-400" />
                      </div>
                      <div>
                        <p className="font-black text-xl">Drop your MP3 here</p>
                        <p className="text-sm text-neutral-500 mt-1">or click to browse</p>
                      </div>
                    </div>
                  )}
                </div>

                {uploadedUrl && (
                  <div className="mt-4">
                    <AudioPlayer
                      sourceUrl={uploadedUrl}
                      sourceType="UPLOAD"
                      showListenTracker={false}
                      showWaveform={true}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  placeholder="Paste SoundCloud, Bandcamp, or YouTube link"
                  value={trackUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={cn(
                    "text-lg h-14 bg-neutral-900 border-2 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-lime-500",
                    urlError && "border-red-500"
                  )}
                  autoFocus
                />
                {isLoadingMetadata && (
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Getting track info...
                  </div>
                )}
                {urlError && (
                  <p className="text-sm text-red-500 font-medium">{urlError}</p>
                )}
                {!urlError && urlWarning && (
                  <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-400/10 border border-amber-400/30 p-3 rounded">
                    <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{urlWarning}</span>
                  </div>
                )}
              </div>
            )}

            {/* Track title edit */}
            {(uploadedUrl || (trackUrl && !urlError && !isLoadingMetadata)) && (
              <div className="border-2 border-neutral-700 bg-neutral-900 p-4 flex items-center gap-4">
                {artworkUrl ? (
                  <img
                    src={artworkUrl}
                    alt="Track artwork"
                    className="w-16 h-16 object-cover border-2 border-neutral-600 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-neutral-800 border-2 border-neutral-600 flex items-center justify-center flex-shrink-0">
                    <Music className="h-7 w-7 text-neutral-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Track title"
                    className="text-lg font-bold bg-transparent border-0 border-b-2 border-neutral-700 rounded-none px-0 focus:border-lime-500 text-white"
                  />
                  <p className="text-xs text-neutral-500 mt-2 uppercase tracking-wide">
                    {sourceType ? sourceType.replace("_", " ") : "Ready to submit"}
                  </p>
                </div>
              </div>
            )}

            {/* Continue button */}
            <Button
              onClick={goToDetails}
              disabled={!hasTrack || !title}
              className={cn(
                "w-full h-14 text-lg font-black border-2 transition-all",
                hasTrack && title
                  ? "bg-lime-500 text-black border-lime-500 hover:bg-lime-400 shadow-[4px_4px_0px_0px_rgba(132,204,22,1)] hover:shadow-[2px_2px_0px_0px_rgba(132,204,22,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                  : "bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed"
              )}
            >
              Continue
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 text-xs text-neutral-500">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>500+ reviews delivered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                <span>&lt;12hr turnaround</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* STEP 2: DETAILS */}
        {/* ============================================ */}
        {step === "details" && (
          <div className="space-y-8">
            <button
              onClick={goBack}
              className="text-sm text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black">Almost there</h1>
              <p className="text-neutral-400">
                Tell us where to send your feedback
              </p>
            </div>

            {/* Track preview */}
            <div className="border-2 border-neutral-700 bg-neutral-900 p-4 flex items-center gap-4">
              {artworkUrl ? (
                <img src={artworkUrl} alt="" className="w-12 h-12 object-cover border border-neutral-600" />
              ) : (
                <div className="w-12 h-12 bg-neutral-800 border border-neutral-600 flex items-center justify-center">
                  <Music className="h-5 w-5 text-neutral-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{title}</p>
                <p className="text-xs text-neutral-500 uppercase">{sourceType || "Ready"}</p>
              </div>
              <div className="h-8 w-8 bg-lime-500 flex items-center justify-center">
                <Check className="h-4 w-4 text-black" />
              </div>
            </div>

            {/* Account fields (only if not logged in) */}
            {!isLoggedIn && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-neutral-400 mb-2 block">Email</label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      className={cn(
                        "h-12 bg-neutral-900 border-2 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-lime-500",
                        fieldErrors.email && "border-red-500"
                      )}
                    />
                    {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-bold text-neutral-400 mb-2 block">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, password: "" }));
                        }}
                        className={cn(
                          "h-12 bg-neutral-900 border-2 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-lime-500 pr-10",
                          fieldErrors.password && "border-red-500"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
                    {password && passwordErrors.length > 0 && (
                      <p className="text-xs text-neutral-500 mt-1">Needs: {passwordErrors.join(", ")}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-neutral-400 mb-2 block">Artist / Project Name</label>
                  <Input
                    placeholder="Your artist name"
                    value={artistName}
                    onChange={(e) => {
                      setArtistName(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, artistName: "" }));
                    }}
                    className={cn(
                      "h-12 bg-neutral-900 border-2 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-lime-500",
                      fieldErrors.artistName && "border-red-500"
                    )}
                  />
                  {fieldErrors.artistName && <p className="text-xs text-red-500 mt-1">{fieldErrors.artistName}</p>}
                </div>
              </div>
            )}

            {/* Genre selection */}
            <div>
              <label className="text-sm font-bold text-neutral-400 mb-3 block">
                What genre is your track? <span className="text-neutral-600">(up to 3)</span>
              </label>
              <div className="bg-white rounded-lg p-4 border-2 border-neutral-200">
                <GenreSelector
                  genres={genres}
                  selectedIds={selectedGenres}
                  onToggle={toggleGenre}
                  maxSelections={3}
                  variant="artist"
                />
              </div>
              {fieldErrors.genres && <p className="text-xs text-red-500 mt-2">{fieldErrors.genres}</p>}
            </div>

            {/* Continue button */}
            <Button
              onClick={goToPackage}
              className="w-full h-14 text-lg font-black bg-lime-500 text-black border-2 border-lime-500 hover:bg-lime-400 shadow-[4px_4px_0px_0px_rgba(132,204,22,1)] hover:shadow-[2px_2px_0px_0px_rgba(132,204,22,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Continue
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {/* ============================================ */}
        {/* STEP 3: PACKAGE */}
        {/* ============================================ */}
        {step === "package" && (
          <div className="space-y-8">
            <button
              onClick={goBack}
              className="text-sm text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black">How many opinions?</h1>
              <p className="text-neutral-400">
                More listeners = clearer patterns = better decisions
              </p>
            </div>

            {/* Package options */}
            <div className="space-y-4">
              {/* Quick Check - 5 reviews */}
              <button
                type="button"
                onClick={() => setSelectedPackage("STARTER")}
                className={cn(
                  "w-full text-left border-2 p-6 transition-all",
                  selectedPackage === "STARTER"
                    ? "border-lime-500 bg-lime-500/10"
                    : "border-neutral-700 hover:border-neutral-500"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl font-black text-white">5</span>
                      <span className="text-lg font-bold text-neutral-400">reviews</span>
                    </div>
                    <p className="text-neutral-500">Get a feel for how listeners react</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">${(PACKAGES.STARTER.price / 100).toFixed(0)}</p>
                    <p className="text-xs text-neutral-500">AUD</p>
                  </div>
                </div>
                {selectedPackage === "STARTER" && (
                  <div className="mt-4 pt-4 border-t border-lime-500/30 flex items-center gap-2 text-lime-500">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-bold">Selected</span>
                  </div>
                )}
              </button>

              {/* Full Picture - 20 reviews */}
              <button
                type="button"
                onClick={() => setSelectedPackage("STANDARD")}
                className={cn(
                  "w-full text-left border-2 p-6 transition-all relative",
                  selectedPackage === "STANDARD"
                    ? "border-lime-500 bg-lime-500/10"
                    : "border-neutral-700 hover:border-neutral-500"
                )}
              >
                <div className="absolute -top-3 left-4 bg-lime-500 text-black text-xs font-black px-3 py-1 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl font-black text-white">20</span>
                      <span className="text-lg font-bold text-neutral-400">reviews</span>
                    </div>
                    <p className="text-neutral-500">Maximum clarity with pattern insights</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">${(PACKAGES.STANDARD.price / 100).toFixed(0)}</p>
                    <p className="text-xs text-neutral-500">AUD</p>
                  </div>
                </div>
                {selectedPackage === "STANDARD" && (
                  <div className="mt-4 pt-4 border-t border-lime-500/30 flex items-center gap-2 text-lime-500">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-bold">Selected</span>
                  </div>
                )}
              </button>
            </div>

            {/* What you get */}
            <div className="border-2 border-neutral-700 bg-neutral-900 p-5">
              <h3 className="font-bold text-white mb-3">Every review includes:</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-lime-500 flex-shrink-0" />
                  <span>Production, originality & vibe ratings</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-lime-500 flex-shrink-0" />
                  <span>Written feedback with timestamps</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-lime-500 flex-shrink-0" />
                  <span>Actionable suggestions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-lime-500 flex-shrink-0" />
                  <span>Results in under 12 hours</span>
                </li>
              </ul>
            </div>

            {/* Checkout button */}
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              className="w-full h-14 text-lg font-black bg-lime-500 text-black border-2 border-lime-500 hover:bg-lime-400 shadow-[4px_4px_0px_0px_rgba(132,204,22,1)] hover:shadow-[2px_2px_0px_0px_rgba(132,204,22,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Continue to Payment
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            {/* Payment methods */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-4 text-neutral-500">
                <div className="flex items-center gap-1.5 text-xs">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
                  </svg>
                  <span>PayPal</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                  </svg>
                  <span>Apple Pay</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm4.285 6.063c-.207 0-.414.063-.586.189l-4.285 3.063V7.5c0-.414-.336-.75-.75-.75s-.75.336-.75.75v9c0 .414.336.75.75.75s.75-.336.75-.75v-3.815l4.285 3.063c.172.126.379.189.586.189.552 0 1-.448 1-1V9.063c0-.552-.448-1-1-1z"/>
                  </svg>
                  <span>Google Pay</span>
                </div>
              </div>
              <p className="text-xs text-neutral-600">
                Secure payment via Stripe • SSL encrypted
              </p>
            </div>

            {/* Terms */}
            {!isLoggedIn && (
              <p className="text-center text-xs text-neutral-600">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-white">Terms</Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
