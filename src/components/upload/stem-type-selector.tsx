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
      className="w-full px-2.5 py-1.5 text-xs font-medium bg-white rounded ring-1 ring-neutral-200
                 disabled:bg-neutral-100/50 disabled:text-neutral-500 disabled:cursor-not-allowed
                 appearance-none cursor-pointer hover:bg-neutral-50 hover:ring-neutral-300
                 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
      style={{
        backgroundImage: disabled
          ? "none"
          : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='%23737373' d='M4 6L1 2h6z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        paddingRight: "28px",
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
