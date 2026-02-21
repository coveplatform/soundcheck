"use client";

import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ContextNextStepsProps {
  targetAudience: string[];
  setTargetAudience: (value: string[]) => void;
  nextFocus: string | null;
  setNextFocus: (value: string) => void;
  expectedPlacement: string | null;
  setExpectedPlacement: (value: string) => void;
  qualityLevel: string | null;
  setQualityLevel: (value: string) => void;
}

const audienceOptions = [
  { value: "clubs", label: "Clubs/DJs", emoji: "🎧" },
  { value: "playlists", label: "Playlists/Streaming", emoji: "📱" },
  { value: "radio", label: "Radio", emoji: "📻" },
  { value: "live", label: "Live Performances", emoji: "🎤" },
  { value: "personal", label: "Personal Listening", emoji: "🎵" },
  { value: "background", label: "Background Music", emoji: "🏪" },
  { value: "sync", label: "Sync/Licensing", emoji: "🎬" },
];

const nextFocusOptions = [
  { value: "MIXING", label: "Mixing/Mastering", emoji: "🎛️", description: "Balance, EQ, compression" },
  { value: "ARRANGEMENT", label: "Arrangement/Structure", emoji: "🎼", description: "Song structure, pacing" },
  { value: "SOUND_DESIGN", label: "Sound Design/Production", emoji: "🔊", description: "Sound selection, synths" },
  { value: "SONGWRITING", label: "Songwriting/Melody", emoji: "✍️", description: "Hooks, lyrics, composition" },
  { value: "PERFORMANCE", label: "Performance/Energy", emoji: "⚡", description: "Vocal delivery, intensity" },
  { value: "READY_TO_RELEASE", label: "Ready to Release!", emoji: "🚀", description: "Sounds professional" },
];

const placementOptions = [
  { value: "EDITORIAL", label: "Spotify Editorial", emoji: "🎧" },
  { value: "SOUNDCLOUD_TRENDING", label: "SoundCloud Trending", emoji: "☁️" },
  { value: "CLUB", label: "Club/Festival", emoji: "🎉" },
  { value: "COFFEE_SHOP", label: "Coffee Shop", emoji: "☕" },
  { value: "VIDEO_GAME", label: "Video Game", emoji: "🎮" },
  { value: "AD", label: "Ad/Commercial", emoji: "📺" },
  { value: "NOWHERE", label: "Nowhere (not ready)", emoji: "⏸️" },
];

const qualityOptions = [
  { value: "PROFESSIONAL", label: "Professional/Radio-Quality", emoji: "🌟", color: "lime" },
  { value: "RELEASE_READY", label: "Release-Ready", emoji: "✅", color: "purple" },
  { value: "ALMOST_THERE", label: "Almost There (needs polish)", emoji: "⚠️", color: "orange" },
  { value: "DEMO_STAGE", label: "Demo/Rough Mix Stage", emoji: "🎨", color: "orange" },
  { value: "NOT_READY", label: "Not Ready for Release", emoji: "❌", color: "red" },
];

export function ContextNextStepsSection(props: ContextNextStepsProps) {
  const toggleAudience = (value: string) => {
    if (props.targetAudience.includes(value)) {
      props.setTargetAudience(props.targetAudience.filter(a => a !== value));
    } else {
      props.setTargetAudience([...props.targetAudience, value]);
    }
  };

  return (
    <Card variant="soft" className="border border-black/10">
      <CardContent className="pt-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-black mb-1">Context & Next Steps</h3>
          <p className="text-sm text-black/50">Help the artist understand where this track fits</p>
        </div>

        {/* Target Audience */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-black">
            🎯 Who is this track FOR? (Select all that apply)
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {audienceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleAudience(option.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-sm font-semibold border rounded-lg transition-all",
                  props.targetAudience.includes(option.value)
                    ? "bg-purple-50 border-purple-600 border-2 text-purple-900"
                    : "bg-white border-black/10 hover:border-purple-300 hover:bg-purple-50/50 text-black"
                )}
              >
                <span className="text-base">{option.emoji}</span>
                <span className="flex-1 text-left">{option.label}</span>
                {props.targetAudience.includes(option.value) && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Next Focus */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-black">
            📋 What should the artist focus on NEXT?
          </Label>
          <div className="grid grid-cols-1 gap-2">
            {nextFocusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => props.setNextFocus(option.value)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-left border rounded-lg transition-all",
                  props.nextFocus === option.value
                    ? "bg-purple-50 border-purple-600 border-2"
                    : "bg-white border-black/10 hover:border-purple-300 hover:bg-purple-50/50"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  props.nextFocus === option.value
                    ? "bg-purple-600 border-purple-600"
                    : "border-black/20"
                )}>
                  {props.nextFocus === option.value && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="text-base">{option.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-black">{option.label}</div>
                  <div className="text-xs text-black/50">{option.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Expected Placement */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-black">
            📍 Where would you expect to hear this?
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {placementOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => props.setExpectedPlacement(option.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-sm font-semibold border rounded-lg transition-all",
                  props.expectedPlacement === option.value
                    ? "bg-purple-50 border-purple-600 border-2 text-purple-900"
                    : "bg-white border-black/10 hover:border-purple-300 hover:bg-purple-50/50 text-black"
                )}
              >
                <span className="text-base">{option.emoji}</span>
                <span className="flex-1 text-left">{option.label}</span>
                {props.expectedPlacement === option.value && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quality Level */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-black">
            ⭐ Overall quality level compared to professional releases
          </Label>
          <div className="grid grid-cols-1 gap-2">
            {qualityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => props.setQualityLevel(option.value)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-left border-2 rounded-lg transition-all font-semibold",
                  props.qualityLevel === option.value
                    ? `bg-${option.color}-50 border-${option.color}-600 text-${option.color}-900`
                    : "bg-white border-black/10 hover:border-purple-300 text-black"
                )}
              >
                <span className="text-xl">{option.emoji}</span>
                <span className="flex-1">{option.label}</span>
                {props.qualityLevel === option.value && (
                  <Check className="h-5 w-5" />
                )}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
