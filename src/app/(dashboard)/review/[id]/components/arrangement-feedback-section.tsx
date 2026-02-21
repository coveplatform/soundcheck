"use client";

import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ArrangementFeedbackProps {
  energyCurve: string | null;
  setEnergyCurve: (value: string) => void;
  tooRepetitive: boolean | null;
  setTooRepetitive: (value: boolean) => void;
  repetitiveNote: string;
  setRepetitiveNote: (value: string) => void;
  lostInterestAt: number | null;
  setLostInterestAt: (value: number | null) => void;
  lostInterestReason: string;
  setLostInterestReason: (value: string) => void;
  trackLength: string | null;
  setTrackLength: (value: string) => void;
  playerSeconds: number;
  addTimestampNote: (seconds: number) => void;
}

function OptionButton({ value, label, emoji, isSelected, onClick }: {
  value: string;
  label: string;
  emoji?: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-3 text-left border rounded-lg transition-all",
        isSelected
          ? "bg-purple-50 border-purple-600 border-2"
          : "bg-white border-black/10 hover:border-purple-300 hover:bg-purple-50/50"
      )}
    >
      <div className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
        isSelected
          ? "bg-purple-600 border-purple-600"
          : "border-black/20"
      )}>
        {isSelected && <Check className="h-3 w-3 text-white" />}
      </div>
      {emoji && <span className="text-base">{emoji}</span>}
      <span className="text-sm font-semibold text-black">{label}</span>
    </button>
  );
}

export function ArrangementFeedbackSection(props: ArrangementFeedbackProps) {
  const energyOptions = [
    { value: "BUILDS_PERFECTLY", label: "Builds and releases perfectly", emoji: "✅" },
    { value: "STAYS_FLAT", label: "Stays flat (no variation)", emoji: "⚠️" },
    { value: "BUILDS_NO_PAYOFF", label: "Builds but no payoff", emoji: "⚠️" },
    { value: "ALL_OVER_PLACE", label: "All over the place (random)", emoji: "⚠️" },
  ];

  const lengthOptions = [
    { value: "TOO_SHORT", label: "Too short (wanted more)", emoji: "⏪" },
    { value: "PERFECT", label: "Perfect length", emoji: "✅" },
    { value: "BIT_LONG", label: "A bit long (trim 30s-1min)", emoji: "⚠️" },
    { value: "WAY_TOO_LONG", label: "Way too long (cut 1min+)", emoji: "❌" },
  ];

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card variant="soft" className="border border-black/10">
      <CardContent className="pt-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-black mb-1">Arrangement & Flow</h3>
          <p className="text-sm text-black/50">How does the track develop over time?</p>
        </div>

        {/* Energy Curve */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-black">📈 ENERGY CURVE - How does it develop?</Label>
          <div className="grid grid-cols-1 gap-2">
            {energyOptions.map((option) => (
              <OptionButton
                key={option.value}
                value={option.value}
                label={option.label}
                emoji={option.emoji}
                isSelected={props.energyCurve === option.value}
                onClick={() => props.setEnergyCurve(option.value)}
              />
            ))}
          </div>
        </div>

        {/* Repetition */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-black">🔁 Did anything feel TOO REPETITIVE?</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => props.setTooRepetitive(false)}
              className={cn(
                "px-4 py-3 text-sm font-semibold border rounded-lg transition-all",
                props.tooRepetitive === false
                  ? "bg-lime-50 border-lime-600 border-2 text-lime-900"
                  : "bg-white border-black/10 hover:border-lime-300 text-black"
              )}
            >
              ✅ No, repetition worked
            </button>
            <button
              type="button"
              onClick={() => props.setTooRepetitive(true)}
              className={cn(
                "px-4 py-3 text-sm font-semibold border rounded-lg transition-all",
                props.tooRepetitive === true
                  ? "bg-orange-50 border-orange-600 border-2 text-orange-900"
                  : "bg-white border-black/10 hover:border-orange-300 text-black"
              )}
            >
              ⚠️ Yes, too repetitive
            </button>
          </div>

          {props.tooRepetitive === true && (
            <div className="pt-2">
              <Label className="text-xs text-black/60 mb-2 block">What was too repetitive and where?</Label>
              <Textarea
                placeholder="e.g., 'The synth loop from 1:30-2:45 plays 16 times without variation'"
                value={props.repetitiveNote}
                onChange={(e) => props.setRepetitiveNote(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          )}
        </div>

        {/* Lost Interest */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-black">😴 Did you LOSE INTEREST at any point?</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                props.setLostInterestAt(null);
                props.setLostInterestReason("");
              }}
              className={cn(
                "px-4 py-3 text-sm font-semibold border rounded-lg transition-all",
                props.lostInterestAt === null
                  ? "bg-lime-50 border-lime-600 border-2 text-lime-900"
                  : "bg-white border-black/10 hover:border-lime-300 text-black"
              )}
            >
              ✅ Held attention throughout
            </button>
            <button
              type="button"
              onClick={() => {
                if (props.lostInterestAt === null) {
                  props.setLostInterestAt(Math.floor(props.playerSeconds));
                }
              }}
              className={cn(
                "px-4 py-3 text-sm font-semibold border rounded-lg transition-all",
                props.lostInterestAt !== null
                  ? "bg-orange-50 border-orange-600 border-2 text-orange-900"
                  : "bg-white border-black/10 hover:border-orange-300 text-black"
              )}
            >
              ⚠️ Lost interest
            </button>
          </div>

          {props.lostInterestAt !== null && (
            <div className="space-y-3 pt-2">
              <div>
                <Label className="text-xs text-black/60 mb-2 block">Around what time?</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="120"
                    value={props.lostInterestAt || ''}
                    onChange={(e) => props.setLostInterestAt(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-24"
                  />
                  <span className="text-sm text-black/50">
                    seconds {props.lostInterestAt ? `(${formatTimestamp(props.lostInterestAt)})` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => props.setLostInterestAt(Math.floor(props.playerSeconds))}
                    className="ml-auto text-xs text-purple-600 hover:text-purple-800 font-semibold"
                  >
                    Use current time
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-black/60 mb-2 block">Why did you lose interest?</Label>
                <Textarea
                  placeholder="e.g., 'Energy dropped too much', 'Same loop repeated', 'Nothing new happened'"
                  value={props.lostInterestReason}
                  onChange={(e) => props.setLostInterestReason(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Track Length */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-black">⏱️ TRACK LENGTH - How does it feel?</Label>
          <div className="grid grid-cols-1 gap-2">
            {lengthOptions.map((option) => (
              <OptionButton
                key={option.value}
                value={option.value}
                label={option.label}
                emoji={option.emoji}
                isSelected={props.trackLength === option.value}
                onClick={() => props.setTrackLength(option.value)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
