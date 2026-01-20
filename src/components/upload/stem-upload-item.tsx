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
    <div className={`p-4 border-2 rounded-lg ${
      stem.error
        ? "border-rose-500 bg-rose-50"
        : isUploaded
        ? "border-lime-500 bg-lime-50"
        : "border-neutral-300 bg-white"
    }`}>
      <div className="flex items-start gap-3">
        {/* Stem Type Selector */}
        <div className="flex-shrink-0" style={{ width: "140px" }}>
          <StemTypeSelector
            value={stem.type}
            onChange={(type) => onUpdate({ type })}
            disabled={stem.id === "master" || isUploaded}
          />
        </div>

        {/* Label Input */}
        <div className="flex-1">
          <input
            type="text"
            value={stem.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder={stem.id === "master" ? "Full Mix (Master)" : `${stem.type} label...`}
            disabled={stem.id === "master" || isUploaded}
            className="w-full px-3 py-2 border-2 border-black rounded-lg font-mono text-sm disabled:bg-neutral-100 disabled:text-neutral-600"
          />
        </div>

        {/* Upload Button / Status */}
        <div className="flex-shrink-0 flex items-center gap-2">
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
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </>
          )}

          {isUploading && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${stem.uploadProgress}%` }}
                />
              </div>
              <span className="text-xs text-neutral-600">{stem.uploadProgress}%</span>
            </div>
          )}

          {isUploaded && (
            <div className="flex items-center gap-2 text-lime-700">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Uploaded</span>
            </div>
          )}

          {canRemove && (
            <Button
              onClick={onRemove}
              variant="ghost"
              size="sm"
              className="text-neutral-600 hover:text-rose-600"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* File Info */}
      {stem.file && (
        <div className="mt-2 flex items-center gap-4 text-xs text-neutral-600">
          <span>{stem.file.name}</span>
          <span>{formatFileSize(stem.file.size)}</span>
          <span>{formatDuration(stem.duration)}</span>
        </div>
      )}

      {/* Error Message */}
      {stem.error && (
        <div className="mt-2 flex items-center gap-2 text-rose-700">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{stem.error}</span>
        </div>
      )}

      {/* Progress Bar (for large uploads) */}
      {isUploading && stem.uploadProgress > 0 && stem.uploadProgress < 100 && (
        <div className="mt-3">
          <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${stem.uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
