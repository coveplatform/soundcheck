"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { GenreSelector } from "@/components/ui/genre-selector";
import { SupportedPlatforms } from "@/components/ui/supported-platforms";
import { cn } from "@/lib/utils";
import { validateTrackUrl, fetchTrackMetadata, detectSource } from "@/lib/metadata";
import { BuyCreditsButton } from "@/components/credits/buy-credits-button";
import {
  Link2, Upload, Loader2, Check, Music,
  Crown, Sparkles, ImagePlus, Globe, Lock, AlertTriangle, Clock, Zap,
} from "lucide-react";

// ─── types ───────────────────────────────────────────────────────────────────

type UploadMode      = "link" | "file";
type SourceType      = "SOUNDCLOUD" | "BANDCAMP" | "YOUTUBE" | "UPLOAD" | null;
type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
type FeedbackArea    = "OVERALL_VIBE" | "MIXING" | "ARRANGEMENT" | "SONGWRITING" | "SOUND_DESIGN" | "RELEASE_READINESS";

interface Genre         { id: string; name: string; slug: string }
interface ArtistProfile { id: string; artistName: string; totalTracks: number; reviewCredits: number }

// ─── constants ───────────────────────────────────────────────────────────────

const REVIEW_BENEFITS = [
  { min: 1,  label: "First signal"       },
  { min: 3,  label: "Patterns forming"   },
  { min: 5,  label: "Reliable consensus" },
  { min: 8,  label: "Detailed picture"   },
  { min: 10, label: "Full analysis"      },
] as const;

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const EXPERIENCE_OPTIONS = [
  { id: "BEGINNER"     as ExperienceLevel, label: "Just Starting",  desc: "Learning the basics"    },
  { id: "INTERMEDIATE" as ExperienceLevel, label: "Getting Serious", desc: "Know the fundamentals"  },
  { id: "ADVANCED"     as ExperienceLevel, label: "Experienced",     desc: "Been at this a while"   },
  { id: "PROFESSIONAL" as ExperienceLevel, label: "Professional",    desc: "Releasing commercially" },
] as const;

const FEEDBACK_AREAS = [
  { id: "OVERALL_VIBE"      as FeedbackArea, label: "Overall Vibe"  },
  { id: "MIXING"            as FeedbackArea, label: "Mix & Sound"    },
  { id: "ARRANGEMENT"       as FeedbackArea, label: "Arrangement"    },
  { id: "SONGWRITING"       as FeedbackArea, label: "Songwriting"    },
  { id: "SOUND_DESIGN"      as FeedbackArea, label: "Sound Design"   },
  { id: "RELEASE_READINESS" as FeedbackArea, label: "Release Ready?" },
] as const;

// ─── component ───────────────────────────────────────────────────────────────

