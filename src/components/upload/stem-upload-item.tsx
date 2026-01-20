"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { StemTypeSelector } from "./stem-type-selector";
import { Upload, X, Check, AlertCircle } from "lucide-react";
import type { StemUpload, StemType } from "./stem-uploader";

interface StemUploadItemProps {
  stem: StemUpload;
  trackId?: string;
  canRemove: boolean;
  onRemove: () => void;
  onUpdate: (updates: Partial<StemUpload>) => void;
  onUploaded: (file: File, url: string, duration: number) => void;
}

export function StemUploadItem({
  stem,
  trackId,
  canRemove,
  onRemove,
  onUpdate,
  onUploaded,
}: StemUploadItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isValidAudio = file.type === "audio/mpeg" || file.type === "audio/wav" || file.name.endsWith(".mp3") || file.name.endsWith(".wav");

    if (!isValidAudio) {
      onUpdate({ error: "Only MP3 and WAV files are supported" });
      return;
    }

    // Validate file size (25MB)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      onUpdate({ error: "File too large (max 25MB)" });
      return;
    }

    onUpdate({ file, error: null });

    // Get duration
    const duration = await getAudioDuration(file);
    onUpdate({ duration });

    // Auto-upload
    await uploadStem(file, duration);
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = "metadata";

      audio.addEventListener("loadedmetadata", () => {
        resolve(Math.round(audio.duration));
        URL.revokeObjectURL(audio.src);
      });

      audio.addEventListener("error", () => {
        resolve(0);
        URL.revokeObjectURL(audio.src);
      });

      audio.src = URL.createObjectURL(file);
    });
  };

  const uploadStem = async (file: File, duration: number) => {
    if (!trackId) {
      // If no trackId, we're in the submit wizard - just store file locally
      const localUrl = URL.createObjectURL(file);
      onUploaded(file, localUrl, duration);
      return;
    }

    setIsUploading(true);
    onUpdate({ uploadProgress: 0, error: null });

    try {
      // Get presigned URL
      const presignRes = await fetch("/api/uploads/stem/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          contentLength: file.size,
          trackId,
          stemType: stem.type,
          label: stem.label || `${stem.type} Stem`,
        }),
      });

      if (!presignRes.ok) {
        const error = await presignRes.json();
        throw new Error(error.error || "Failed to prepare upload");
      }

      const { uploadUrl, fileUrl } = await presignRes.json();

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      onUpdate({ uploadProgress: 100 });
      onUploaded(file, fileUrl, duration);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      onUpdate({ error: message, uploadProgress: 0 });
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const isUploaded = stem.url !== null;

  return (
    <div className={`group relative rounded overflow-hidden transition-all duration-200 ${
      stem.error
        ? "bg-rose-500/5 ring-1 ring-rose-500/20"
        : isUploaded
        ? "bg-emerald-500/5 ring-1 ring-emerald-500/30"
        : "bg-neutral-50 hover:bg-neutral-100/80 ring-1 ring-neutral-200/60"
    }`}>
      <div className="px-2.5 py-1.5 sm:px-3 sm:py-2">
        {/* Main Row - Responsive Layout */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
          {/* Stem Type Selector - Full width on mobile, fixed on desktop */}
          <div className="w-full sm:w-32 flex-shrink-0">
            <StemTypeSelector
              value={stem.type}
              onChange={(type) => onUpdate({ type })}
              disabled={stem.id === "master" || isUploaded}
            />
          </div>

          {/* Label Input - Flexible width */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={stem.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder={stem.id === "master" ? "Full Mix" : `e.g. "Kick & Snare", "Lead Vocal", "Main Synth"...`}
              disabled={stem.id === "master" || isUploaded}
              className="w-full px-2.5 py-1.5 text-xs font-medium bg-white rounded ring-1 ring-neutral-200 transition-all
                         placeholder:text-neutral-400 disabled:bg-neutral-100/50 disabled:text-neutral-500 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* Upload Button / Status - Stacks on mobile */}
          <div className="flex items-center gap-1.5 justify-between sm:justify-end">
            {!isUploaded && !isUploading && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,audio/wav,.mp3,.wav"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none h-7 px-2.5 border-neutral-300 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-all text-xs"
                >
                  <Upload className="w-3 h-3 mr-1.5" />
                  <span className="font-medium">Choose</span>
                </Button>
              </>
            )}

            {isUploading && (
              <div className="flex items-center gap-2 flex-1 sm:flex-none sm:min-w-[120px]">
                <div className="flex-1 h-1 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 transition-all duration-300 ease-out"
                    style={{ width: `${stem.uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-neutral-500 tabular-nums">{stem.uploadProgress}%</span>
              </div>
            )}

            {isUploaded && (
              <div className="flex items-center gap-1.5 text-emerald-600">
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="text-[10px] font-medium tracking-tight uppercase">Done</span>
              </div>
            )}

            {canRemove && (
              <Button
                onClick={onRemove}
                variant="ghost"
                size="sm"
                className="text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors p-1 h-auto"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </Button>
            )}
          </div>
        </div>

        {/* File Info - Compact and monospaced */}
        {stem.file && (
          <div className="mt-2 pt-2 border-t border-neutral-200/60 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-neutral-500">
            <span className="truncate max-w-[180px] sm:max-w-xs" title={stem.file.name}>{stem.file.name}</span>
            <span className="tabular-nums">{formatFileSize(stem.file.size)}</span>
            <span className="tabular-nums">{formatDuration(stem.duration)}</span>
          </div>
        )}

        {/* Error Message - More subtle */}
        {stem.error && (
          <div className="mt-2 flex items-start gap-1.5 text-rose-600">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <span className="text-[10px] font-medium">{stem.error}</span>
          </div>
        )}
      </div>

      {/* Progress Bar - Full width accent */}
      {isUploading && stem.uploadProgress > 0 && stem.uploadProgress < 100 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-200">
          <div
            className="h-full bg-neutral-900 transition-all duration-300 ease-out"
            style={{ width: `${stem.uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
