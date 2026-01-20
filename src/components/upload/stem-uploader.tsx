"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StemUploadItem } from "./stem-upload-item";
import { Plus } from "lucide-react";

export type StemType = "MASTER" | "DRUMS" | "BASS" | "SYNTHS" | "VOCALS" | "MELODY" | "FX" | "OTHER";

export interface StemUpload {
  id: string;
  type: StemType;
  label: string;
  file: File | null;
  url: string | null;
  uploadProgress: number;
  duration: number | null;
  error: string | null;
  order: number;
}

interface StemUploaderProps {
  trackId?: string; // Track ID if stems are being added to existing track
  onComplete?: (stems: Array<{ stemUrl: string; stemType: StemType; label: string; order: number; duration: number }>) => void;
  onStemsChange?: (stems: StemUpload[]) => void;
}

export function StemUploader({ trackId, onComplete, onStemsChange }: StemUploaderProps) {
  const [stems, setStems] = useState<StemUpload[]>([
    {
      id: "master",
      type: "MASTER",
      label: "Full Mix (Master)",
      file: null,
      url: null,
      uploadProgress: 0,
      duration: null,
      error: null,
      order: 0,
    },
  ]);

  const addStem = () => {
    if (stems.length >= 10) {
      return;
    }

    const newStem: StemUpload = {
      id: `stem-${Date.now()}`,
      type: "DRUMS",
      label: "",
      file: null,
      url: null,
      uploadProgress: 0,
      duration: null,
      error: null,
      order: stems.length,
    };

    const updated = [...stems, newStem];
    setStems(updated);
    onStemsChange?.(updated);
  };

  const removeStem = (id: string) => {
    // Don't allow removing master
    if (id === "master") return;

    const updated = stems.filter((s) => s.id !== id).map((s, idx) => ({ ...s, order: idx }));
    setStems(updated);
    onStemsChange?.(updated);
  };

  const updateStem = (id: string, updates: Partial<StemUpload>) => {
    const updated = stems.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setStems(updated);
    onStemsChange?.(updated);
  };

  const handleStemUploaded = async (id: string, file: File, url: string, duration: number) => {
    updateStem(id, {
      file,
      url,
      duration,
      uploadProgress: 100,
      error: null,
    });

    // Check if all stems are uploaded
    const allUploaded = stems.every((s) => s.id === id || s.url !== null);

    if (allUploaded && onComplete) {
      const completedStems = stems.map((s) => ({
        stemUrl: s.id === id ? url : s.url!,
        stemType: s.type,
        label: s.label,
        order: s.order,
        duration: s.id === id ? duration : s.duration!,
      }));

      onComplete(completedStems);
    }
  };

  const validateDurations = () => {
    const durations = stems.filter((s) => s.duration !== null).map((s) => s.duration!);
    if (durations.length <= 1) return null;

    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const diff = max - min;

    if (diff > 2) {
      return `Stem durations must match within 2 seconds (found ${diff}s difference)`;
    }

    return null;
  };

  const allStemsUploaded = stems.every((s) => s.url !== null);
  const durationError = validateDurations();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold mb-2">Upload Stems</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Upload your master track and individual stems for detailed feedback. Reviewers can mute/solo each stem.
        </p>
      </div>

      <div className="space-y-3">
        {stems.map((stem) => (
          <StemUploadItem
            key={stem.id}
            stem={stem}
            trackId={trackId}
            canRemove={stem.id !== "master"}
            onRemove={() => removeStem(stem.id)}
            onUpdate={(updates) => updateStem(stem.id, updates)}
            onUploaded={(file, url, duration) => handleStemUploaded(stem.id, file, url, duration)}
          />
        ))}
      </div>

      {stems.length < 10 && (
        <Button onClick={addStem} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Stem {stems.length > 1 && `(${stems.length}/10)`}
        </Button>
      )}

      {durationError && (
        <div className="p-3 bg-rose-50 border-2 border-rose-500 rounded-lg">
          <p className="text-sm text-rose-700 font-medium">{durationError}</p>
          <p className="text-xs text-rose-600 mt-1">
            Ensure all stems are exported from the same project with matching lengths.
          </p>
        </div>
      )}

      {allStemsUploaded && !durationError && (
        <div className="p-3 bg-lime-50 border-2 border-lime-500 rounded-lg">
          <p className="text-sm text-lime-700 font-medium">
            ✓ All stems uploaded successfully! ({stems.length} {stems.length === 1 ? "stem" : "stems"})
          </p>
        </div>
      )}
    </div>
  );
}
