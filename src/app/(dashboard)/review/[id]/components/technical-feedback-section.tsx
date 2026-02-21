"use client";

import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface TechnicalFeedbackProps {
  lowEndClarity: string | null;
  setLowEndClarity: (value: string) => void;
  vocalClarity: string | null;
  setVocalClarity: (value: string) => void;
  highEndQuality: string | null;
  setHighEndQuality: (value: string) => void;
  stereoWidth: string | null;
  setStereoWidth: (value: string) => void;
  dynamics: string | null;
  setDynamics: (value: string) => void;
}

interface OptionButton {
  value: string;
  label: string;
  emoji?: string;
  description?: string;
}

function OptionSelector({
  label,
  options,
  value,
  onChange,
  helpText
}: {
  label: string;
  options: OptionButton[];
  value: string | null;
  onChange: (value: string) => void;
  helpText?: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-semibold text-black">{label}</Label>
        {helpText && <p className="text-xs text-black/50 mt-1">{helpText}</p>}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex items-center gap-3 px-4 py-3 text-left border rounded-lg transition-all",
              value === option.value
                ? "bg-purple-50 border-purple-600 border-2"
                : "bg-white border-black/10 hover:border-purple-300 hover:bg-purple-50/50"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
              value === option.value
                ? "bg-purple-600 border-purple-600"
                : "border-black/20"
            )}>
              {value === option.value && <Check className="h-3 w-3 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {option.emoji && <span className="text-base">{option.emoji}</span>}
                <span className="text-sm font-semibold text-black">{option.label}</span>
              </div>
              {option.description && (
                <p className="text-xs text-black/50 mt-0.5">{option.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TechnicalFeedbackSection(props: TechnicalFeedbackProps) {
  const lowEndOptions: OptionButton[] = [
    { value: "PERFECT", label: "Perfect balance", emoji: "✅", description: "Both kick and bass are clear" },
    { value: "KICK_TOO_LOUD", label: "Kick too loud", emoji: "⚠️", description: "Kick is drowning the bass" },
    { value: "BASS_TOO_LOUD", label: "Bass too loud", emoji: "⚠️", description: "Bass is drowning the kick" },
    { value: "BOTH_MUDDY", label: "Both muddy/unclear", emoji: "⚠️", description: "Low end needs cleaning up" },
    { value: "BARELY_AUDIBLE", label: "Can barely hear low end", emoji: "❌", description: "Missing sub/bass presence" },
  ];

  const vocalOptions: OptionButton[] = [
    { value: "CRYSTAL_CLEAR", label: "Crystal clear", emoji: "✅", description: "Vocals sit perfectly in the mix" },
    { value: "SLIGHTLY_BURIED", label: "Slightly buried", emoji: "⚠️", description: "Need +1-2dB" },
    { value: "BURIED", label: "Buried in the mix", emoji: "⚠️", description: "Need +3dB or more" },
    { value: "TOO_LOUD", label: "Too loud", emoji: "⚠️", description: "Drowning the instrumental" },
    { value: "NOT_APPLICABLE", label: "No vocals / instrumental", emoji: "➖" },
  ];

  const highEndOptions: OptionButton[] = [
    { value: "PERFECT", label: "Perfect brightness", emoji: "✅" },
    { value: "TOO_DULL", label: "Too dull", emoji: "⚠️", description: "Needs more air/sparkle (8-12kHz)" },
    { value: "TOO_HARSH", label: "Too harsh/piercing", emoji: "⚠️", description: "Needs de-essing or EQ cut" },
    { value: "ACCEPTABLE", label: "Acceptable", emoji: "😐" },
  ];

  const stereoOptions: OptionButton[] = [
    { value: "TOO_NARROW", label: "Too narrow (mono-ish)", emoji: "⚠️" },
    { value: "GOOD_BALANCE", label: "Good balance", emoji: "✅" },
    { value: "TOO_WIDE", label: "Too wide (disconnected)", emoji: "⚠️" },
  ];

  const dynamicsOptions: OptionButton[] = [
    { value: "GREAT_DYNAMICS", label: "Great dynamics", emoji: "✅", description: "Builds and releases well" },
    { value: "ACCEPTABLE", label: "Acceptable", emoji: "😐" },
    { value: "TOO_COMPRESSED", label: "Too compressed/loud", emoji: "⚠️", description: "No dynamics, fatiguing" },
    { value: "TOO_QUIET", label: "Too quiet/under-compressed", emoji: "⚠️", description: "Needs more compression" },
  ];

  return (
    <Card variant="soft" className="border border-black/10">
      <CardContent className="pt-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-black mb-1">Mix & Production Elements</h3>
          <p className="text-sm text-black/50">Rate specific technical aspects instead of generic "production score"</p>
        </div>

        <OptionSelector
          label="🔊 LOW END - Kick & Bass Balance"
          options={lowEndOptions}
          value={props.lowEndClarity}
          onChange={props.setLowEndClarity}
          helpText="Can you clearly hear both the kick drum and bass?"
        />

        <OptionSelector
          label="🎤 VOCALS - Clarity in Mix"
          options={vocalOptions}
          value={props.vocalClarity}
          onChange={props.setVocalClarity}
          helpText="How clear are the vocals compared to the instrumental?"
        />

        <OptionSelector
          label="✨ HIGH END - Brightness & Air"
          options={highEndOptions}
          value={props.highEndQuality}
          onChange={props.setHighEndQuality}
          helpText="Does the track have the right amount of high-frequency content?"
        />

        <OptionSelector
          label="↔️ STEREO WIDTH - Spaciousness"
          options={stereoOptions}
          value={props.stereoWidth}
          onChange={props.setStereoWidth}
          helpText="Does the track feel spacious or cramped?"
        />

        <OptionSelector
          label="📊 DYNAMICS - Compression & Movement"
          options={dynamicsOptions}
          value={props.dynamics}
          onChange={props.setDynamics}
          helpText="Does the track have dynamic range (loud/quiet moments)?"
        />
      </CardContent>
    </Card>
  );
}
