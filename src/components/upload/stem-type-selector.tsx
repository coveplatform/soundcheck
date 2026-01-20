"use client";

import type { StemType } from "./stem-uploader";

interface StemTypeSelectorProps {
  value: StemType;
  onChange: (type: StemType) => void;
  disabled?: boolean;
}

const STEM_TYPES: Array<{ value: StemType; label: string; emoji: string }> = [
  { value: "MASTER", label: "Master", emoji: "🎵" },
  { value: "DRUMS", label: "Drums", emoji: "🥁" },
  { value: "BASS", label: "Bass", emoji: "🎸" },
  { value: "SYNTHS", label: "Synths", emoji: "🎹" },
  { value: "VOCALS", label: "Vocals", emoji: "🎤" },
  { value: "MELODY", label: "Melody", emoji: "🎼" },
  { value: "FX", label: "FX", emoji: "✨" },
  { value: "OTHER", label: "Other", emoji: "🎧" },
];

export function StemTypeSelector({ value, onChange, disabled = false }: StemTypeSelectorProps) {
  const selectedType = STEM_TYPES.find((t) => t.value === value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as StemType)}
      disabled={disabled}
      className="w-full px-3 py-2 border-2 border-black rounded-lg font-bold text-sm bg-white disabled:bg-neutral-100 disabled:text-neutral-600 disabled:cursor-not-allowed appearance-none cursor-pointer hover:bg-neutral-50 transition-colors"
      style={{
        backgroundImage: disabled
          ? "none"
          : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
      }}
    >
      {STEM_TYPES.map((type) => (
        <option key={type.value} value={type.value}>
          {type.emoji} {type.label}
        </option>
      ))}
    </select>
  );
}