export default function SubmitTrackPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [profile,        setProfile]        = useState<ArtistProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [uploadMode,       setUploadMode]       = useState<UploadMode>("link");
  const [url,              setUrl]              = useState("");
  const [urlError,         setUrlError]         = useState("");
  const [sourceType,       setSourceType]       = useState<SourceType>(null);
  const [isLoadingMeta,    setIsLoadingMeta]    = useState(false);
  const [artworkUrl,       setArtworkUrl]       = useState<string | null>(null);
  const [uploadedUrl,      setUploadedUrl]      = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isUploading,      setIsUploading]      = useState(false);
  const [isDragging,       setIsDragging]       = useState(false);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingArt, setIsUploadingArt] = useState(false);

  const [title,           setTitle]           = useState("");
  const [genres,          setGenres]          = useState<Genre[]>([]);
  const [selectedGenres,  setSelectedGenres]  = useState<string[]>([]);
  const [feedbackFocus,   setFeedbackFocus]   = useState("");
  const [isPublic,        setIsPublic]        = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [selectedAreas,   setSelectedAreas]   = useState<FeedbackArea[]>([]);
  const [experienceDirty, setExperienceDirty] = useState(false);

  const [reviewCount,       setReviewCount]       = useState(5);
  const [reviewCountInited, setReviewCountInited] = useState(false);
  const [slotInfo, setSlotInfo] = useState<{ maxSlots: number; activeCount: number; isPro: boolean; canUpload: boolean; uploadCount: number; maxUploads: number | null } | null>(null);

  // ── A/B test state ─────────────────────────────────────────────────────────
  const [abTestMode,      setAbTestMode]      = useState(false);
  const [urlB,            setUrlB]            = useState("");
  const [urlErrorB,       setUrlErrorB]       = useState("");
  const [sourceTypeB,     setSourceTypeB]     = useState<SourceType>(null);
  const [isLoadingMetaB,  setIsLoadingMetaB]  = useState(false);
  const [artworkUrlB,     setArtworkUrlB]     = useState<string | null>(null);
  const [uploadedUrlB,    setUploadedUrlB]    = useState("");
  const [uploadedFileNameB, setUploadedFileNameB] = useState("");
  const [isUploadingB,    setIsUploadingB]    = useState(false);
  const [isDraggingB,     setIsDraggingB]     = useState(false);
  const [titleB,          setTitleB]          = useState("");
  const fileInputRefB = useRef<HTMLInputElement>(null);

  const [error,        setError]        = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── data loading ───────────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(d => {
        const bal = d.reviewCredits ?? 0;
        const pro = d.subscriptionStatus === "active";
        setProfile({ id: d.id, artistName: d.artistName, totalTracks: d.totalTracks ?? 0, reviewCredits: bal });
        if (d.experienceLevel) setExperienceLevel(d.experienceLevel as ExperienceLevel);
        if (!reviewCountInited) { setReviewCount(pro ? Math.min(10, Math.max(1, bal)) : Math.min(5, Math.max(1, bal))); setReviewCountInited(true); }
      })
      .catch(console.error)
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/genres").then(r => r.json()).then(setGenres).catch(console.error);
  }, []);

  useEffect(() => {
    fetch("/api/slots")
      .then(r => r.json())
      .then(d => setSlotInfo({ maxSlots: d.maxSlots, activeCount: d.activeCount, isPro: d.isPro, canUpload: d.canUpload ?? true, uploadCount: d.uploadCount ?? 0, maxUploads: d.maxUploads ?? null }))
      .catch(console.error);
  }, []);

  // ── handlers ───────────────────────────────────────────────────────────────

  const handleUrlChange = useCallback(async (value: string) => {
    setUrl(value); setUrlError(""); setSourceType(detectSource(value));
    if (!value.trim()) return;
    const v = validateTrackUrl(value);
    if (!v.valid) { setUrlError(v.error || "Invalid URL"); return; }
    setIsLoadingMeta(true);
    try {
      const m = await fetchTrackMetadata(value);
      if (m?.title) setTitle(m.title);
      setArtworkUrl(m?.artworkUrl ?? null);
    } catch { /* best-effort */ } finally { setIsLoadingMeta(false); }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) { setError("File too large. Max 25 MB."); return; }
    if (!file.type.includes("audio") && !file.name.toLowerCase().endsWith(".mp3")) { setError("MP3 files only."); return; }
    setError(""); setIsUploading(true); setUploadedUrl(""); setUploadedFileName("");
    try {
      const pr = await fetch("/api/uploads/track/presign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "audio/mpeg", contentLength: file.size }),
      });
      if (!pr.ok) {
        const e = await pr.json().catch(() => null);
        if (pr.status === 501) {
          const fd = new FormData(); fd.append("file", file);
          const r = await fetch("/api/uploads/track", { method: "POST", body: fd });
          const d = await r.json();
          if (!r.ok || !d.url) { setError(d.error || "Upload failed"); return; }
          setUploadedUrl(d.url); setUploadedFileName(file.name); setSourceType("UPLOAD");
          if (!title.trim()) setTitle(file.name.replace(/\.mp3$/i, "").trim());
          return;
        }
        setError((e as any)?.error || "Upload failed"); return;
      }
      const pd = await pr.json();
      const put = await fetch(pd.uploadUrl, { method: "PUT", headers: { "Content-Type": pd.contentType || "audio/mpeg" }, body: file });
      if (!put.ok) { setError("Upload failed"); return; }
      setUploadedUrl(pd.fileUrl); setUploadedFileName(file.name); setSourceType("UPLOAD");
      if (!title.trim()) setTitle(file.name.replace(/\.mp3$/i, "").trim());
    } catch { setError("Upload failed"); } finally { setIsUploading(false); }
  }, [title]);

  const handleArtworkUpload = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setError("Image too large. Max 5 MB."); return; }
    if (!file.type.startsWith("image/")) { setError("Images only (JPG, PNG, WebP)."); return; }
    setError(""); setIsUploadingArt(true);
    try {
      const pr = await fetch("/api/uploads/artwork/presign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, contentLength: file.size }),
      });
      if (!pr.ok) {
        if (pr.status === 501) { setArtworkUrl(URL.createObjectURL(file)); return; }
        const e = await pr.json().catch(() => null);
        setError((e as any)?.error || "Artwork upload failed"); return;
      }
      const pd = await pr.json();
      const put = await fetch(pd.uploadUrl, { method: "PUT", headers: { "Content-Type": pd.contentType }, body: file });
      if (!put.ok) { setError("Artwork upload failed"); return; }
      setArtworkUrl(pd.fileUrl);
    } catch { setError("Artwork upload failed"); } finally { setIsUploadingArt(false); }
  }, []);

  const handleUrlChangeB = useCallback(async (value: string) => {
    setUrlB(value); setUrlErrorB(""); setSourceTypeB(detectSource(value));
    if (!value.trim()) return;
    const v = validateTrackUrl(value);
    if (!v.valid) { setUrlErrorB(v.error || "Invalid URL"); return; }
    setIsLoadingMetaB(true);
    try {
      const m = await fetchTrackMetadata(value);
      if (m?.title) setTitleB(m.title);
      setArtworkUrlB(m?.artworkUrl ?? null);
    } catch { /* best-effort */ } finally { setIsLoadingMetaB(false); }
  }, []);

  const handleFileUploadB = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) { setError("File too large. Max 25 MB."); return; }
    if (!file.type.includes("audio") && !file.name.toLowerCase().endsWith(".mp3")) { setError("MP3 files only."); return; }
    setError(""); setIsUploadingB(true); setUploadedUrlB(""); setUploadedFileNameB("");
    try {
      const pr = await fetch("/api/uploads/track/presign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "audio/mpeg", contentLength: file.size }),
      });
      if (!pr.ok) {
        if (pr.status === 501) {
          const fd = new FormData(); fd.append("file", file);
          const r = await fetch("/api/uploads/track", { method: "POST", body: fd });
          const d = await r.json();
          if (!r.ok || !d.url) { setError(d.error || "Upload failed"); return; }
          setUploadedUrlB(d.url); setUploadedFileNameB(file.name); setSourceTypeB("UPLOAD");
          if (!titleB.trim()) setTitleB(file.name.replace(/\.mp3$/i, "").trim());
          return;
        }
        const e = await pr.json().catch(() => null);
        setError((e as any)?.error || "Upload failed"); return;
      }
      const pd = await pr.json();
      const put = await fetch(pd.uploadUrl, { method: "PUT", headers: { "Content-Type": pd.contentType || "audio/mpeg" }, body: file });
      if (!put.ok) { setError("Upload failed"); return; }
      setUploadedUrlB(pd.fileUrl); setUploadedFileNameB(file.name); setSourceTypeB("UPLOAD");
      if (!titleB.trim()) setTitleB(file.name.replace(/\.mp3$/i, "").trim());
    } catch { setError("Upload failed"); } finally { setIsUploadingB(false); }
  }, [titleB]);

  const toggleGenre = useCallback((id: string) => {
    setSelectedGenres(p => p.includes(id) ? p.filter(x => x !== id) : p.length >= 3 ? p : [...p, id]);
  }, []);

  const toggleArea = useCallback((id: FeedbackArea) => {
    setSelectedAreas(p => p.includes(id) ? p.filter(x => x !== id) : p.length >= 3 ? p : [...p, id]);
  }, []);

  const buildBody = () => ({
    sourceUrl: uploadMode === "link" ? url : uploadedUrl,
    ...(uploadMode === "file" ? { sourceType: "UPLOAD" } : {}),
    title: title.trim(),
    artworkUrl: artworkUrl || undefined,
    genreIds: selectedGenres,
    feedbackFocus: feedbackFocus.trim() || undefined,
    feedbackAreas: selectedAreas.length > 0 ? selectedAreas : undefined,
    isPublic,
    // A/B test secondary track (same upload mode as primary)
    ...(abTestMode && hasValidSourceB ? {
      abTestSecondary: {
        sourceUrl: uploadMode === "link" ? urlB : uploadedUrlB,
        ...(uploadMode === "file" ? { sourceType: "UPLOAD" } : {}),
        title: titleB.trim() || `${title.trim()} — Version B`,
        artworkUrl: artworkUrlB || artworkUrl || undefined,
      },
    } : {}),
  });

  const saveExperience = async () => {
    if (experienceDirty && experienceLevel && profile) {
      try {
        await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artistName: profile.artistName, experienceLevel }) });
      } catch {}
    }
  };

  const handleSubmit = useCallback(async () => {
    setError(""); setIsSubmitting(true);
    try {
      const cr = await fetch("/api/tracks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildBody()) });
      await saveExperience();
      const cd = await cr.json();
      if (!cr.ok) { setError(cd.error || "Failed to create track"); setIsSubmitting(false); return; }
      // AB: response is { trackA, trackB }; single: response is the track directly
      const primaryId = cd.trackA ? cd.trackA.id : cd.id;
      const rr = await fetch(`/api/tracks/${primaryId}/request-reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ desiredReviews: reviewCount }) });
      if (!rr.ok) { const e = await rr.json().catch(() => null); setError((e as any)?.error || "Failed to request reviews"); setIsSubmitting(false); return; }
      router.push(`/submit/success?trackId=${primaryId}&reviews=${reviewCount}${abTestMode ? "&abTest=1" : ""}`);
    } catch { setError("Something went wrong. Please try again."); setIsSubmitting(false); }
  }, [uploadMode, url, uploadedUrl, urlB, uploadedUrlB, titleB, artworkUrlB, abTestMode, title, artworkUrl, selectedGenres, feedbackFocus, selectedAreas, isPublic, experienceDirty, experienceLevel, profile, reviewCount, router]);

  const handleUploadOnly = useCallback(async () => {
    setError(""); setIsSubmitting(true);
    try {
      const cr = await fetch("/api/tracks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildBody()) });
      await saveExperience();
      const cd = await cr.json();
      if (!cr.ok) { setError(cd.error || "Failed to create track"); setIsSubmitting(false); return; }
      router.push(`/submit/success?trackId=${cd.id}&reviews=0`);
    } catch { setError("Something went wrong."); setIsSubmitting(false); }
  }, [uploadMode, url, uploadedUrl, title, artworkUrl, selectedGenres, feedbackFocus, selectedAreas, isPublic, experienceDirty, experienceLevel, profile, router]);

  // ── derived ────────────────────────────────────────────────────────────────

  const isPro            = slotInfo?.isPro ?? false;
  const creditBalance    = profile?.reviewCredits ?? 0;
  const creditCost       = abTestMode ? reviewCount * 2 : reviewCount;
  const hasEnoughCredits = creditBalance >= creditCost;
  const creditDeficit    = creditCost - creditBalance;
  const slotAvailable    = !slotInfo || slotInfo.activeCount < slotInfo.maxSlots;
  const hasValidSourceA  = uploadMode === "link"
    ? !!url.trim() && !urlError && !isLoadingMeta && !!sourceType
    : !!uploadedUrl && !isUploading;
  const hasValidSourceB  = uploadMode === "link"
    ? !!urlB.trim() && !urlErrorB && !isLoadingMetaB && !!sourceTypeB
    : !!uploadedUrlB && !isUploadingB;
  const hasValidSource   = abTestMode ? hasValidSourceA && hasValidSourceB : hasValidSourceA;
  const hasValidDetails  = (abTestMode || title.trim().length > 0) && selectedGenres.length > 0;

  const goBack    = () => { setError(""); if (step === 2) setStep(1); if (step === 3) setStep(2); };
  const goForward = () => { setError(""); if (step === 1 && hasValidSource) setStep(2); if (step === 2 && hasValidDetails) setStep(3); };

  const currentBenefit = REVIEW_BENEFITS.filter(b => reviewCount >= b.min).slice(-1)[0];

  // ── loading ────────────────────────────────────────────────────────────────

  if (profileLoading) return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
    </div>
  );

  if (slotInfo && !slotInfo.isPro && !slotInfo.canUpload) return (
    <div className="min-h-screen bg-[#faf7f2]">
      {/* Progress bar — locked */}
      <div className="sticky top-0 z-10 bg-white border-b border-black/8">
        <div className="max-w-2xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {["Track", "Details", "Reviews"].map((label, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black bg-black/8 text-black/30">
                  {i + 1}
                </div>
                <span className="text-sm font-semibold hidden sm:inline text-black/30">{label}</span>
                {i < 2 && <span className="text-black/15 text-xs mx-1.5">›</span>}
              </div>
            ))}
          </div>
          <Link href="/tracks" className="text-xs font-bold text-black/35 hover:text-black transition-colors">
            ← My tracks
          </Link>
        </div>
      </div>

      {/* Hero band */}
      <div className="bg-[#1a0f2e] py-16">
        <div className="max-w-2xl mx-auto px-6 sm:px-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 mb-6">
            <Lock className="h-3 w-3 text-white/60" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Free plan</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight mb-4">
            You&apos;ve used your<br />free upload.
          </h1>
          <p className="text-base text-white/40 font-medium leading-relaxed max-w-sm">
            Free accounts include 1 track in your library. Go Pro to keep uploading and build your full catalogue.
          </p>
        </div>
      </div>

      {/* Upsell */}
      <div className="bg-white py-12">
        <div className="max-w-2xl mx-auto px-6 sm:px-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-6">What you get with Pro</p>
          <ul className="space-y-4 mb-10">
            {[
              "Unlimited track uploads",
              "3 tracks in the review queue at once",
              "30 credits every month — no reviewing required",
              "Priority placement in the reviewer queue",
              "Up to 10 reviews per track",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-black/70">{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/pro"
            className="flex items-center justify-center gap-2 bg-purple-600 text-white font-black px-8 py-4 text-sm hover:bg-purple-500 transition-colors w-full"
          >
            <Crown className="h-4 w-4" />
            Go Pro — $24.95/mo
          </Link>
          <p className="text-center text-xs text-black/30 font-medium mt-4">Cancel anytime</p>
        </div>
      </div>
    </div>
  );

  // ── shared styles ──────────────────────────────────────────────────────────

  // Full-bleed within the dashboard content area
  const W  = "max-w-2xl mx-auto px-6 sm:px-10";
  const WW = "max-w-4xl mx-auto px-6 sm:px-10"; // wider container for AB side-by-side

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#faf7f2]">

      {/* ── PROGRESS BAR — sticky top strip ──────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-black/8">
        <div className={cn(W, "py-4 flex items-center justify-between gap-4")}>
          <div className="flex items-center gap-2">
            {["Track", "Details", "Reviews"].map((label, i) => {
              const s = i + 1;
              const done = s < step;
              const active = s === step;
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all",
                    done   ? "bg-purple-600 text-white" :
                    active ? "bg-black text-white" :
                             "bg-black/8 text-black/30"
                  )}>
                    {done ? "✓" : s}
                  </div>
                  <span className={cn(
                    "text-sm font-semibold hidden sm:inline transition-colors",
                    active ? "text-black" : done ? "text-purple-600" : "text-black/30"
                  )}>{label}</span>
                  {i < 2 && <div className="w-6 h-px bg-black/10 mx-1" />}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            {isPro && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-purple-600">
                <Crown className="h-3.5 w-3.5" /> Pro
              </span>
            )}
            <p className="text-sm text-black/40 font-medium tabular-nums">
              <span className={cn("font-black", creditBalance === 0 ? "text-red-500" : "text-black")}>{creditBalance}</span> credits
            </p>
          </div>
        </div>
      </div>

      {/* ── ERROR ────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500">
          <div className={cn(W, "py-3")}>
            <p className="text-sm font-semibold text-white">{error}</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* STEP 1                                                 */}
      {/* ══════════════════════════════════════════════════════ */}
      {step === 1 && (
        <>
          {/* Hero band */}
          <div className="bg-[#1a0f2e] py-10">
            <div className={W}>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-400/60 mb-3">Step 1 of 3</p>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                {abTestMode ? "Compare two versions." : "Drop your track."}
              </h1>
              <p className="text-base text-white/40 mt-3 font-medium">
                {abTestMode
                  ? "Paste two versions — listeners hear both and pick the winner."
                  : "Paste a link from SoundCloud, Bandcamp, or YouTube."}
              </p>

              {/* Mode picker */}
              <div className="mt-7 grid grid-cols-2 divide-x divide-white/10 border border-white/10 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAbTestMode(false)}
                  className={cn(
                    "text-left px-6 py-6 transition-all",
                    !abTestMode ? "bg-white" : "bg-white/5 hover:bg-white/8"
                  )}
                >
                  <p className={cn("font-black text-base mb-1", !abTestMode ? "text-black" : "text-white/50")}>
                    Single Track
                  </p>
                  <p className={cn("text-xs font-medium leading-relaxed", !abTestMode ? "text-black/45" : "text-white/20")}>
                    One version, structured feedback
                  </p>
                  <p className={cn("text-[11px] font-black mt-4 uppercase tracking-wider", !abTestMode ? "text-purple-600" : "text-white/15")}>
                    1 credit / review
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAbTestMode(true)}
                  className={cn(
                    "text-left px-6 py-6 transition-all",
                    abTestMode ? "bg-purple-500" : "bg-white/5 hover:bg-white/8"
                  )}
                >
                  <p className={cn("font-black text-base mb-1", abTestMode ? "text-white" : "text-white/50")}>
                    Compare
                  </p>
                  <p className={cn("text-xs font-medium leading-relaxed", abTestMode ? "text-white/70" : "text-white/20")}>
                    Two versions — listeners pick the winner
                  </p>
                  <p className={cn("text-[11px] font-black mt-4 uppercase tracking-wider", abTestMode ? "text-yellow-300" : "text-white/15")}>
                    2 credits / reviewer
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Mode toggle band removed — mp3 upload temporarily disabled
              (AWS upload key rotation); uploadMode stays "link" (paste-only). */}

          {/* Form band */}
          <div className="bg-white py-10">
            <div className={cn(abTestMode ? WW : W)}>

              {/* Hidden file inputs */}
              <input ref={fileInputRef} type="file" accept="audio/mpeg,audio/mp3,.mp3"
                onChange={e => { const f = e.target.files?.[0]; if (f) void handleFileUpload(f); }} className="hidden" />
              <input ref={fileInputRefB} type="file" accept="audio/mpeg,audio/mp3,.mp3"
                onChange={e => { const f = e.target.files?.[0]; if (f) void handleFileUploadB(f); }} className="hidden" />

              {/* Single track upload */}
              {!abTestMode && (
                <div className="space-y-5">
                  {uploadMode === "link" && (
                    <>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.2em] text-black/40 mb-2">Track URL</label>
                        <input
                          value={url}
                          onChange={e => handleUrlChange(e.target.value)}
                          placeholder="soundcloud.com / bandcamp.com / youtube.com"
                          className={cn(
                            "w-full bg-transparent border-b-2 text-black text-[15px] py-3 focus:outline-none transition-colors placeholder:text-black/20",
                            urlError ? "border-red-400" : "border-black/10 focus:border-purple-500"
                          )}
                          autoFocus
                        />
                        {urlError && <p className="text-sm text-red-500 font-medium mt-2">{urlError}</p>}
                      </div>
                      <SupportedPlatforms activeSource={sourceType} variant="compact" />
                      {isLoadingMeta && <p className="text-sm text-black/40 flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />Fetching info...</p>}
                      {url && !urlError && !isLoadingMeta && title && (
                        <div className="bg-[#faf7f2] rounded-2xl p-4 flex items-center gap-3">
                          {artworkUrl ? <img src={artworkUrl} alt="" className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                            : <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0"><Music className="h-4 w-4 text-purple-400" /></div>}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-black text-sm truncate">{title}</p>
                            <p className="text-xs font-black uppercase tracking-wider text-purple-600 mt-0.5">{sourceType} — ready</p>
                          </div>
                          <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"><Check className="h-3.5 w-3.5 text-white" /></div>
                        </div>
                      )}
                    </>
                  )}
                  {uploadMode === "file" && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f && (f.type === "audio/mpeg" || f.name.endsWith(".mp3"))) void handleFileUpload(f); else setError("MP3 files only."); }}
                      className={cn(
                        "rounded-2xl border-2 border-dashed p-14 text-center cursor-pointer transition-all",
                        isDragging ? "border-purple-400 bg-purple-50" :
                        uploadedFileName && !isUploading ? "border-green-400 bg-green-50" :
                        "border-black/10 hover:border-purple-300 hover:bg-purple-50/30"
                      )}
                    >
                      {isUploading ? <div className="flex flex-col items-center gap-3"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /><p className="text-sm font-semibold text-black/50">Uploading...</p></div>
                        : uploadedFileName ? <div className="flex flex-col items-center gap-3"><div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center"><Check className="h-5 w-5 text-white" /></div><p className="font-bold text-black">{uploadedFileName}</p><p className="text-sm text-black/40">Click to change</p></div>
                        : <div className="flex flex-col items-center gap-3"><div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center"><Upload className="h-5 w-5 text-purple-500" /></div><div><p className="font-bold text-black">Drop your MP3 here</p><p className="text-sm text-black/40 mt-1">or click to browse · max 25 MB</p></div></div>}
                    </div>
                  )}
                </div>
              )}

              {/* Compare mode — side by side, wider container */}
              {abTestMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {(["a", "b"] as const).map((ver) => {
                    const isA = ver === "a";
                    const vUrl = isA ? url : urlB;
                    const vUrlError = isA ? urlError : urlErrorB;
                    const vIsLoadingMeta = isA ? isLoadingMeta : isLoadingMetaB;
                    const vTitle = isA ? title : titleB;
                    const vArtwork = isA ? artworkUrl : artworkUrlB;
                    const vSourceType = isA ? sourceType : sourceTypeB;
                    const vFileName = isA ? uploadedFileName : uploadedFileNameB;
                    const vIsUploading = isA ? isUploading : isUploadingB;
                    const vIsDragging = isA ? isDragging : isDraggingB;
                    const vFileInputRef = isA ? fileInputRef : fileInputRefB;
                    const handleUrl = isA ? handleUrlChange : handleUrlChangeB;
                    const handleFile = isA ? handleFileUpload : handleFileUploadB;
                    const setDragging = isA ? setIsDragging : setIsDraggingB;

                    return (
                      <div key={ver} className="space-y-4">
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-[0.25em]",
                          isA ? "text-black/30" : "text-purple-500"
                        )}>
                          Version {ver.toUpperCase()}
                        </p>

                        {uploadMode === "link" && (
                          <div className="space-y-4">
                            <input
                              type="text"
                              value={vUrl}
                              onChange={e => handleUrl(e.target.value)}
                              placeholder="soundcloud.com / bandcamp.com / youtube.com"
                              autoFocus={isA}
                              className={cn(
                                "w-full bg-transparent border-b-2 text-black text-[15px] py-3 focus:outline-none transition-colors placeholder:text-black/20",
                                vUrlError ? "border-red-400" :
                                isA ? "border-black/10 focus:border-purple-500" : "border-purple-200 focus:border-purple-500"
                              )}
                            />
                            {vUrlError && <p className="text-sm text-red-500 font-medium">{vUrlError}</p>}
                            {vIsLoadingMeta && <p className="text-sm text-black/40 flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />Fetching info...</p>}
                            {vUrl && !vUrlError && !vIsLoadingMeta && vTitle && (
                              <div className={cn("rounded-xl p-4 flex items-center gap-3", isA ? "bg-[#faf7f2]" : "bg-purple-50 border border-purple-100")}>
                                {vArtwork
                                  ? <img src={vArtwork} alt="" className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                                  : <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0", isA ? "bg-purple-100" : "bg-purple-200")}><Music className="h-4 w-4 text-purple-500" /></div>}
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-black text-sm truncate">{vTitle}</p>
                                  <p className="text-xs font-black uppercase tracking-wider text-purple-600 mt-0.5">{vSourceType} — ready</p>
                                </div>
                                <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"><Check className="h-3.5 w-3.5 text-white" /></div>
                              </div>
                            )}
                          </div>
                        )}

                        {uploadMode === "file" && (
                          <div
                            onClick={() => vFileInputRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={e => {
                              e.preventDefault(); setDragging(false);
                              const f = e.dataTransfer.files?.[0];
                              if (f && (f.type === "audio/mpeg" || f.name.endsWith(".mp3"))) void handleFile(f);
                              else setError("MP3 files only.");
                            }}
                            className={cn(
                              "rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all",
                              vIsDragging ? "border-purple-400 bg-purple-100" :
                              vFileName && !vIsUploading ? "border-green-400 bg-green-50" :
                              isA ? "border-black/10 hover:border-purple-300 hover:bg-purple-50/30"
                                  : "border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                            )}
                          >
                            {vIsUploading
                              ? <div className="flex flex-col items-center gap-3"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /><p className="text-sm font-semibold text-black/50">Uploading...</p></div>
                              : vFileName
                                ? <div className="flex flex-col items-center gap-3"><div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center"><Check className="h-5 w-5 text-white" /></div><p className="font-bold text-black">{vFileName}</p><p className="text-sm text-black/40">Click to change</p></div>
                                : <div className="flex flex-col items-center gap-3"><div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center"><Upload className="h-5 w-5 text-purple-500" /></div><div><p className="font-bold text-black">Drop Version {ver.toUpperCase()} here</p><p className="text-sm text-black/40 mt-1">or click to browse · max 25 MB</p></div></div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

          {/* CTA band */}
          <div className="bg-purple-600 hover:bg-purple-700 transition-colors">
            <div className={W}>
              <button
                onClick={goForward}
                disabled={!hasValidSource}
                className="w-full py-5 text-white font-black text-[15px] tracking-wide disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {hasValidSource ? "Continue to Details →" : abTestMode ? "Add both tracks to continue" : "Add a track link or file to continue"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* STEP 2                                                 */}
      {/* ══════════════════════════════════════════════════════ */}
      {step === 2 && (
        <>
          {/* Hero band */}
          <div className="bg-[#0f2318] py-12">
            <div className={W}>
              <button onClick={goBack} className="text-xs font-black uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors mb-6 block">
                ← Back
              </button>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-green-400/60 mb-3">Step 2 of 3</p>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                {abTestMode ? "About your tracks." : "About your track."}
              </h1>
              <p className="text-base text-white/40 mt-3 font-medium">
                {abTestMode
                  ? "Genre, feedback focus, and visibility apply to both versions."
                  : "Give reviewers context so feedback is actually useful."}
              </p>
            </div>
          </div>

          {/* Form band */}
          <div className="bg-white py-10">
            <div className={cn(W, "space-y-10")}>

              {/* Track confirmation strip */}
              {abTestMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Version A", t: title, artwork: artworkUrl, src: sourceType },
                    { label: "Version B", t: titleB || (title ? `${title} — Version B` : ""), artwork: artworkUrlB, src: sourceTypeB },
                  ].map(({ label, t, artwork, src }) => (
                    <div key={label} className="flex items-center gap-3 bg-[#faf7f2] rounded-xl px-4 py-3">
                      <div className="h-10 w-10 rounded-lg flex-shrink-0 overflow-hidden bg-purple-100 flex items-center justify-center">
                        {artwork
                          ? <img src={artwork} alt="" className="h-full w-full object-cover" />
                          : <Music className="h-4 w-4 text-purple-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500 mb-0.5">{label}</p>
                        <p className="text-sm font-bold text-black truncate">{t || "Untitled"}</p>
                        {src && <p className="text-[11px] text-black/30 font-medium capitalize">{src.toLowerCase()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (artworkUrl || title) ? (
                <div className="flex items-center gap-4 bg-[#faf7f2] rounded-xl px-4 py-3">
                  <div className="h-12 w-12 rounded-xl flex-shrink-0 overflow-hidden bg-purple-100 flex items-center justify-center">
                    {artworkUrl
                      ? <img src={artworkUrl} alt="" className="h-full w-full object-cover" />
                      : <Music className="h-5 w-5 text-purple-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-black truncate">{title || "Untitled"}</p>
                    {sourceType && <p className="text-xs text-black/35 font-medium capitalize mt-0.5">{sourceType.toLowerCase()}</p>}
                  </div>
                </div>
              ) : null}

              {/* Title — single track only; AB titles are set from URL metadata in step 1 */}
              {!abTestMode && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-black/40 mb-2">Track Title</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <input ref={artworkInputRef} type="file" accept="image/*"
                        onChange={e => { const f = e.target.files?.[0]; if (f) void handleArtworkUpload(f); }}
                        className="hidden"
                      />
                      <button type="button" onClick={() => artworkInputRef.current?.click()} disabled={isUploadingArt}
                        className="relative h-12 w-12 rounded-xl border-2 border-dashed border-black/10 hover:border-purple-400 bg-[#faf7f2] overflow-hidden transition-colors flex items-center justify-center group"
                      >
                        {isUploadingArt ? <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                          : artworkUrl ? <>
                              <img src={artworkUrl} alt="" className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <ImagePlus className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </>
                          : <ImagePlus className="h-4 w-4 text-black/20 group-hover:text-purple-500 transition-colors" />
                        }
                      </button>
                    </div>
                    <input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="What's this track called?"
                      className="flex-1 bg-transparent border-b-2 border-black/10 focus:border-purple-500 text-black text-[15px] py-3 focus:outline-none transition-colors placeholder:text-black/20"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Genre */}
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-black/40 mb-1">Genre</label>
                <p className="text-sm text-black/40 mb-4">Pick 1–3 that fit your track</p>
                {genres.length === 0
                  ? <div className="flex items-center gap-2 text-sm text-black/40"><Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />Loading...</div>
                  : <GenreSelector genres={genres} selectedIds={selectedGenres} onToggle={toggleGenre} maxSelections={3} variant="artist" />
                }
              </div>

              {/* Experience */}
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-black/40 mb-1">Your Experience Level</label>
                <p className="text-sm text-black/40 mb-4">Helps reviewers calibrate their feedback</p>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERIENCE_OPTIONS.map(opt => (
                    <button key={opt.id} type="button"
                      onClick={() => { setExperienceLevel(opt.id); setExperienceDirty(true); }}
                      className={cn(
                        "text-left p-4 border transition-all",
                        experienceLevel === opt.id
                          ? "border-[#1a1a1a] bg-[#1a1a1a]"
                          : "border-black/10 bg-[#faf7f2] hover:border-black/30"
                      )}
                    >
                      <div className={cn("text-sm font-bold", experienceLevel === opt.id ? "text-white" : "text-black")}>{opt.label}</div>
                      <div className={cn("text-[12px] mt-0.5", experienceLevel === opt.id ? "text-white/50" : "text-black/40")}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus areas */}
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-black/40 mb-1">Focus Areas</label>
                <p className="text-sm text-black/40 mb-4">Optional · up to 3 · reviewers will focus here</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FEEDBACK_AREAS.map(area => {
                    const on = selectedAreas.includes(area.id);
                    const maxed = !on && selectedAreas.length >= 3;
                    return (
                      <button key={area.id} type="button" onClick={() => !maxed && toggleArea(area.id)}
                        className={cn(
                          "px-4 py-3 border text-sm font-semibold transition-all text-left",
                          on    ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" :
                          maxed ? "border-black/5 text-black/15 cursor-not-allowed bg-white" :
                                  "border-black/10 bg-[#faf7f2] hover:border-black/30 text-black"
                        )}
                      >{area.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-black/40 mb-2">
                  Anything Specific? <span className="normal-case font-medium text-black/25">optional</span>
                </label>
                <textarea
                  value={feedbackFocus}
                  onChange={e => setFeedbackFocus(e.target.value)}
                  placeholder="e.g. Does the bridge hit? Is the bass sitting right? Changed the intro — does it work?"
                  rows={3}
                  maxLength={1000}
                  className="w-full bg-[#faf7f2] border border-black/10 focus:border-black/40 text-black text-[14px] px-4 py-3 focus:outline-none resize-none transition-colors placeholder:text-black/20"
                />
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-black/40 mb-4">Visibility</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { val: false, Icon: Lock,  label: "Private", desc: "You and your reviewers only"     },
                    { val: true,  Icon: Globe, label: "Public",  desc: "Discoverable and chart eligible" },
                  ] as const).map(({ val, Icon, label, desc }) => (
                    <button key={label} type="button" onClick={() => setIsPublic(val)}
                      className={cn(
                        "text-left p-4 border transition-all flex gap-3 items-start",
                        isPublic === val ? "border-[#1a1a1a] bg-[#1a1a1a]" : "border-black/10 bg-[#faf7f2] hover:border-black/30"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", isPublic === val ? "text-white/60" : "text-black/30")} />
                      <div>
                        <div className={cn("text-sm font-bold", isPublic === val ? "text-white" : "text-black")}>{label}</div>
                        <div className={cn("text-[12px] mt-0.5 leading-snug", isPublic === val ? "text-white/40" : "text-black/40")}>{desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* CTA band */}
          <div className="bg-green-600 hover:bg-green-700 transition-colors">
            <div className={W}>
              <button
                onClick={goForward}
                disabled={!hasValidDetails}
                className="w-full py-5 text-white font-black text-[15px] tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {hasValidDetails ? "Continue to Reviews →" : "Add a title and genre to continue"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* STEP 3                                                 */}
      {/* ══════════════════════════════════════════════════════ */}
      {step === 3 && (
        <>
          {/* Hero band */}
          <div className="bg-[#1a0a2e] py-12">
            <div className={W}>
              <button onClick={goBack} className="text-xs font-black uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors mb-6 block">
                ← Back
              </button>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-400/60 mb-3">Step 3 of 3</p>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                How many reviews?
              </h1>
              <p className="text-base text-white/40 mt-3 font-medium">
                {abTestMode ? "Each reviewer hears both versions — 2 credits per reviewer." : "Each review costs 1 credit. More reviews = stronger signal."}
              </p>
            </div>
          </div>

          {/* Slot warning */}
          {!slotAvailable && (
            <div className="bg-amber-400">
              <div className={cn(W, "py-4 flex items-center gap-3")}>
                <AlertTriangle className="h-4 w-4 text-black flex-shrink-0" />
                <p className="text-sm font-bold text-black">
                  Your queue is full · Free accounts get {slotInfo?.maxSlots ?? 1} active slot ·{" "}
                  <Link href="/pro" className="underline underline-offset-2">Go Pro</Link> for 3 slots
                </p>
              </div>
            </div>
          )}

          {/* Counter band */}
          <div className="bg-white py-12">
            <div className={W}>
              {/* Big counter */}
              <div className="flex items-center justify-center gap-8 mb-10">
                <button type="button" onClick={() => setReviewCount(c => Math.max(1, c - 1))}
                  className="h-14 w-14 rounded-full bg-black/5 hover:bg-black/10 text-black text-2xl font-light transition-colors flex items-center justify-center select-none"
                >−</button>
                <div className="text-center">
                  <span className="text-[88px] font-black text-black leading-none tabular-nums">{reviewCount}</span>
                  <p className="text-sm text-black/40 font-semibold mt-1">{reviewCount === 1 ? "review" : "reviews"}</p>
                </div>
                <button type="button" onClick={() => setReviewCount(c => Math.min(10, c + 1))}
                  className="h-14 w-14 rounded-full bg-black/5 hover:bg-black/10 text-black text-2xl font-light transition-colors flex items-center justify-center select-none"
                >+</button>
              </div>

              {/* Quick picks */}
              <div className="flex justify-center gap-2 mb-10">
                {[1, 3, 5, 8, 10].map(n => (
                  <button key={n} type="button" onClick={() => setReviewCount(n)}
                    className={cn(
                      "h-9 w-9 rounded-full text-sm font-black transition-all",
                      reviewCount === n ? "bg-purple-600 text-white" : "bg-black/5 text-black/40 hover:bg-black/10 hover:text-black"
                    )}
                  >{n}</button>
                ))}
              </div>

              {/* Insight bar */}
              <div className="bg-[#faf7f2] rounded-2xl p-5 mb-6">
                <div className="flex gap-1 mb-3">
                  {REVIEW_BENEFITS.map(b => (
                    <div key={b.label} className={cn("h-1.5 flex-1 rounded-full transition-all duration-300", reviewCount >= b.min ? "bg-purple-600" : "bg-black/8")} />
                  ))}
                </div>
                <p className="text-sm font-bold text-black">{currentBenefit?.label ?? "Select reviews"}</p>
                <p className="text-xs text-black/40 mt-0.5">Current insight level</p>
              </div>

              {/* Estimated wait */}
              <div className="bg-[#faf7f2] rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-3.5 w-3.5 text-black/40" />
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-black/40">Estimated wait</p>
                </div>
                {isPro ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full">
                      <Zap className="h-3 w-3" /> Priority
                    </span>
                    <p className="text-sm font-bold text-black">Under 20 minutes</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-black/50">Free</span>
                      <span className="text-sm font-bold text-black tabular-nums">4–8 hours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-600">
                        <Crown className="h-3.5 w-3.5" /> Pro
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-sm font-black text-purple-600 tabular-nums">&lt; 20 min</span>
                        <span className="bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">Priority</span>
                      </span>
                    </div>
                    <Link href="/pro" className="block pt-0.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors">
                      Go Pro to skip the line →
                    </Link>
                  </div>
                )}
              </div>

              {/* Credit balance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#faf7f2] rounded-2xl p-5">
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-black/40 mb-1">You have</p>
                  <p className={cn("text-4xl font-black tabular-nums", creditBalance === 0 ? "text-red-500" : "text-black")}>{creditBalance}</p>
                  <p className="text-xs text-black/40 mt-0.5">credits</p>
                </div>
                <div className="bg-[#faf7f2] rounded-2xl p-5 text-right">
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-black/40 mb-1">This costs</p>
                  <p className={cn("text-4xl font-black tabular-nums", !hasEnoughCredits ? "text-red-500" : "text-purple-600")}>{creditCost}</p>
                  <p className="text-xs text-black/40 mt-0.5">{abTestMode ? `credits (${reviewCount} × 2)` : "credits"}</p>
                </div>
              </div>
              {isPro && (
                <p className="text-xs text-black/40 mt-3 flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-purple-600" /> Pro includes 30 credits every month
                </p>
              )}
            </div>
          </div>

          {/* Not enough credits band */}
          {!hasEnoughCredits && (
            <div className="bg-[#faf7f2] border-t border-black/8 py-8">
              <div className={cn(W, "space-y-3")}>
                <p className="font-black text-black text-base">
                  You need {creditDeficit} more {creditDeficit === 1 ? "credit" : "credits"}.
                </p>
                <p className="text-sm text-black/50">Earn by reviewing, buy a pack, or go Pro for monthly credits.</p>
                <BuyCreditsButton variant="card" className="bg-black text-white hover:bg-neutral-800" label="Buy 10 credits — $9.95" />
                <Link href="/review"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-black/10 text-black hover:border-purple-400 hover:text-purple-600 text-sm font-bold transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  Review a track to earn a credit
                </Link>
                {!isPro && (
                  <Link href="/pro"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors"
                  >
                    <Crown className="h-4 w-4" />
                    Go Pro — 30 credits / month
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Submit band */}
          <div className={cn(
            "transition-colors",
            hasEnoughCredits && slotAvailable ? "bg-purple-600 hover:bg-purple-700" : "bg-black/10"
          )}>
            <div className={W}>
              <button
                onClick={handleSubmit}
                disabled={!hasEnoughCredits || !slotAvailable || isSubmitting}
                className="w-full py-6 text-white font-black text-[16px] tracking-wide disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Submitting..." : "Submit for Review →"}
              </button>
            </div>
          </div>

          <div className="bg-white py-4 text-center">
            <button onClick={handleUploadOnly} disabled={isSubmitting}
              className="text-sm text-black/30 hover:text-black/60 font-medium transition-colors disabled:opacity-40"
            >
              Upload without reviews
            </button>
          </div>
        </>
      )}
    </div>
  );
}
