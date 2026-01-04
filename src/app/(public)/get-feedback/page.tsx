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
  Gift,
  Music,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { GenreSelector } from "@/components/ui/genre-selector";
import { cn } from "@/lib/utils";
import {
  validateTrackUrl,
  fetchTrackMetadata,
  detectSource,
  ACTIVE_PACKAGE_TYPES,
  PACKAGES,
  PackageType,
} from "@/lib/metadata";
import { AudioPlayer } from "@/components/audio/audio-player";
import { Logo } from "@/components/ui/logo";
import { SupportedPlatforms, PlatformBadge } from "@/components/ui/supported-platforms";
import Link from "next/link";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

type Step =
  | "track"
  | "preview"
  | "email"
  | "password"
  | "artist-name"
  | "genres"
  | "package";

const STORAGE_KEY = "get-feedback-progress";

interface StoredProgress {
  trackUrl: string;
  inputMode: "url" | "upload";
  uploadedUrl: string;
  uploadedFileName: string;
  title: string;
  artworkUrl: string | null;
  email: string;
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
  const [inputMode, setInputMode] = useState<"url" | "upload">("url");
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
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Profile state
  const [artistName, setArtistName] = useState("");

  // Track details state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [feedbackFocus, setFeedbackFocus] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);

  // Package state
  const [selectedPackage, setSelectedPackage] = useState<PackageType>("STANDARD");

