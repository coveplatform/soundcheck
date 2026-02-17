"use client";

import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface EmotionalImpactProps {
  emotionalImpact: string[];
  setEmotionalImpact: (value: string[]) => void;
  memorableMoment: string;
  setMemorableMoment: (value: string) => void;
  originalityScore: number;
  setOriginalityScore: (value: number) => void;
  playlistAction: string | null;
  setPlaylistAction: (value: string) => void;
}

const emotions = [
  { value: "energetic", label: "Energetic", emoji: "⚡" },
  { value: "relaxed", label: "Relaxed", emoji: "😌" },
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "sad", label: "Sad", emoji: "😢" },
  { value: "angry", label: "Angry", emoji: "😠" },
  { value: "nostalgic", label: "Nostalgic", emoji: "🌅" },
  { value: "excited", label: "Excited", emoji: "🤩" },
  { value: "confused", label: "Confused", emoji: "😕" },
  { value: "nothing", label: "Nothing/Neutral", emoji: "😐" },
];

const playlistActions = [
  { value: "ADD_TO_LIBRARY", label: "Add to my library", emoji: "❤️", color: "lime" },
  { value: "LET_PLAY", label: "Let it play", emoji: "👍", color: "purple" },
  { value: "SKIP", label: "Skip it", emoji: "⏭️", color: "orange" },
  { value: "DISLIKE", label: "Dislike/thumbs down", emoji: "👎", color: "red" },
];

export function EmotionalImpactSection(props: EmotionalImpactProps) {
  const toggleEmotion = (emotion: string) => {
    if (props.emotionalImpact.includes(emotion)) {
      props.setEmotionalImpact(props.emotionalImpact.filter(e => e !== emotion));
    } else {
      props.setEmotionalImpact([...props.emotionalImpact, emotion]);
    }
  };

  return (
    <Card variant="soft" className="border border-black/10">
      <CardContent className="pt-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-black mb-1">Emotional & Artistic Impact</h3>
          <p className="text-sm text-black/50">How did this track make you feel?</p>
        </div>

        {/* Emotional Impact */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-black">
            💭 What EMOTIONS did this track make you feel? (Select all that apply)
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {emotions.map((emotion) => (
              <button
                key={emotion.value}
                type="button"
                onClick={() => toggleEmotion(emotion.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-sm font-semibold border rounded-lg transition-all",
                  props.emotionalImpact.includes(emotion.value)
                    ? "bg-purple-50 border-purple-600 border-2 text-purple-900"
                    : "bg-white border-black/10 hover:border-purple-300 hover:bg-purple-50/50 text-black"
                )}
              >
                <span className="text-base">{emotion.emoji}</span>
                <span>{emotion.label}</span>
                {props.emotionalImpact.includes(emotion.value) && (
                  <Check className="h-4 w-4 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Memorable Moment */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-semibold text-black">
              🌟 What's the ONE THING you'll remember about this track tomorrow?
            </Label>
            <p className="text-xs text-black/50 mt-1">
              This captures the hook/memorable moment (e.g., "That synth riff at 1:45", "The vocal delivery in the chorus")
            </p>
          </div>
          <Textarea
            placeholder="Be specific about what stuck with you..."
            value={props.memorableMoment}
            onChange={(e) => props.setMemorableMoment(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Originality */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-black">
            ✨ ORIGINALITY - Does this sound fresh or familiar?
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { score: 5, label: "Very unique", color: "lime" },
              { score: 4, label: "Some fresh ideas", color: "purple" },
              { score: 3, label: "Familiar sound", color: "orange" },
              { score: 2, label: "Too derivative", color: "red" },
            ].map((option) => (
              <button
                key={option.score}
                type="button"
                onClick={() => props.setOriginalityScore(option.score)}
                className={cn(
                  "px-4 py-3 text-sm font-semibold border-2 rounded-lg transition-all",
                  props.originalityScore === option.score
                    ? `bg-${option.color}-50 border-${option.color}-600 text-${option.color}-900`
                    : "bg-white border-black/10 hover:border-purple-300 text-black"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Playlist Action */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-black">
            🎵 If this played on a playlist, would you...
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {playlistActions.map((action) => (
              <button
                key={action.value}
                type="button"
                onClick={() => props.setPlaylistAction(action.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-left border-2 rounded-lg transition-all",
                  props.playlistAction === action.value
                    ? `bg-${action.color}-50 border-${action.color}-600`
                    : "bg-white border-black/10 hover:border-purple-300"
                )}
              >
                <span className="text-xl">{action.emoji}</span>
                <span className="text-sm font-semibold text-black">{action.label}</span>
                {props.playlistAction === action.value && (
                  <Check className="h-4 w-4 ml-auto text-black" />
                )}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
