"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Music, Plus, ArrowRight, Loader2, Check, X, Zap, Clock,
  Link2, Upload, GitCompareArrows,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BuyCreditsButton } from "@/components/credits/buy-credits-button";
import { detectSource } from "@/lib/metadata";
import { SupportedPlatforms } from "@/components/ui/supported-platforms";

type SourceType = "SOUNDCLOUD" | "BANDCAMP" | "YOUTUBE" | "UPLOAD";

interface EligibleTrack {
  id: string;
  title: string;
  artworkUrl: string | null;
  status: string;
  genreName: string | null;
  reviewsCompleted: number;
  reviewsRequested: number;
}

interface QueueTrackPickerProps {
  tracks: EligibleTrack[];
  credits: number;
  isPro?: boolean;
  open: boolean;
  onClose: () => void;
  initialTrackId?: string | null;
}

const REVIEW_BENEFITS = [
  { min: 1,  label: "Initial feedback"   },
  { min: 3,  label: "See patterns"       },
  { min: 5,  label: "Reliable consensus" },
  { min: 8,  label: "Detailed insights"  },
  { min: 10, label: "Comprehensive"      },
] as const;

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function QueueTrackPicker({ tracks, credits, isPro = false, open, onClose, initialTrackId }: QueueTrackPickerProps) {
  const router = useRouter();

  // Core state
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Compare mode state
  const [compareMode, setCompareMode] = useState(false);
  const [versionBInputMode, setVersionBInputMode] = useState<"link" | "file">("link");
  const [versionBUrl, setVersionBUrl] = useState("");
  const [versionBUrlError, setVersionBUrlError] = useState("");
  const [versionBSourceType, setVersionBSourceType] = useState<SourceType | null>(null);
  const [versionBTitle, setVersionBTitle] = useState("");
  const [versionBArtworkUrl, setVersionBArtworkUrl] = useState<string | null>(null);
  const [versionBIsLoadingMeta, setVersionBIsLoadingMeta] = useState(false);
  const [versionBUploadedUrl, setVersionBUploadedUrl] = useState("");
  const [versionBFileName, setVersionBFileName] = useState("");
  const [versionBIsUploading, setVersionBIsUploading] = useState(false);
  const versionBFileRef = useRef<HTMLInputElement>(null);

  // Reset everything when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedTrackId(initialTrackId ?? null);
      setReviewCount(Math.min(3, Math.max(1, credits)));
      setSuccess(false);
      setError("");
      setCompareMode(false);
      setVersionBInputMode("link");
      setVersionBUrl("");
      setVersionBUrlError("");
      setVersionBSourceType(null);
      setVersionBTitle("");
      setVersionBArtworkUrl(null);
      setVersionBIsLoadingMeta(false);
      setVersionBUploadedUrl("");
      setVersionBFileName("");
      setVersionBIsUploading(false);
    }
  }, [open, initialTrackId, credits]);

  // Debounced metadata fetch for Version B URL
  useEffect(() => {
    if (!compareMode || versionBInputMode !== "link") return;
    if (!versionBUrl.trim()) {
      setVersionBSourceType(null);
      setVersionBTitle("");
      setVersionBArtworkUrl(null);
      setVersionBUrlError("");
      return;
    }
    const timer = setTimeout(async () => {
      const src = detectSource(versionBUrl.trim());
      if (!src) {
        setVersionBUrlError("Use a SoundCloud, Bandcamp, or YouTube link");
        setVersionBSourceType(null);
        return;
      }
      setVersionBIsLoadingMeta(true);
      setVersionBUrlError("");
      setVersionBSourceType(null);
      try {
        const res = await fetch("/api/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: versionBUrl.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          setVersionBTitle(data.title ?? "Version B");
          setVersionBArtworkUrl(data.artworkUrl ?? null);
          setVersionBSourceType(src);
        } else {
          const data = await res.json();
          setVersionBUrlError(data.error || "Could not load track info");
        }
      } catch {
        setVersionBUrlError("Could not load track info");
      } finally {
        setVersionBIsLoadingMeta(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [compareMode, versionBInputMode, versionBUrl]);

  const handleVersionBFile = useCallback(async (file: File) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setVersionBUrlError("File too large (max 25MB)");
      return;
    }
    setVersionBIsUploading(true);
    setVersionBUrlError("");
    try {
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
        const d = await presignRes.json();
        setVersionBUrlError(d.error || "Upload failed");
        return;
      }
      const { uploadUrl, fileUrl } = await presignRes.json();
      const upRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "audio/mpeg" },
      });
      if (!upRes.ok) { setVersionBUrlError("Upload failed"); return; }
      setVersionBUploadedUrl(fileUrl);
      setVersionBFileName(file.name);
      setVersionBTitle(file.name.replace(/\.[^/.]+$/, ""));
    } catch {
      setVersionBUrlError("Upload failed");
    } finally {
      setVersionBIsUploading(false);
    }
  }, []);

  if (!open) return null;

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);

  const hasValidVersionB = versionBInputMode === "link"
    ? !!versionBUrl.trim() && !versionBUrlError && !!versionBSourceType && !versionBIsLoadingMeta
    : !!versionBUploadedUrl && !versionBIsUploading;

  const creditCost = compareMode ? reviewCount * 2 : reviewCount;
  const canAfford = credits >= creditCost;
  const currentBenefit = REVIEW_BENEFITS.filter(b => reviewCount >= b.min).slice(-1)[0];

  const handleSubmit = async () => {
    if (!selectedTrackId || !canAfford) return;
    if (compareMode && !hasValidVersionB) return;
    setError(""); setLoading(true);
    try {
      const body: Record<string, unknown> = { desiredReviews: reviewCount };
      if (compareMode && hasValidVersionB) {
        body.compareSecondary = {
          sourceUrl: versionBInputMode === "link" ? versionBUrl.trim() : versionBUploadedUrl,
          ...(versionBInputMode === "file" ? { sourceType: "UPLOAD" } : {}),
          title: versionBTitle || `${selectedTrack?.title ?? "Track"} — Version B`,
          artworkUrl: versionBArtworkUrl ?? null,
        };
      }
      const res = await fetch(`/api/tracks/${selectedTrackId}/request-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.refresh();
          onClose();
          setSuccess(false);
          setSelectedTrackId(null);
          setReviewCount(1);
        }, 1200);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to queue track");
      }
    } catch { setError("Something went wrong"); } finally { setLoading(false); }
  };

  // ── Success ──────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div>
        <div className="bg-[#0f0f18] px-6 py-5 flex items-center justify-between">
          <p className="text-sm font-black text-white">Done!</p>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="bg-white py-16 text-center">
          <div className="h-12 w-12 bg-[#0f0f18] flex items-center justify-center mx-auto mb-4">
            <Check className="h-6 w-6 text-white" />
          </div>
          <p className="text-base font-black text-black">You&apos;re in the queue</p>
          <p className="text-sm text-black/40 mt-1">Reviews will start coming in shortly.</p>
        </div>
      </div>
    );
  }

  // ── Track picker ─────────────────────────────────────────────────────────────
  if (!selectedTrack) {
    return (
      <div>
        <div className="bg-[#0f0f18] px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 mb-1">Get more reviews</p>
            <p className="text-lg font-black text-white leading-tight">Choose a track</p>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white transition-colors p-1"><X className="h-4 w-4" /></button>
        </div>

        <div className="bg-white">
          {tracks.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="h-12 w-12 bg-[#f2ede4] flex items-center justify-center mx-auto mb-4">
                <Music className="h-5 w-5 text-black/20" />
              </div>
              <p className="text-base font-black text-black mb-1">No tracks yet</p>
              <p className="text-sm text-black/40 mb-6">Upload a track first to get reviews.</p>
              <Link href="/submit" onClick={onClose} className="inline-flex items-center gap-2 bg-[#0f0f18] text-white font-bold text-sm px-5 py-3">
                Upload a track <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div>
              <Link href="/submit" onClick={onClose}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[#faf7f2] transition-colors border-b border-black/6 group"
              >
                <div className="w-12 h-12 border border-dashed border-black/15 flex items-center justify-center flex-shrink-0 group-hover:border-black/30 transition-colors">
                  <Plus className="h-4 w-4 text-black/25 group-hover:text-black/50 transition-colors" />
                </div>
                <p className="text-sm font-bold text-black/40 group-hover:text-black transition-colors">Upload a new track</p>
              </Link>

              <div className="max-h-[360px] overflow-y-auto">
                {tracks.map((track) => (
                  <button key={track.id} onClick={() => setSelectedTrackId(track.id)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#faf7f2] transition-colors border-b border-black/5 text-left group"
                  >
                    <div className="w-12 h-12 bg-[#f2ede4] flex-shrink-0 overflow-hidden relative">
                      {track.artworkUrl
                        ? <Image src={track.artworkUrl} alt={track.title} fill className="object-cover" sizes="48px" />
                        : <div className="w-full h-full flex items-center justify-center"><Music className="h-4 w-4 text-black/15" /></div>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold text-black truncate group-hover:text-purple-700 transition-colors">{track.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {track.genreName && <span className="text-[11px] text-black/30">{track.genreName}</span>}
                        <span className={cn("text-[11px] font-bold", track.status === "COMPLETED" ? "text-purple-500" : "text-black/25")}>
                          {track.status === "COMPLETED" ? `${track.reviewsCompleted} reviews` : "Uploaded"}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-black/15 group-hover:text-purple-500 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Review count + Compare form ───────────────────────────────────────────────
  return (
    <div>
      {/* Hidden file input for Version B */}
      <input
        ref={versionBFileRef}
        type="file"
        accept="audio/mpeg,audio/mp3,.mp3"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleVersionBFile(f); }}
      />

      {/* Dark header */}
      <div className="bg-[#0f0f18] px-6 py-5 flex items-center gap-4">
        <div className="w-12 h-12 flex-shrink-0 overflow-hidden bg-white/5">
          {selectedTrack.artworkUrl
            ? <Image src={selectedTrack.artworkUrl} alt={selectedTrack.title} width={48} height={48} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Music className="h-4 w-4 text-white/20" /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-0.5">Reviews for</p>
          <p className="text-base font-black text-white truncate">{selectedTrack.title}</p>
        </div>
        <button onClick={() => setSelectedTrackId(null)} className="flex-shrink-0 text-white/25 hover:text-white transition-colors p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && <div className="bg-red-500 px-6 py-3"><p className="text-sm font-bold text-white">{error}</p></div>}

      <div className="bg-white">

        {/* ── Single / Compare toggle ─────────────────────────── */}
        <div className="grid grid-cols-2 border-b border-black/8">
          <button
            type="button"
            onClick={() => setCompareMode(false)}
            className={cn(
              "px-5 py-4 text-left transition-all border-r border-black/8",
              !compareMode ? "bg-white" : "bg-[#faf7f2] hover:bg-white/80"
            )}
          >
            <p className={cn("text-sm font-black leading-tight", !compareMode ? "text-black" : "text-black/40")}>
              Single Track
            </p>
            <p className={cn("text-[10px] font-bold mt-0.5", !compareMode ? "text-black/40" : "text-black/20")}>
              1 credit / review
            </p>
          </button>
          <button
            type="button"
            onClick={() => setCompareMode(true)}
            className={cn(
              "px-5 py-4 text-left transition-all",
              compareMode ? "bg-purple-600" : "bg-[#faf7f2] hover:bg-white/80"
            )}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <GitCompareArrows className={cn("h-3.5 w-3.5", compareMode ? "text-white" : "text-black/30")} />
              <p className={cn("text-sm font-black leading-tight", compareMode ? "text-white" : "text-black/40")}>
                Compare
              </p>
            </div>
            <p className={cn("text-[10px] font-bold", compareMode ? "text-purple-200" : "text-black/20")}>
              2 credits / reviewer
            </p>
          </button>
        </div>

        {/* ── Compare explainer ───────────────────────────────── */}
        {compareMode && (
          <div className="bg-purple-50 border-b border-purple-100 px-6 py-4">
            <p className="text-xs font-black text-purple-900 mb-1">How it works</p>
            <p className="text-xs text-purple-800/70 leading-relaxed">
              Each reviewer listens to both versions and gives structured feedback on each. Results show side by side so you can see which one landed better — scores, written feedback, everything.
            </p>
            <p className="text-[11px] text-purple-600 font-bold mt-2">Costs 2 credits per reviewer — one for each version.</p>
          </div>
        )}

        {/* ── Version B input (compare mode only) ─────────────── */}
        {compareMode && (
          <div className="border-b border-black/8 px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/40">
                Version B
              </p>
              {/* Link / File toggle */}
              <div className="flex border border-black/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setVersionBInputMode("link");
                    setVersionBUploadedUrl("");
                    setVersionBFileName("");
                    setVersionBUrlError("");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black transition-colors",
                    versionBInputMode === "link" ? "bg-black text-white" : "bg-white text-black/40 hover:text-black"
                  )}
                >
                  <Link2 className="h-3 w-3" />
                  Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVersionBInputMode("file");
                    setVersionBUrl("");
                    setVersionBSourceType(null);
                    setVersionBTitle("");
                    setVersionBArtworkUrl(null);
                    setVersionBUrlError("");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black transition-colors border-l border-black/10",
                    versionBInputMode === "file" ? "bg-black text-white" : "bg-white text-black/40 hover:text-black"
                  )}
                >
                  <Upload className="h-3 w-3" />
                  File
                </button>
              </div>
            </div>

            {versionBInputMode === "link" ? (
              <div>
                <div className="relative">
                  <input
                    type="url"
                    value={versionBUrl}
                    onChange={(e) => {
                      setVersionBUrl(e.target.value);
                      setVersionBUrlError("");
                      setVersionBSourceType(null);
                    }}
                    placeholder="SoundCloud, Bandcamp, or YouTube URL"
                    className={cn(
                      "w-full px-4 py-3 text-sm font-medium border-2 bg-[#faf7f2] placeholder:text-black/25 focus:outline-none transition-colors pr-10",
                      versionBUrlError ? "border-red-400 focus:border-red-500" :
                      versionBSourceType ? "border-purple-400 focus:border-purple-500" :
                      "border-black/10 focus:border-black/30"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {versionBIsLoadingMeta && <Loader2 className="h-4 w-4 text-black/30 animate-spin" />}
                    {!versionBIsLoadingMeta && versionBSourceType && <Check className="h-4 w-4 text-purple-500" />}
                  </div>
                </div>
                <SupportedPlatforms
                  activeSource={versionBSourceType}
                  variant="compact"
                  className="mt-2.5"
                />
                {versionBUrlError && (
                  <p className="text-[11px] font-bold text-red-500 mt-1.5">{versionBUrlError}</p>
                )}
                {/* Track B preview */}
                {versionBSourceType && versionBTitle && (
                  <div className="flex items-center gap-3 mt-3 bg-purple-50 border border-purple-100 px-3 py-2.5">
                    {versionBArtworkUrl && (
                      <div className="w-9 h-9 flex-shrink-0 overflow-hidden relative">
                        <Image src={versionBArtworkUrl} alt={versionBTitle} fill className="object-cover" sizes="36px" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-black text-purple-900 truncate">{versionBTitle}</p>
                      <p className="text-[10px] text-purple-500 font-bold">{versionBSourceType}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {versionBUploadedUrl ? (
                  <div className="flex items-center gap-3 bg-[#faf7f2] border border-black/10 px-4 py-3">
                    <Check className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <p className="text-sm font-bold text-black truncate flex-1">{versionBFileName}</p>
                    <button
                      type="button"
                      onClick={() => { setVersionBUploadedUrl(""); setVersionBFileName(""); setVersionBTitle(""); }}
                      className="text-black/30 hover:text-black transition-colors flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => versionBFileRef.current?.click()}
                    disabled={versionBIsUploading}
                    className="w-full border-2 border-dashed border-black/15 hover:border-black/30 bg-[#faf7f2] hover:bg-white py-6 flex flex-col items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {versionBIsUploading ? (
                      <>
                        <Loader2 className="h-5 w-5 text-black/30 animate-spin" />
                        <p className="text-xs font-bold text-black/40">Uploading…</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-black/25" />
                        <p className="text-xs font-bold text-black/40">Click to upload MP3</p>
                        <p className="text-[10px] text-black/25">Max 25MB</p>
                      </>
                    )}
                  </button>
                )}
                {versionBUrlError && (
                  <p className="text-[11px] font-bold text-red-500 mt-1.5">{versionBUrlError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Review count ─────────────────────────────────────── */}
        <div className="px-6 pt-7 pb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/30 mb-6 text-center">How many reviews?</p>

          {/* Counter */}
          <div className="flex items-center justify-center gap-6 mb-5">
            <button type="button" onClick={() => setReviewCount(c => Math.max(1, c - 1))}
              className="h-12 w-12 border border-black/10 hover:border-black/30 text-black/40 hover:text-black text-xl font-light transition-colors flex items-center justify-center select-none"
            >−</button>
            <div className="text-center min-w-[80px]">
              <span className="text-[72px] font-black text-black leading-none tabular-nums">{reviewCount}</span>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/25 mt-1">
                {reviewCount === 1 ? "review" : "reviews"}
              </p>
            </div>
            <button type="button" onClick={() => setReviewCount(c => Math.min(10, c + 1))}
              className="h-12 w-12 border border-black/10 hover:border-black/30 text-black/40 hover:text-black text-xl font-light transition-colors flex items-center justify-center select-none"
            >+</button>
          </div>

          {/* Quick picks */}
          <div className="flex gap-1.5 justify-center mb-6">
            {[1, 3, 5, 8, 10].map(n => (
              <button key={n} type="button" onClick={() => setReviewCount(n)}
                className={cn(
                  "h-9 w-10 text-sm font-black transition-all border",
                  reviewCount === n ? "bg-[#0f0f18] border-[#0f0f18] text-white" : "border-black/10 text-black/40 hover:border-black/25 hover:text-black"
                )}
              >{n}</button>
            ))}
          </div>

          {/* Insight bar */}
          <div className="bg-[#faf7f2] px-4 py-3.5">
            <div className="flex gap-1 mb-2">
              {REVIEW_BENEFITS.map(b => (
                <div key={b.label} className={cn("h-1 flex-1 transition-all duration-300", reviewCount >= b.min ? "bg-purple-600" : "bg-black/8")} />
              ))}
            </div>
            <p className="text-sm font-bold text-black">{currentBenefit?.label ?? "Select"}</p>
            <p className="text-[10px] text-black/35 mt-0.5 uppercase tracking-wider font-bold">Insight level</p>
          </div>

          {/* Estimated wait */}
          <div className="bg-[#faf7f2] px-4 py-3.5 mt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="h-3 w-3 text-black/30" />
              <p className="text-[10px] font-black uppercase tracking-wider text-black/30">Estimated wait</p>
            </div>
            {isPro ? (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5">
                  <Zap className="h-2.5 w-2.5" /> Priority
                </span>
                <p className="text-xs font-bold text-black">Under 20 minutes</p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-black/45">Free <span className="text-black font-bold ml-1">4–8 hours</span></span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-xs font-black text-purple-600 tabular-nums">&lt; 20 min</span>
                  <span className="bg-purple-600 text-white text-[8px] font-black uppercase tracking-wider px-1 py-0.5">Pro</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Credits ─────────────────────────────────────────── */}
        <div className="border-t border-black/6 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30 mb-1">You have</p>
              <p className={cn("text-4xl font-black tabular-nums leading-none", credits === 0 ? "text-red-500" : "text-black")}>{credits}</p>
              <p className="text-[10px] text-black/30 mt-0.5 font-bold">credits</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30 mb-1">This costs</p>
              <p className={cn("text-4xl font-black tabular-nums leading-none", !canAfford ? "text-red-500" : "text-purple-600")}>{creditCost}</p>
              <p className="text-[10px] text-black/30 mt-0.5 font-bold">
                {compareMode ? `credits (${reviewCount} × 2)` : "credits"}
              </p>
            </div>
          </div>
          {isPro && (
            <p className="text-[11px] text-black/40 mt-3 flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-purple-600" /> Pro includes 30 credits every month · priority placement
            </p>
          )}
        </div>

        {/* ── Out of credits ─────────────────────────────────── */}
        {!isPro && !canAfford && (
          <div className="border-t border-black/6">
            {/* Pro — primary path */}
            <div className="bg-[#0f0f18] px-6 py-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-400/70 mb-1">You need {creditCost - credits} more credit{creditCost - credits === 1 ? "" : "s"}</p>
                  <p className="text-base font-black text-white leading-tight">Get 30 credits/month with Pro</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xl font-black text-white">$24.95</p>
                  <p className="text-[10px] text-white/30 font-bold">/ month</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                {["30 credits every month", "3 active slots", "Priority placement", "Unlimited reviews/day"].map(f => (
                  <p key={f} className="text-[11px] text-white/40 font-medium flex items-center gap-1.5">
                    <span className="text-purple-400">✓</span>{f}
                  </p>
                ))}
              </div>
              <Link href="/pro" onClick={onClose} className="block w-full bg-purple-600 hover:bg-purple-500 transition-colors text-white font-black text-sm py-3 text-center">
                Upgrade to Pro →
              </Link>
            </div>
            {/* Secondary paths */}
            <div className="grid grid-cols-2 border-t border-black/6">
              <BuyCreditsButton
                className="h-11 text-[12px] font-bold text-black/50 hover:text-black hover:bg-black/3 transition-colors border-r border-black/6 rounded-none w-full bg-transparent border-0 shadow-none"
                label="Buy 10 credits — $9.95"
              />
              <Link href="/review" onClick={onClose} className="flex items-center justify-center h-11 text-[12px] font-bold text-black/50 hover:text-black hover:bg-black/3 transition-colors">
                Earn free credits
              </Link>
            </div>
          </div>
        )}

        {/* ── Out of credits (Pro) ───────────────────────────── */}
        {isPro && !canAfford && (
          <div className="border-t border-black/6 bg-[#0f0f18] px-6 py-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-400/70 mb-1">
              You need {creditCost - credits} more credit{creditCost - credits === 1 ? "" : "s"}
            </p>
            <p className="text-sm font-medium text-white/60 mb-4">
              You&apos;ve used this month&apos;s Pro credits. Buy a pack or earn more by reviewing.
            </p>
            <div className="grid grid-cols-2 border-t border-white/10">
              <BuyCreditsButton
                className="h-11 text-[12px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors border-r border-white/10 rounded-none w-full bg-transparent border-0 shadow-none"
                label="Buy 10 credits — $9.95"
              />
              <Link href="/review" onClick={onClose} className="flex items-center justify-center h-11 text-[12px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                Earn free credits
              </Link>
            </div>
          </div>
        )}

        {/* ── Submit ─────────────────────────────────────────── */}
        <button
          onClick={handleSubmit}
          disabled={!canAfford || loading || (compareMode && !hasValidVersionB)}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-black/10 disabled:text-black/20 disabled:cursor-not-allowed text-white font-black text-[15px] py-5 transition-colors flex items-center justify-center gap-2.5"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Queuing…</>
            : compareMode && !hasValidVersionB
            ? <>Add Version B to continue</>
            : <>Request {reviewCount} {reviewCount === 1 ? "review" : "reviews"} <ArrowRight className="h-4 w-4" /></>
          }
        </button>
      </div>
    </div>
  );
}