  // UI state
  const [urlError, setUrlError] = useState("");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldError, setFieldError] = useState("");

  // Free credits (for logged in users)
  const [freeCredits, setFreeCredits] = useState(0);

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

  // Load free credits for logged in users
  useEffect(() => {
    if (!isLoggedIn) return;
    async function fetchCredits() {
      try {
        const response = await fetch("/api/artist/profile");
        if (response.ok) {
          const data = await response.json();
          setFreeCredits(data.freeReviewCredits ?? 0);
          if (data.artistName) {
            setArtistName(data.artistName);
          }
        }
      } catch (error) {
        console.error("Failed to fetch credits:", error);
      }
    }
    fetchCredits();
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
        }
        if (metadata.artworkUrl) {
          setArtworkUrl(metadata.artworkUrl);
        }
      }
    } catch {
      // Silently fail
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
          setError("Failed to upload MP3");
          return;
        }

        finalUrl = presignData.fileUrl;
      } else {
        const errorData = await presignRes.json().catch(() => ({}));
        setError(errorData.error || "Failed to prepare upload");
        return;
      }

      if (!finalUrl) {
        setError("Failed to upload MP3");
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
    } catch {
      setError("Failed to upload MP3");
    } finally {
      setIsUploading(false);
    }
  };

  // Check if email exists
  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    setIsCheckingEmail(true);
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
    } finally {
      setIsCheckingEmail(false);
    }
  };

  useEffect(() => {
    if (step !== "email" || isLoggedIn) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setEmailExists(false);
      setNotice("");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setEmailExists(false);
      setNotice("");
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail }),
        });

        if (!response.ok) return;
        const data = (await response.json()) as { exists?: boolean };
        if (cancelled) return;

        const exists = Boolean(data.exists);
        setEmailExists(exists);
        if (exists) {
          setNotice(
            `An account already exists for ${normalizedEmail}. You'll log in next.`
          );
        } else {
          setNotice("");
        }
      } catch {
        if (!cancelled) {
          setEmailExists(false);
          setNotice("");
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [email, isLoggedIn, step]);

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
      if (!/[A-Z]/.test(password)) errors.push("uppercase letter");
      if (!/[a-z]/.test(password)) errors.push("lowercase letter");
      if (!/\d/.test(password)) errors.push("number");
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("symbol");
    }
    return errors;
  })();

  const isPasswordValid = password.length >= 8 && passwordErrors.length === 0;

  // Determine which steps to show based on auth state
  const getStepsForUser = (): Step[] => {
    const steps: Step[] = ["track", "preview"];

    if (!isLoggedIn) {
      steps.push("email", "password");
    }

    if (!hasArtistProfile && !isLoggedIn) {
      steps.push("artist-name");
    }

    steps.push("genres", "package");
    return steps;
  };

  const steps = getStepsForUser();
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Navigation
  const goBack = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
      setFieldError("");
    }
  };

  const goNext = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
      setFieldError("");
    }
  };

  // Handle email step continue
  const handleEmailContinue = async () => {
    if (!email.trim()) {
      setFieldError("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFieldError("Please enter a valid email");
      return;
    }

    setNotice("");

    const exists = await checkEmailExists(email);
    setEmailExists(exists);
    if (exists) {
      const normalizedEmail = email.trim().toLowerCase();
      setNotice(
        `An account already exists for ${normalizedEmail}. You'll log in next.`
      );
    }
    goNext();
  };

  // Handle password step (login or signup)
  const handlePasswordContinue = async () => {
    if (emailExists) {
      // Try to log in
      if (!password) {
        setFieldError("Please enter your password");
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          setFieldError("Incorrect password. Please try again.");
          return;
        }

        // Logged in successfully - refresh session and continue
        router.refresh();
        // Skip to genres step since they now have an account
        setNotice("");
        setStep("genres");
      } catch {
        setFieldError("Login failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Creating new account - validate password
      if (!isPasswordValid) {
        setFieldError("Please create a stronger password");
        return;
      }
      goNext();
    }
  };

  // Handle final submission
  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      if (!isLoggedIn && email) {
        const exists = await checkEmailExists(email);
        if (exists) {
          setError("An account with this email already exists. Please go back and log in.");
          setEmailExists(true);
          setIsSubmitting(false);
          return;
        }
      }

      // Build submission data
      const submitData = {
        // Track info
        sourceUrl: inputMode === "upload" ? uploadedUrl : trackUrl,
        sourceType: inputMode === "upload" ? "UPLOAD" : sourceType,
        title: title.trim(),
        artworkUrl,
        duration: uploadedDuration,
        genreIds: selectedGenres,
        feedbackFocus: feedbackFocus.trim() || undefined,
        packageType: selectedPackage,

        // Account info (only if not logged in)
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

      // If we created an account, sign in
      if (!isLoggedIn && data.signIn) {
        await signIn("credentials", {
          redirect: false,
          email: email.trim().toLowerCase(),
          password,
        });
      }

      // Redirect to checkout
      router.push(data.checkoutUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if we can proceed from current step
  const hasTrack =
    inputMode === "url"
      ? trackUrl && !urlError && !isLoadingMetadata && title
      : !!uploadedUrl && !isUploading;

  // Show loading while checking session
  if (sessionStatus === "loading" || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const selectedPackageDetails = PACKAGES[selectedPackage];

  return (
    <div className="min-h-screen bg-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-neutral-100 z-50">
        <div
          className="h-full bg-lime-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="border-b-2 border-black bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            {isLoggedIn && (
              <span className="text-sm text-neutral-500">
                {session.user?.email}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
            <p>{error}</p>
            {emailExists && !isLoggedIn && (
              <button
                onClick={() => setStep("password")}
                className="mt-2 underline hover:no-underline font-bold"
              >
                Go back to log in
              </button>
            )}
          </div>
        )}

        {/* Free credit banner for logged in users */}
        {isLoggedIn && freeCredits > 0 && (
          <div className="mb-6 bg-lime-400 border-2 border-black p-3 flex items-center gap-3">
            <Gift className="h-5 w-5 text-black flex-shrink-0" />
            <p className="text-sm font-bold text-black">
              You have a free review credit!
            </p>
          </div>
        )}

        {/* Step: Track URL/Upload */}
        {step === "track" && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-lime-400 border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wide">
                <Music className="h-4 w-4" />
                Start here
              </div>
              <h1 className="text-3xl font-black mt-4">
                What track do you want feedback on?
              </h1>
              <p className="text-neutral-500 mt-2">
                Share a link or upload an MP3
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setInputMode("url");
                  setUploadedUrl("");
                  setUploadedFileName("");
                  setError("");
                }}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-black border-2 border-black transition-colors",
                  inputMode === "url"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-neutral-100"
                )}
              >
                Paste link
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode("upload");
                  setTrackUrl("");
                  setUrlError("");
                  setError("");
                }}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-black border-2 border-black transition-colors",
                  inputMode === "upload"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-neutral-100"
                )}
              >
                Upload MP3
              </button>
            </div>

                {inputMode === "url" ? (
                  <div className="space-y-4 flex-1">
                    <Input
                      placeholder="Paste your SoundCloud, Bandcamp, or YouTube link"
                      value={trackUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className={cn("text-lg h-14", urlError && "border-red-500")}
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
                          void handleUpload(file);
                        } else {
                          setError("Please upload an MP3 file");
                        }
                      }}
                      className={cn(
                        "border-2 border-dashed p-12 text-center cursor-pointer transition-all bg-neutral-50",
                        isDragging && "border-lime-500 bg-lime-50",
                        !isDragging &&
                          !uploadedFileName &&
                          "border-neutral-300 hover:border-black hover:bg-white",
                        uploadedFileName && !isUploading && "border-lime-500 bg-lime-50"
                      )}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-12 w-12 animate-spin text-neutral-400" />
                          <p className="font-medium text-neutral-600">Uploading...</p>
                        </div>
                      ) : uploadedFileName ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-14 w-14 bg-lime-500 border-2 border-black flex items-center justify-center">
                            <Check className="h-7 w-7 text-white" />
                          </div>
                          <p className="font-bold text-black">{uploadedFileName}</p>
                          <p className="text-sm text-neutral-500">Click to change</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-14 w-14 bg-neutral-100 border-2 border-black flex items-center justify-center">
                            <Upload className="h-7 w-7 text-neutral-400" />
                          </div>
                          <p className="font-bold text-black text-lg">
                            Drop your MP3 here
                          </p>
                          <p className="text-sm text-neutral-500">or click to browse</p>
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
                )}

                {(isLoadingMetadata || title || artworkUrl) && (
                  <div className="border-2 border-black bg-white p-4 flex items-center gap-4">
                    {isLoadingMetadata ? (
                      <div className="w-16 h-16 bg-neutral-100 border-2 border-black flex-shrink-0" />
                    ) : artworkUrl ? (
                      <img
                        src={artworkUrl}
                        alt="Track artwork"
                        className="w-16 h-16 object-cover border-2 border-black flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-neutral-100 border-2 border-black flex items-center justify-center flex-shrink-0">
                        <Music className="h-7 w-7 text-neutral-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {isLoadingMetadata ? (
                        <div className="space-y-2">
                          <div className="h-5 bg-neutral-100" />
                          <div className="h-4 bg-neutral-100 w-24" />
                        </div>
                      ) : (
                        <>
                          <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Track title"
                            className="text-lg font-black border-0 border-b-2 border-neutral-200 rounded-none px-0 focus:border-black"
                          />
                          <p className="text-xs text-neutral-500 mt-2 capitalize">
                            {sourceType ? sourceType.toLowerCase().replace("_", " ") : ""}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

            {hasTrack && (
              <div className="pt-2">
                <Button
                  onClick={goNext}
                  variant="primary"
                  className="w-full h-14 text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none"
                >
                  Continue
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step: Track Preview */}
        {step === "preview" && (
          <div className="space-y-6">
            <button
              onClick={goBack}
              className="text-sm text-neutral-500 hover:text-black flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div>
              <h1 className="text-3xl font-black">Is this your track?</h1>
              <p className="text-neutral-500 mt-2">
                Make sure we found the right one
              </p>
            </div>

            <div className="border-2 border-black bg-white p-6 flex items-center gap-6">
              {artworkUrl ? (
                <img
                  src={artworkUrl}
                  alt="Track artwork"
                  className="w-24 h-24 object-cover border-2 border-black flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 bg-neutral-100 border-2 border-black flex items-center justify-center flex-shrink-0">
                  <Music className="h-10 w-10 text-neutral-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Track title"
                  className="text-xl font-bold border-0 border-b-2 border-neutral-200 rounded-none px-0 focus:border-black"
                />
                <p className="text-sm text-neutral-500 mt-2 capitalize">
                  {sourceType.toLowerCase().replace("_", " ")}
                </p>
              </div>
            </div>

            <Button
              onClick={goNext}
              variant="primary"
              className="w-full h-14 text-lg"
            >
              Yes, that&apos;s my track
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step: Email */}
        {step === "email" && (
          <div className="space-y-6">
            <button
              onClick={goBack}
              className="text-sm text-neutral-500 hover:text-black flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div>
              <h1 className="text-3xl font-black">What&apos;s your email?</h1>
              <p className="text-neutral-500 mt-2">
                We&apos;ll send your feedback here
              </p>
            </div>

            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldError("");
                    setNotice("");
                  }}
                  className="text-lg h-14 pl-12"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEmailContinue();
                  }}
                />
              </div>
              {fieldError && (
                <p className="text-sm text-red-500 font-medium mt-2">{fieldError}</p>
              )}
              {!fieldError && notice && (
                <div className="mt-2 bg-neutral-50 border-2 border-black text-black text-sm p-3 font-medium">
                  {notice}
                </div>
              )}
            </div>

            <div>
              <Button
                onClick={handleEmailContinue}
                isLoading={isCheckingEmail}
                variant="primary"
                className="w-full h-14 text-lg"
              >
                {emailExists ? "Continue to log in" : "Continue"}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <p className="text-center text-xs text-neutral-400 mt-4">
                Already have an account? We&apos;ll detect it automatically.
              </p>
            </div>
          </div>
        )}

        {/* Step: Password */}
        {step === "password" && (
          <div className="space-y-6">
            <button
              onClick={goBack}
              className="text-sm text-neutral-500 hover:text-black flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div>
              {emailExists ? (
                <>
                  <h1 className="text-3xl font-black">This email already has an account</h1>
                  <p className="text-neutral-500 mt-2">
                    An account already exists for <span className="font-bold text-black">{email.trim().toLowerCase()}</span>. Enter your password to continue.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-black">Create a password</h1>
                  <p className="text-neutral-500 mt-2">
                    To save your feedback and track progress
                  </p>
                </>
              )}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={emailExists ? "Your password" : "Create a password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldError("");
                  }}
                  className="text-lg h-14 pl-12 pr-12"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePasswordContinue();
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {!emailExists && password.length > 0 && (
                <div className="mt-3 space-y-1">
                  {passwordErrors.length > 0 ? (
                    <p className="text-sm text-neutral-500">
                      Needs: {passwordErrors.join(", ")}
                    </p>
                  ) : (
                    <p className="text-sm text-lime-600 flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Strong password
                    </p>
                  )}
                </div>
              )}

              {fieldError && (
                <p className="text-sm text-red-500 font-medium mt-2">{fieldError}</p>
              )}

              {emailExists && (
                <Link
                  href="/forgot-password"
                  className="text-sm text-neutral-500 hover:text-black mt-3 inline-block"
                >
                  Forgot your password?
                </Link>
              )}
            </div>

            <Button
              onClick={handlePasswordContinue}
              isLoading={isSubmitting}
              variant="primary"
              className="w-full h-14 text-lg"
            >
              {emailExists ? "Log in" : "Continue"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step: Artist Name */}
        {step === "artist-name" && (
          <div className="space-y-6">
            <button
              onClick={goBack}
              className="text-sm text-neutral-500 hover:text-black flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div>
              <h1 className="text-3xl font-black">What&apos;s your artist name?</h1>
              <p className="text-neutral-500 mt-2">
                How reviewers will know you
              </p>
            </div>

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <Input
                placeholder="Your artist or project name"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="text-lg h-14 pl-12"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && artistName.trim()) goNext();
                }}
              />
            </div>

            <Button
              onClick={goNext}
              disabled={!artistName.trim()}
              variant="primary"
              className="w-full h-14 text-lg"
            >
              Continue
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step: Genres */}
        {step === "genres" && (
          <div className="space-y-6">
            <button
              onClick={goBack}
              className="text-sm text-neutral-500 hover:text-black flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div>
              <h1 className="text-3xl font-black">What genre is your track?</h1>
              <p className="text-neutral-500 mt-2">
                Pick up to 3 so we match you with the right listeners
              </p>
            </div>

            <GenreSelector
              genres={genres}
              selectedIds={selectedGenres}
              onToggle={toggleGenre}
              maxSelections={3}
              variant="artist"
            />

            <Button
              onClick={goNext}
              disabled={selectedGenres.length === 0}
              variant="primary"
              className="w-full h-14 text-lg"
            >
              Continue
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step: Package Selection */}
        {step === "package" && (
          <div className="space-y-6">
            <button
              onClick={goBack}
              className="text-sm text-neutral-500 hover:text-black flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div>
              <h1 className="text-3xl font-black">How many reviews do you want?</h1>
              <p className="text-neutral-500 mt-2">
                More opinions = clearer patterns
              </p>
            </div>

            <div className="space-y-4">
              {ACTIVE_PACKAGE_TYPES.map((key) => {
                const pkg = PACKAGES[key];
                const isSelected = selectedPackage === key;
                const isPopular = key === "STANDARD";
                const showFree = freeCredits > 0;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPackage(key)}
                    className={cn(
                      "relative w-full text-left border-2 border-black transition-all",
                      isSelected && "ring-2 ring-lime-500 ring-offset-2",
                      !isSelected && "hover:bg-neutral-50",
                      isPopular && !isSelected && "shadow-[4px_4px_0px_0px_rgba(132,204,22,1)]"
                    )}
                  >
                    {isPopular && (
                      <span className="absolute -top-3 left-4 text-xs font-bold bg-lime-500 text-black px-3 py-1 border-2 border-black">
                        MOST POPULAR
                      </span>
                    )}

                    <div className={cn(
                      "p-5",
                      isSelected ? "bg-lime-400" : isPopular ? "bg-lime-50" : "bg-white"
                    )}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={cn(
                              "text-3xl font-black",
                              isSelected ? "text-black" : "text-black"
                            )}>
                              {pkg.reviews}
                            </span>
                            <span className="text-lg font-bold text-neutral-700">reviews</span>
                          </div>
                          <p className="text-sm text-neutral-600">{pkg.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {showFree ? (
                            <div>
                              <span className="text-2xl font-black text-lime-600">FREE</span>
                              <p className="text-sm text-neutral-400 line-through">
                                ${(pkg.price / 100).toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <span className="text-2xl font-black">${(pkg.price / 100).toFixed(2)}</span>
                              <p className="text-sm text-neutral-500">AUD</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-black/20 flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          <span className="text-sm font-bold">Selected</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <Button
                onClick={handleSubmit}
                isLoading={isSubmitting}
                variant="primary"
                className="w-full h-14 text-lg"
              >
                {freeCredits > 0 ? (
                  <>
                    <Gift className="h-5 w-5 mr-2" />
                    Get Your Free Review
                  </>
                ) : (
                  <>Continue to Payment</>
                )}
              </Button>
              <p className="text-center text-xs text-neutral-500 mt-3">
                {freeCredits > 0 ? "No payment required" : "Secure payment via Stripe"}
              </p>
            </div>

            {/* Terms agreement for new accounts */}
            {!isLoggedIn && (
              <p className="text-center text-xs text-neutral-400">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-black">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-black">
                  Privacy Policy
                </Link>
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
