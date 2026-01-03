"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Upload, Gift, Music, ArrowRight, ChevronDown } from "lucide-react";
import { GenreSelector } from "@/components/ui/genre-selector";
import { cn } from "@/lib/utils";
import { validateTrackUrl, fetchTrackMetadata, ACTIVE_PACKAGE_TYPES, PACKAGES, PackageType } from "@/lib/metadata";
import { AudioPlayer } from "@/components/audio/audio-player";

interface Genre {
  id: string;
  name: string;
  slug: string;
}

type Step = "track" | "details" | "package" | "confirm";

export default function SubmitTrackPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("track");

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
  const [showNotes, setShowNotes] = useState(false);

  // UI state
  const [genres, setGenres] = useState<Genre[]>([]);
  const [urlError, setUrlError] = useState("");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Free credit state
  const [freeCredits, setFreeCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);

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
    async function fetchCredits() {
      try {
        const response = await fetch("/api/artist/profile");
        if (response.ok) {
          const data = await response.json();
          setFreeCredits(data.freeReviewCredits ?? 0);
        }
      } catch (error) {
        console.error("Failed to fetch credits:", error);
      } finally {
        setIsLoadingCredits(false);
      }
    }
    fetchCredits();
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

  const handleUpload = async (file: File) => {
    setError("");
    setUrlError("");
    setIsUploading(true);
    setUploadedDuration(null);
    setUploadedFileName(file.name);

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
          router.push("/verify-email");
          router.refresh();
          return;
        }
        setError(data.error || "Something went wrong");
        return;
      }

      let checkoutUrl = `/artist/submit/checkout?trackId=${data.id}`;
      if (freeCredits > 0) {
        checkoutUrl += "&useFreeCredit=true";
      }
      router.push(checkoutUrl);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasTrack = inputMode === "url" ? (url && !urlError && !isLoadingMetadata) : (!!uploadedUrl && !isUploading);
  const hasDetails = title.trim() && selectedGenres.length > 0;
  const selectedPackageDetails = PACKAGES[selectedPackage];

  const goBack = () => {
    if (step === "details") setStep("track");
    else if (step === "package") setStep("details");
    else if (step === "confirm") setStep("package");
  };

  return (
    <div className="max-w-xl mx-auto min-h-[60vh] flex flex-col">
      {/* Free Credit Banner - always visible */}
      {!isLoadingCredits && freeCredits > 0 && (
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
              {urlError && <p className="text-sm text-red-500 font-medium">{urlError}</p>}
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
            <p className="text-neutral-500 mt-1">More opinions = clearer picture</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {ACTIVE_PACKAGE_TYPES.map((key) => {
              const pkg = PACKAGES[key];
              const isSelected = selectedPackage === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPackage(key)}
                  className={cn(
                    "p-4 border-2 border-black text-left transition-colors",
                    isSelected
                      ? "bg-lime-500"
                      : "bg-white hover:bg-neutral-50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">{pkg.name}</h3>
                      <p className="text-sm text-neutral-600 mt-0.5">
                        {pkg.reviews} reviews
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-lg">
                        ${(pkg.price / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-neutral-600 font-mono">
                        ${(pkg.price / pkg.reviews / 100).toFixed(2)}/review
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 mt-2">{pkg.mix}</p>
                  {isSelected && (
                    <div className="flex items-center gap-1.5 mt-2 text-black">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-bold">Selected</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <Button
              onClick={() => setStep("confirm")}
              variant="primary"
              className="w-full h-12 text-base"
            >
              Review & Submit
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
              freeCredits > 0 ? "bg-lime-400" : "bg-lime-500"
            )}>
              <div>
                <p className="font-black text-lg">{selectedPackageDetails.name}</p>
                <p className="text-sm font-medium">{freeCredits > 0 ? "1 review" : `${selectedPackageDetails.reviews} reviews`}</p>
              </div>
              <div className="text-right">
                {freeCredits > 0 ? (
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black">FREE</span>
                    <span className="text-sm line-through opacity-60">${(selectedPackageDetails.price / 100).toFixed(0)}</span>
                  </div>
                ) : (
                  <span className="text-3xl font-black">${(selectedPackageDetails.price / 100).toFixed(0)}</span>
                )}
              </div>
            </div>

            {/* What you get */}
            <div className="p-4 bg-white space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-lime-600 flex-shrink-0" />
                <span>{freeCredits > 0 ? "1 detailed written review" : `${selectedPackageDetails.reviews} detailed written reviews`}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-lime-600 flex-shrink-0" />
                <span>Genre-matched listeners</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-lime-600 flex-shrink-0" />
                <span>24-hour turnaround (usually faster)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-lime-600 flex-shrink-0" />
                <span>Honest, constructive feedback</span>
              </div>
            </div>
          </div>

          {/* Free credit banner */}
          {freeCredits > 0 && (
            <div className="mt-4 bg-lime-100 border-2 border-lime-500 p-3 flex items-center gap-3">
              <Gift className="h-5 w-5 text-lime-700 flex-shrink-0" />
              <p className="text-sm font-medium text-lime-800">
                Your free review credit will be applied at checkout
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6">
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              variant="primary"
              className="w-full h-14 text-lg font-bold"
            >
              {freeCredits > 0 ? (
                <>
                  <Gift className="h-5 w-5 mr-2" />
                  Get Your Free Review
                </>
              ) : (
                <>
                  Continue to Payment — ${(selectedPackageDetails.price / 100).toFixed(0)}
                </>
              )}
            </Button>
            <p className="text-center text-xs text-neutral-500 mt-3">
              {freeCredits > 0 ? "No payment required" : "Secure payment via Stripe"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
