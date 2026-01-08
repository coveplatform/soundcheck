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
  Star,
  ArrowRight,
  ArrowLeft,
  Link2,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  validateTrackUrl,
  fetchTrackMetadata,
  detectSource,
  PACKAGES,
  PackageType,
} from "@/lib/metadata";
import { GenreSelector } from "@/components/ui/genre-selector";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { trackTikTokEvent } from "@/components/providers";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

interface Genre {
  id: string;
  name: string;
  slug: string;
}

type Step = "track" | "matching" | "details" | "package";

const STORAGE_KEY = "get-feedback-progress-v2";

interface StoredProgress {
  step: Step;
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
  const prevLoggedInRef = useRef(isLoggedIn);
  const hasTrackedViewContentRef = useRef(false);
  const lastTrackedLinkRef = useRef<string>("");
  const lastCapturedLeadRef = useRef<string>("");

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
  const trackPreviewRef = useRef<HTMLDivElement>(null);

  // Account state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [artistName, setArtistName] = useState("");

  // Track details state
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [feedbackFocus, setFeedbackFocus] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isEditingGenres, setIsEditingGenres] = useState(false);

  // Package state
  const [selectedPackage, setSelectedPackage] = useState<PackageType>("STANDARD");
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);

  const estimatedListenerPool = 25;

  // UI state
  const [urlError, setUrlError] = useState("");
  const [urlWarning, setUrlWarning] = useState("");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [finishLaterMessage, setFinishLaterMessage] = useState("");
  const [isSendingFinishLater, setIsSendingFinishLater] = useState(false);
  const [isContinuingToPackage, setIsContinuingToPackage] = useState(false);
  const [matchingIndex, setMatchingIndex] = useState(0);
  const [matchingDone, setMatchingDone] = useState(false);

  const [trackStartStage, setTrackStartStage] = useState<"start" | "connect" | "track">("start");

  useEffect(() => {
    if (!isLoggedIn) return;
    setTrackStartStage("track");
  }, [isLoggedIn]);

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

  useEffect(() => {
    if (hasTrackedViewContentRef.current) return;
    hasTrackedViewContentRef.current = true;
    trackTikTokEvent("ViewContent", {
      content_type: "product",
      content_id: "get_feedback",
    });
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

    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") {
      localStorage.removeItem(STORAGE_KEY);
      setTrackStartStage("start");
      setIsInitialized(true);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredProgress = JSON.parse(stored);
        // Restore step - but only if we have track data to support it
        if (data.step && (data.uploadedUrl || data.trackUrl)) {
          setStep(data.step === "matching" ? "details" : data.step);
        }
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

        if (isLoggedIn) {
          setTrackStartStage("track");
        } else if (data.uploadedUrl || data.trackUrl || data.uploadedFileName || data.email) {
          setTrackStartStage("track");
        } else {
          setTrackStartStage("start");
        }
      }
    } catch {
      // Ignore parse errors
    }
    setIsInitialized(true);
  }, [isLoggedIn, hasArtistProfile]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    const wasLoggedIn = prevLoggedInRef.current;
    prevLoggedInRef.current = isLoggedIn;

    // Only auto-advance after a NEW login event (e.g. user taps "Continue with Google").
    // If the user is already logged in when the page loads, keep the progressive UI visible.
    if (!wasLoggedIn && isLoggedIn) {
      setTrackStartStage("track");

      // If user just logged in (e.g., Google OAuth) and is on details step with genres selected,
      // auto-advance to package step so they don't just see "Signed in as..." message
      if (step === "details" && selectedGenres.length > 0) {
        setStep("package");
      }
    }
  }, [isLoggedIn, sessionStatus, step, selectedGenres.length]);

  useEffect(() => {
    if (trackStartStage !== "track") return;
    if (inputMode !== "url") return;
    const trimmed = trackUrl.trim();
    if (!trimmed) return;
    if (isLoadingMetadata || urlError) return;
    if (lastTrackedLinkRef.current === trimmed) return;
    lastTrackedLinkRef.current = trimmed;

    trackTikTokEvent("AddToCart", {
      content_type: "product",
      content_id: "track_link",
    });
  }, [trackStartStage, inputMode, trackUrl, isLoadingMetadata, urlError, urlWarning]);

  const captureLead = useCallback(
    async (params?: { sendEmail?: boolean }) => {
      if (isLoggedIn) return;

      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) return;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return;

      const normalizedArtistName = artistName.trim();
      if (!normalizedArtistName) return;

      const key = `${normalizedEmail}:${params?.sendEmail ? "1" : "0"}`;
      if (lastCapturedLeadRef.current === key) return;
      lastCapturedLeadRef.current = key;

      try {
        await fetch("/api/lead-capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            artistName: normalizedArtistName,
            source: "get-feedback",
            sendEmail: Boolean(params?.sendEmail),
          }),
        });
      } catch {
        // Best-effort only
      }
    },
    [email, artistName, isLoggedIn]
  );

  useEffect(() => {
    if (isLoggedIn) return;
    if (trackStartStage !== "track") return;
    if (!email.trim()) return;
    if (!artistName.trim()) return;
    void captureLead();
  }, [trackStartStage, email, artistName, isLoggedIn, captureLead]);

  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    if (typeof window === "undefined" || !isInitialized) return;
    const stepToStore: Step = step === "matching" ? "details" : step;
    const data: StoredProgress = {
      step: stepToStore,
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
    step,
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

  const isUrlTrackReady = Boolean(
    inputMode === "url" && trackUrl && !urlError && !isLoadingMetadata && title
  );

  // Scroll to track preview when it appears
  const hasTrackPreview = Boolean(uploadedUrl || isUrlTrackReady);
  useEffect(() => {
    if (hasTrackPreview && trackPreviewRef.current) {
      // Small delay to ensure the element is rendered
      setTimeout(() => {
        trackPreviewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [hasTrackPreview]);

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
          setUrlWarning("");
        }
        if (metadata.artworkUrl) {
          setArtworkUrl(metadata.artworkUrl);
        }
      } else {
        setUrlWarning("We couldn't verify this link. Make sure it's public and accessible.");
      }
    } catch {
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

  const passwordChecklist = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    { label: "Symbol", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  // Navigation
  const goBack = () => {
    if (step === "matching") setStep("track");
    if (step === "details") setStep("track");
    if (step === "package") setStep("details");
    setShouldAutoSubmit(false);
    setFieldErrors({});
  };

  // Validate and go to details
  const goToDetails = () => {
    // For URL mode: require verified link (no warning) and title
    // For upload mode: just need uploaded URL and title
    const hasTrack = inputMode === "url"
      ? trackUrl && !urlError && !isLoadingMetadata && title
      : !!uploadedUrl && !isUploading && title;

    if (!hasTrack) {
      setError("Please add your track first");
      return;
    }

    // Track TikTok event
    trackTikTokEvent("ViewContent", {
      content_type: "product",
      content_id: "feedback_flow",
    });

    setMatchingIndex(0);
    setMatchingDone(false);
    setStep("matching");
  };

  useEffect(() => {
    if (step !== "matching") return;

    const messages = 4;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    setMatchingIndex(0);
    setMatchingDone(false);

    for (let i = 1; i < messages; i++) {
      timers.push(
        setTimeout(() => {
          setMatchingIndex(i);
        }, i * 650)
      );
    }

    timers.push(
      setTimeout(() => {
        setMatchingDone(true);
      }, messages * 650)
    );

    timers.push(
      setTimeout(() => {
        setStep("details");
      }, messages * 650 + 600)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [step]);

  // Validate and go to package
  const goToPackage = async () => {
    setError("");
    setIsContinuingToPackage(true);

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
      setIsContinuingToPackage(false);
      return;
    }

    // Check if email exists for login flow
    if (!isLoggedIn && email) {
      const exists = await checkEmailExists(email.trim().toLowerCase());
      if (exists) {
        // Try to log in with provided credentials
        const result = await signIn("credentials", {
          redirect: false,
          email: email.trim().toLowerCase(),
          password,
        });

        if (result?.error) {
          setFieldErrors({
            password:
              "This email is already registered. That password doesn’t match — try signing in or reset your password.",
          });
          setIsContinuingToPackage(false);
          return;
        }

        // Successfully logged in
        setShouldAutoSubmit(true);
        setStep("package");
        void router.refresh();
        setIsContinuingToPackage(false);
        return;
      } else {
        // Create account immediately (matches Google behavior)
        const normalizedEmail = email.trim().toLowerCase();

        const createRes = await fetch("/api/get-feedback/create-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
            artistName: artistName.trim(),
            genreIds: selectedGenres,
          }),
        });

        const createData = await createRes.json().catch(() => ({}));
        if (!createRes.ok) {
          setError(createData.error || "Couldn't create account");
          setIsContinuingToPackage(false);
          return;
        }

        const signInRes = await signIn("credentials", {
          redirect: false,
          email: normalizedEmail,
          password,
        });

        if (signInRes?.error) {
          setError("Account created, but we couldn't sign you in. Please log in.");
          setIsContinuingToPackage(false);
          return;
        }

        trackTikTokEvent("CompleteRegistration", {
          content_name: "artist",
        });

        setShouldAutoSubmit(true);
        setStep("package");
        void router.refresh();
        setIsContinuingToPackage(false);
        return;
      }
    }

    // Track TikTok event
    trackTikTokEvent("InitiateCheckout", {
      content_type: "product",
      content_id: selectedPackage,
      value: PACKAGES[selectedPackage].price / 100,
      currency: "AUD",
    });

    setShouldAutoSubmit(true);
    setStep("package");
    setIsContinuingToPackage(false);
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
        // Include artistName for logged-in users without a profile too
        ...((!isLoggedIn || !hasArtistProfile) && artistName.trim() && {
          artistName: artistName.trim(),
        }),
        ...(!isLoggedIn && {
          email: email.trim().toLowerCase(),
          password,
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
      } else if (isLoggedIn && !hasArtistProfile) {
        // Logged-in user (e.g., Google OAuth) creating their first artistProfile
        trackTikTokEvent("CompleteRegistration", {
          content_name: "artist",
        });
      }

      // Redirect to success page (for free review) or checkout (for paid)
      router.push(data.successUrl || data.checkoutUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!shouldAutoSubmit) return;
    if (step !== "package") return;
    if (!isLoggedIn) return;
    if (isSubmitting) return;

    setShouldAutoSubmit(false);
    void handleSubmit();
  }, [handleSubmit, isLoggedIn, isSubmitting, shouldAutoSubmit, step]);

  // Check if we can proceed from track step
  // For URL mode: require verified link (no warning) and title
  const canContinueFromTrackStep = Boolean(
    title &&
      (inputMode === "url"
        ? trackUrl && !urlError && !isLoadingMetadata
        : uploadedUrl && !isUploading)
  );

  // Show loading while checking session
  if (sessionStatus === "loading" || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-lime-500" />
      </div>
    );
  }

  const progress = step === "track" ? 33 : step === "matching" ? 50 : step === "details" ? 66 : 100;

  const getFeedbackProofSection = (
    <div
      id="get-feedback-proof"
      className="space-y-6 pt-8 border-t border-neutral-800 text-left"
    >
      <div className="border-2 border-neutral-700 bg-neutral-950/30 p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 bg-lime-500 text-black flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-black text-white">What you’ll get</p>
            <p className="text-sm text-neutral-400">
              We combine multiple listener reviews into aggregated scores, distributions, and consensus highlights—so you can see what’s consistently landing (and what isn’t).
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-2 border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-bold text-neutral-200">
                <Check className="h-3.5 w-3.5 text-lime-500" />
                Specific timestamps
              </span>
              <span className="inline-flex items-center gap-2 border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-bold text-neutral-200">
                <Check className="h-3.5 w-3.5 text-lime-500" />
                Actionable next steps
              </span>
              <span className="inline-flex items-center gap-2 border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-bold text-neutral-200">
                <Check className="h-3.5 w-3.5 text-lime-500" />
                Aggregated scores
              </span>
              <span className="inline-flex items-center gap-2 border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-bold text-neutral-200">
                <Check className="h-3.5 w-3.5 text-lime-500" />
                Consensus highlights
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <details className="details-no-marker group border-2 border-neutral-700 bg-neutral-900">
          <summary className="cursor-pointer select-none p-4 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center">
                <Zap className="h-4 w-4 text-lime-500" />
              </div>
              <div>
                <p className="font-black text-white">Aggregated analytics</p>
                <p className="text-xs text-neutral-500">Averages + distributions from multiple listeners</p>
              </div>
            </div>
            <span className="text-xs font-mono text-neutral-500 group-open:text-lime-500">VIEW</span>
          </summary>
          <div className="border-t border-neutral-800 p-4">
            <div className="border border-neutral-700 bg-black/30 overflow-hidden">
              <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 p-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-lime-500" />
                <span className="font-bold text-sm text-white">Aggregated Results</span>
                <span className="text-xs text-neutral-500">from 5–20 listeners (depends on package)</span>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-neutral-800 bg-neutral-950/40 p-3 text-center">
                    <div className="text-2xl font-black text-lime-500">4.2</div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Production</div>
                  </div>
                  <div className="border border-neutral-800 bg-neutral-950/40 p-3 text-center">
                    <div className="text-2xl font-black text-white">3.8</div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Originality</div>
                  </div>
                  <div className="border border-neutral-800 bg-neutral-950/40 p-3 text-center">
                    <div className="text-2xl font-black text-lime-500">4.5</div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Vocals</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">First impressions</span>
                    <span className="text-xs font-mono text-neutral-500">Example</span>
                  </div>
                  <div className="h-3 w-full rounded-full overflow-hidden flex bg-neutral-800">
                    <div className="h-full bg-lime-500" style={{ width: "67%" }} />
                    <div className="h-full bg-amber-400" style={{ width: "25%" }} />
                    <div className="h-full bg-neutral-500" style={{ width: "8%" }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-400">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-lime-500" />
                      Strong hook
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      Decent
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-neutral-500" />
                      Lost
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-800 bg-neutral-950/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Would listen again</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-lime-500 text-black">83%</span>
                  </div>
                  <div className="h-2 bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-lime-500" style={{ width: "83%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </details>

        <details className="details-no-marker group border-2 border-neutral-700 bg-neutral-900">
          <summary className="cursor-pointer select-none p-4 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center">
                <Star className="h-4 w-4 text-lime-500" />
              </div>
              <div>
                <p className="font-black text-white">Example feedback</p>
                <p className="text-xs text-neutral-500">One review (your package includes more)</p>
              </div>
            </div>
            <span className="text-xs font-mono text-neutral-500 group-open:text-lime-500">VIEW</span>
          </summary>
          <div className="border-t border-neutral-800 p-4">
            <div className="border border-neutral-700 bg-black/30 p-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center text-sm font-black text-white">
                  S
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">Sarah</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-lime-500 text-black">Strong hook</span>
                  </div>
                  <p className="text-xs text-neutral-500">Example review</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-300">
                <span>Production <strong className="text-white">4/5</strong></span>
                <span>Vocals <strong className="text-white">5/5</strong></span>
                <span>Originality <strong className="text-white">4/5</strong></span>
                <span className="text-lime-400 font-bold">Would listen again</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="border-l-4 border-lime-500 pl-3">
                  <p className="text-xs font-bold text-lime-400 uppercase tracking-wide">What worked</p>
                  <p className="text-sm text-neutral-200 leading-relaxed">
                    The synth hook around 0:45 is genuinely catchy. Low end is tight and punchy.
                    The breakdown at 2:15 adds a great dynamic shift.
                  </p>
                </div>
                <div className="border-l-4 border-red-400 pl-3">
                  <p className="text-xs font-bold text-red-300 uppercase tracking-wide">To improve</p>
                  <p className="text-sm text-neutral-200 leading-relaxed">
                    The intro feels long before the hook hits—consider trimming 8–10 seconds.
                    The vocal sample at 1:30 sits too loud and clashes with the lead synth.
                  </p>
                </div>
                <div className="border-l-4 border-neutral-200 pl-3">
                  <p className="text-xs font-bold text-neutral-200 uppercase tracking-wide">Next actions</p>
                  <p className="text-sm text-neutral-200 leading-relaxed">
                    1) Tighten intro length. 2) Add hat variation. 3) EQ vocal sample.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-3">
              You’ll receive multiple reviews like this, plus pattern analytics that summarize the consensus.
            </p>
          </div>
        </details>
      </div>

      <div className="border-2 border-neutral-700 bg-neutral-900 p-5">
        <p className="font-black text-white mb-3">FAQ</p>
        <div className="space-y-2">
          <details className="group border border-neutral-800 bg-neutral-950/40 p-3">
            <summary className="cursor-pointer select-none font-bold text-sm text-neutral-200 flex items-center justify-between">
              What platforms do you support?
              <span className="text-xs font-mono text-neutral-500 group-open:text-lime-500">OPEN</span>
            </summary>
            <p className="text-sm text-neutral-400 mt-2">
              SoundCloud, Bandcamp, YouTube, or an MP3 upload.
            </p>
          </details>

          <details className="group border border-neutral-800 bg-neutral-950/40 p-3">
            <summary className="cursor-pointer select-none font-bold text-sm text-neutral-200 flex items-center justify-between">
              Is my track private?
              <span className="text-xs font-mono text-neutral-500 group-open:text-lime-500">OPEN</span>
            </summary>
            <p className="text-sm text-neutral-400 mt-2">
              Yes. Only assigned reviewers can access your track. It isn’t publicly shared by default.
            </p>
          </details>

          <details className="group border border-neutral-800 bg-neutral-950/40 p-3">
            <summary className="cursor-pointer select-none font-bold text-sm text-neutral-200 flex items-center justify-between">
              Do I need a credit card?
              <span className="text-xs font-mono text-neutral-500 group-open:text-lime-500">OPEN</span>
            </summary>
            <p className="text-sm text-neutral-400 mt-2">
              Your first review is free with no card required. You only pay if you choose a larger package.
            </p>
          </details>

          <details className="group border border-neutral-800 bg-neutral-950/40 p-3">
            <summary className="cursor-pointer select-none font-bold text-sm text-neutral-200 flex items-center justify-between">
              How do you ensure quality?
              <span className="text-xs font-mono text-neutral-500 group-open:text-lime-500">OPEN</span>
            </summary>
            <p className="text-sm text-neutral-400 mt-2">
              Reviews require minimum listening and detailed feedback. Reviewers are also rated, which helps maintain standards.
            </p>
          </details>
        </div>
      </div>
    </div>
  );

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
              <Logo className="text-white" />
            </Link>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
              <span className={cn(step === "track" && "text-lime-500")}>TRACK</span>
              <span>→</span>
              <span className={cn((step === "matching" || step === "details") && "text-lime-500")}>DETAILS</span>
              <span>→</span>
              <span className={cn(step === "package" && "text-lime-500")}>CONFIRM</span>
            </div>
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto px-4",
          step === "track" ? "py-10 max-w-4xl" : "py-8 max-w-2xl"
        )}
      >
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
          <div
            className="flex flex-col gap-10"
          >
            {/* Hero */}
            <div className="text-center space-y-6 order-[10]">
              {/* FREE badge */}
              <div className="inline-flex items-center gap-2 bg-lime-500 text-black px-5 py-3 mb-4">
                <Gift className="h-5 w-5" />
                <span className="font-black text-sm uppercase tracking-wide">First review FREE</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
                Real feedback.<span className="text-lime-500"> Real fast.</span>
              </h1>
              <p className="text-neutral-400 text-base sm:text-lg max-w-lg mx-auto">
                Genre-matched listeners review your track and tell you exactly what&apos;s working and what needs fixing.
              </p>

              {/* What you get - visual summary */}
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-2">
                <div className="bg-neutral-900 border border-neutral-700 p-4 text-center">
                  <p className="text-xl font-black text-lime-500">5-20</p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Reviews</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-700 p-4 text-center">
                  <p className="text-xl font-black text-lime-500">&lt;12h</p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Turnaround</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-700 p-4 text-center">
                  <p className="text-xl font-black text-lime-500">FREE</p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wide">First review</p>
                </div>
              </div>
            </div>

            {trackStartStage !== "track" && !isLoggedIn && (
              <div className="order-[15] w-full sm:max-w-lg sm:mx-auto">
                <div id="get-feedback-start" className="border-2 border-neutral-700 bg-neutral-900 p-5">
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-xs font-black uppercase tracking-wide text-neutral-400">Get feedback</p>
                      <h2 className="text-xl font-black text-white">
                        Start with your details
                      </h2>
                      <p className="text-sm text-neutral-400 mt-2">
                        We&apos;ll use this to send your feedback and save your progress.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder="Artist name"
                        value={artistName}
                        onChange={(e) => {
                          setArtistName(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, artistName: "" }));
                        }}
                        className={cn(
                          "h-12 bg-neutral-800 border-2 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-lime-500",
                          fieldErrors.artistName && "border-red-500"
                        )}
                      />
                      {fieldErrors.artistName && (
                        <p className="text-sm text-red-500 font-medium">{fieldErrors.artistName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        className={cn(
                          "h-12 bg-neutral-800 border-2 border-neutral-600 text-white placeholder:text-neutral-500 focus:border-lime-500",
                          fieldErrors.email && "border-red-500"
                        )}
                      />
                      {fieldErrors.email && (
                        <p className="text-sm text-red-500 font-medium">{fieldErrors.email}</p>
                      )}
                    </div>

                  <Button
                    type="button"
                    onClick={async () => {
                      setFinishLaterMessage("");

                      const nextArtistName = artistName.trim();
                      const nextEmail = email.trim().toLowerCase();

                      const errors: Record<string, string> = {};
                      if (!nextArtistName) errors.artistName = "Required";
                      if (!nextEmail) errors.email = "Required";
                      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) errors.email = "Invalid email";

                      if (Object.keys(errors).length > 0) {
                        setFieldErrors((prev) => ({ ...prev, ...errors }));
                        return;
                      }

                      setArtistName(nextArtistName);
                      setEmail(nextEmail);
                      await captureLead();

                      trackTikTokEvent("SubmitForm", {
                        content_type: "lead",
                        content_id: "get_feedback_lead",
                      });

                      setTrackStartStage("track");
                    }}
                    className="w-full h-12 text-base font-black bg-lime-500 text-black border-2 border-lime-500 hover:bg-lime-400"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <button
                    type="button"
                    disabled={isSendingFinishLater}
                    onClick={async () => {
                      setFinishLaterMessage("");

                      const nextArtistName = artistName.trim();
                      const nextEmail = email.trim().toLowerCase();

                      const errors: Record<string, string> = {};
                      if (!nextArtistName) errors.artistName = "Required";
                      if (!nextEmail) errors.email = "Required";
                      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) errors.email = "Invalid email";

                      if (Object.keys(errors).length > 0) {
                        setFieldErrors((prev) => ({ ...prev, ...errors }));
                        return;
                      }

                      setArtistName(nextArtistName);
                      setEmail(nextEmail);

                      setIsSendingFinishLater(true);
                      try {
                        await captureLead({ sendEmail: true });
                        setFinishLaterMessage("Sent. Check your email for a link to finish this later.");
                      } catch {
                        setFinishLaterMessage("Couldn't send email right now. Please try again.");
                      } finally {
                        setIsSendingFinishLater(false);
                      }
                    }}
                    className={cn(
                      "w-full text-sm font-bold border-2 h-11",
                      isSendingFinishLater
                        ? "bg-neutral-900 text-neutral-500 border-neutral-700"
                        : "bg-neutral-900 text-neutral-200 border-neutral-700 hover:border-neutral-500"
                    )}
                  >
                    Email me a link to finish later
                  </button>

                  {finishLaterMessage && (
                    <p className="text-xs text-neutral-400 text-center">{finishLaterMessage}</p>
                  )}
                </div>
              </div>
              </div>
            )}

            {trackStartStage !== "track" && (
              <div className="order-[20]">
                {getFeedbackProofSection}
              </div>
            )}

            {trackStartStage === "track" && (
              <div className="order-[20] space-y-10">
                <div className="w-full sm:max-w-lg sm:mx-auto space-y-8">
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
                  <div>
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
                            "border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all",
                            isDragging && "border-lime-500 bg-lime-500/10",
                            !isDragging && !uploadedFileName && "border-neutral-700 hover:border-lime-500 hover:bg-neutral-900",
                            uploadedFileName && !isUploading && "border-lime-500 bg-lime-500/10"
                          )}
                        >
                          {isUploading ? (
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="h-10 w-10 animate-spin text-lime-500" />
                              <p className="font-bold">Uploading...</p>
                            </div>
                          ) : uploadedFileName ? (
                            <div className="flex flex-col items-center gap-3">
                              <div className="h-10 w-10 bg-lime-500 flex items-center justify-center">
                                <Check className="h-5 w-5 text-black" />
                              </div>
                              <div>
                                <p className="font-black text-lg text-lime-500">{uploadedFileName}</p>
                                <p className="text-xs text-neutral-500 mt-1">Click to change</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <div className="h-10 w-10 bg-neutral-800 border-2 border-neutral-600 flex items-center justify-center">
                                <Upload className="h-5 w-5 text-neutral-400" />
                              </div>
                              <div>
                                <p className="font-black text-lg">Drop your MP3 here</p>
                                <p className="text-xs text-neutral-500 mt-1">or click to browse</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {!isUrlTrackReady ? (
                          <>
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
                          </>
                        ) : (
                          <div
                            ref={trackPreviewRef}
                            className="border-2 border-neutral-700 bg-neutral-900 p-4 space-y-3"
                          >
                            <div className="flex items-center gap-4">
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
                                  {sourceType ? sourceType.replace("_", " ") : "Ready"}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <p className="text-xs text-neutral-500 break-all">
                                {trackUrl}
                              </p>
                              <button
                                type="button"
                                className="text-sm font-bold text-lime-500 hover:text-lime-400"
                                onClick={() => {
                                  setTrackUrl("");
                                  setTitle("");
                                  setArtworkUrl(null);
                                  setSourceType("");
                                }}
                              >
                                Change link
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Track title edit */}
                  {inputMode === "upload" && uploadedUrl && (
                    <div ref={trackPreviewRef} className="border-2 border-neutral-700 bg-neutral-900 p-4 flex items-center gap-4">
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
                  {canContinueFromTrackStep && (
                    <Button
                      onClick={goToDetails}
                      className={cn(
                        "w-full h-14 text-lg font-black border-2 transition-all",
                        "bg-lime-500 text-black border-lime-500 hover:bg-lime-400 shadow-[4px_4px_0px_0px_rgba(132,204,22,1)] hover:shadow-[2px_2px_0px_0px_rgba(132,204,22,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                      )}
                    >
                      Continue
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  )}

                  {!canContinueFromTrackStep && (
                    <p className="text-center text-sm text-neutral-500">
                      Add your track to unlock the next step.
                    </p>
                  )}
                </div>

                {getFeedbackProofSection}
              </div>
            )}
          </div>
        )}

        {step === "matching" && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-neutral-900 border-2 border-neutral-700 px-4 py-2 text-sm font-black uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-lime-500" />
                Matching Reviewers
              </div>
              <h1 className="text-3xl sm:text-4xl font-black">Finding your best listeners</h1>
              <p className="text-neutral-400">This is where the signal gets good.</p>
            </div>

            <div className="relative border-2 border-neutral-700 bg-neutral-900 overflow-hidden">
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-lime-500/25 blur-3xl" />
                <div className="absolute -bottom-24 left-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-lime-500/10 blur-3xl" />
              </div>

              <div className="relative p-6 space-y-6">
                <div className="flex items-start gap-4">
                  {matchingDone ? (
                    <div className="h-12 w-12 bg-lime-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_0_2px_rgba(132,204,22,1),0_0_40px_rgba(132,204,22,0.25)]">
                      <Check className="h-6 w-6 text-black" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="h-6 w-6 animate-spin text-lime-500" />
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="font-black text-white text-lg">
                      {[
                        "Analyzing your track…",
                        "Matching genres & vibes…",
                        "Checking reviewer availability…",
                        "Reviewers found.",
                      ][matchingIndex]}
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">
                      {matchingDone ? "Locked in. Sending you to the next step…" : "This usually takes a few seconds."}
                    </p>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-mono text-neutral-500 mb-2">
                        <span>PROGRESS</span>
                        <span>{matchingDone ? 100 : Math.round((matchingIndex / 3) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-neutral-800 border border-neutral-700">
                        <div
                          className="h-full bg-lime-500 transition-all duration-500"
                          style={{ width: `${matchingDone ? 100 : Math.round((matchingIndex / 3) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Audio fingerprint",
                    "Genre fit",
                    "Listener quality",
                    "Queue ready",
                  ].map((label, idx) => {
                    const isComplete = matchingDone || idx < matchingIndex;
                    const isActive = !matchingDone && idx === matchingIndex;
                    return (
                      <div
                        key={label}
                        className={cn(
                          "flex items-center gap-3 border-2 p-3",
                          isActive ? "border-lime-500 bg-lime-500/10" : "border-neutral-700 bg-neutral-950/30"
                        )}
                      >
                        <div
                          className={cn(
                            "h-7 w-7 flex items-center justify-center flex-shrink-0 border-2",
                            isComplete
                              ? "bg-lime-500 border-lime-500"
                              : isActive
                                ? "border-lime-500 bg-neutral-900"
                                : "border-neutral-700 bg-neutral-900"
                          )}
                        >
                          {isComplete ? (
                            <Check className="h-4 w-4 text-black" />
                          ) : (
                            <span className={cn("text-xs font-mono", isActive ? "text-lime-500" : "text-neutral-500")}>
                              {idx + 1}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={cn("text-sm font-black truncate", isActive ? "text-white" : "text-neutral-300")}>{label}</p>
                          <p className="text-xs text-neutral-500">{isComplete ? "Done" : isActive ? "Running" : "Queued"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
              <p className="text-sm font-bold text-lime-500">
                We found {estimatedListenerPool}+ good-fit listeners for your track.
              </p>
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
                {/* Google sign-in option */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 bg-white hover:bg-neutral-100 text-black border-2 border-neutral-300"
                  onClick={() => signIn("google", { callbackUrl: "/get-feedback" })}
                >
                  <GoogleIcon className="h-5 w-5 mr-2" />
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-2 text-neutral-500">or create account</span>
                  </div>
                </div>

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
                    {password && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        {passwordChecklist.map((item) => (
                          <div key={item.label} className="flex items-center gap-2 text-xs">
                            <span
                              className={cn(
                                "h-4 w-4 flex items-center justify-center border",
                                item.met
                                  ? "bg-lime-500 border-lime-500 text-black"
                                  : "bg-neutral-900 border-neutral-700 text-neutral-400"
                              )}
                            >
                              {item.met ? "✓" : ""}
                            </span>
                            <span className={cn(item.met ? "text-neutral-300" : "text-neutral-500")}>{item.label}</span>
                          </div>
                        ))}
                      </div>
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

                <p className="text-sm text-neutral-500 text-center">
                  Already have an account?{" "}
                  <Link href={`/login?callbackUrl=${encodeURIComponent("/get-feedback")}`} className="text-lime-500 hover:text-lime-400 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            )}

            {/* Logged in user confirmation + artist name if needed */}
            {isLoggedIn && !isContinuingToPackage && (
              <div className="space-y-4">
                {/* Signed in confirmation - only show if not transitioning */}
                <div className="border-2 border-lime-500/30 bg-lime-500/10 p-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-lime-500 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Signed in as {session?.user?.email}</p>
                    <p className="text-sm text-neutral-400">Your feedback will be sent to this email</p>
                  </div>
                </div>

                {/* Artist name field for logged-in users without a profile */}
                {!hasArtistProfile && (
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
                )}
              </div>
            )}

            {/* Genre selection */}
            <div>
              <label className="text-sm font-bold text-neutral-400 mb-3 block">
                What genre is your track? <span className="text-neutral-600">(up to 3)</span>
              </label>

              {selectedGenres.length > 0 && !isEditingGenres ? (
                <div className="border-2 border-neutral-700 bg-neutral-900 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">Selected</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedGenres
                          .map((id) => genres.find((g) => g.id === id)?.name)
                          .filter((name): name is string => Boolean(name))
                          .map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center border border-neutral-700 bg-neutral-950/40 px-3 py-1 text-xs font-bold text-neutral-200"
                            >
                              {name}
                            </span>
                          ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-sm font-bold text-lime-500 hover:text-lime-400 flex-shrink-0"
                      onClick={() => setIsEditingGenres(true)}
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <GenreSelector
                    genres={genres}
                    selectedIds={selectedGenres}
                    onToggle={toggleGenre}
                    maxSelections={3}
                    variant="artist"
                    theme="dark"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-sm font-bold text-lime-500 hover:text-lime-400"
                      onClick={() => setIsEditingGenres(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {fieldErrors.genres && <p className="text-xs text-red-500 mt-2">{fieldErrors.genres}</p>}
            </div>

            {/* Continue button */}
            <Button
              onClick={goToPackage}
              isLoading={isContinuingToPackage}
              disabled={isContinuingToPackage}
              className="w-full h-14 text-lg font-black bg-lime-500 text-black border-2 border-lime-500 hover:bg-lime-400 shadow-[4px_4px_0px_0px_rgba(132,204,22,1)] hover:shadow-[2px_2px_0px_0px_rgba(132,204,22,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Continue
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {/* ============================================ */}
        {/* STEP 3: CONFIRM SUBMISSION */}
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
              <div className="inline-flex items-center gap-2 bg-lime-500 text-black px-3 py-1.5 mb-2">
                <Gift className="h-4 w-4" />
                <span className="font-black text-xs uppercase tracking-wide">Free Review</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black">Your free review is ready</h1>
              <p className="text-neutral-400">
                No payment required — just hit submit.
              </p>
            </div>

            {/* Track preview */}
            <div className="border-2 border-lime-500 bg-neutral-900 p-6">
              <div className="flex items-center gap-4 mb-4">
                {artworkUrl ? (
                  <img src={artworkUrl} alt="" className="w-16 h-16 object-cover border-2 border-neutral-600" />
                ) : (
                  <div className="w-16 h-16 bg-neutral-800 border-2 border-neutral-600 flex items-center justify-center">
                    <Music className="h-8 w-8 text-neutral-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-xl text-white truncate">{title}</p>
                  <p className="text-sm text-neutral-500">Ready for review</p>
                </div>
                <div className="h-10 w-10 bg-lime-500 flex items-center justify-center flex-shrink-0">
                  <Gift className="h-5 w-5 text-black" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-neutral-700">
                <span className="text-neutral-400">Your first review</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-lime-500">FREE</span>
                  <span className="text-xs text-neutral-500 ml-2 line-through">$4.95</span>
                </div>
              </div>
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

            {/* Submit button */}
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              className="w-full h-14 text-lg font-black bg-lime-500 text-black border-2 border-lime-500 hover:bg-lime-400 shadow-[4px_4px_0px_0px_rgba(132,204,22,1)] hover:shadow-[2px_2px_0px_0px_rgba(132,204,22,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Gift className="h-5 w-5 mr-2" />
              {isSubmitting ? "Submitting…" : "Get My Free Review"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            <p className="text-center text-xs text-neutral-500">
              Results in under 12 hours
            </p>

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
