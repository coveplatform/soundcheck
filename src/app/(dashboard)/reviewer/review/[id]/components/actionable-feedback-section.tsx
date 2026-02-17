"use client";

import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { WordCounter } from "@/components/ui/word-counter";
import { cn } from "@/lib/utils";

interface ActionableFeedbackProps {
  bestPart: string;
  setBestPart: (value: string) => void;
  biggestWeaknessSpecific: string;
  setBiggestWeaknessSpecific: (value: string) => void;
  quickWin: string;
  setQuickWin: (value: string) => void;
  bestPartWords: number;
  weaknessWords: number;
  quickWinWords: number;
  addTimestampNote: (seconds: number) => void;
  playerSeconds: number;
}

const MIN_WORDS_BEST = 15;
const MIN_WORDS_WEAKNESS = 15;
const MIN_WORDS_QUICKWIN = 10;

export function ActionableFeedbackSection(props: ActionableFeedbackProps) {
  return (
    <Card variant="soft" className="border border-black/10">
      <CardContent className="pt-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-black mb-1">Specific Feedback</h3>
          <p className="text-sm text-black/50">Give the artist clear, actionable guidance</p>
        </div>

        {/* Best Moment */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-semibold text-black">
              ✅ BEST MOMENT - What's working really well?
            </Label>
            <p className="text-xs text-black/50 mt-1">
              Identify a <strong>specific element or moment</strong> (e.g., "the synth at 1:45", "the drop at 2:30") and explain <strong>WHY it works</strong>
            </p>
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder={`Example: "The synth melody at 1:45 is catchy and memorable. The way it layers with the vocals creates a really nice texture that makes the chorus pop. This is the hook that will stick with listeners."`}
              value={props.bestPart}
              onChange={(e) => props.setBestPart(e.target.value)}
              className={cn(
                "min-h-[100px]",
                props.bestPartWords >= MIN_WORDS_BEST && "border-lime-600"
              )}
            />
            <WordCounter
              current={props.bestPartWords}
              target={MIN_WORDS_BEST}
              label="words"
            />
          </div>
        </div>

        {/* Biggest Weakness */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-semibold text-black">
              ⚠️ BIGGEST WEAKNESS - What's the #1 thing holding this track back?
            </Label>
            <p className="text-xs text-black/50 mt-1">
              Be <strong>specific</strong>. Instead of "mixing needs work", say <strong>"vocals buried under synths at chorus (1:15-1:45)"</strong>
            </p>
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder={`Example: "The vocals are completely buried under the synths during the chorus (1:15-1:45). They need to be 3-4dB louder and maybe a cut around 200-300Hz to reduce muddiness. Right now I can barely understand the lyrics during the most important part of the song."`}
              value={props.biggestWeaknessSpecific}
              onChange={(e) => props.setBiggestWeaknessSpecific(e.target.value)}
              className={cn(
                "min-h-[100px]",
                props.weaknessWords >= MIN_WORDS_WEAKNESS && "border-lime-600"
              )}
            />
            <WordCounter
              current={props.weaknessWords}
              target={MIN_WORDS_WEAKNESS}
              label="words"
            />
          </div>
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-900 font-medium">
              💡 <strong>Tip:</strong> Include timestamps, specific elements, and numeric suggestions when possible (dB, Hz, seconds)
            </p>
          </div>
        </div>

        {/* Quick Win */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-semibold text-black">
              🎯 QUICK WIN - What's ONE small change that would make a big difference?
            </Label>
            <p className="text-xs text-black/50 mt-1">
              Give the artist an <strong>easy first step</strong>. Examples: "Turn vocals up 3dB", "Cut the intro by 8 bars", "Remove the crash at 2:45"
            </p>
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder={`Example: "Just turn the vocals up 3dB across the whole track. That alone would make this 10x better and it'll take 2 minutes to re-export."`}
              value={props.quickWin}
              onChange={(e) => props.setQuickWin(e.target.value)}
              className={cn(
                "min-h-[80px]",
                props.quickWinWords >= MIN_WORDS_QUICKWIN && "border-lime-600"
              )}
            />
            <WordCounter
              current={props.quickWinWords}
              target={MIN_WORDS_QUICKWIN}
              label="words"
            />
          </div>
          <div className="p-3 bg-lime-50 border border-lime-200 rounded-lg">
            <p className="text-xs text-lime-900 font-medium">
              ⭐ <strong>This is the most valuable feedback!</strong> One actionable change the artist can make right now.
            </p>
          </div>
        </div>

        {/* Examples */}
        <details className="group">
          <summary className="cursor-pointer text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            Show examples of great vs. vague feedback
          </summary>
          <div className="mt-3 space-y-3 text-xs">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-red-900 mb-1">❌ VAGUE (Not helpful)</p>
              <p className="text-red-800">"The mixing could be better and the vocals are too quiet. Keep working on it."</p>
            </div>
            <div className="p-3 bg-lime-50 border border-lime-200 rounded-lg">
              <p className="font-semibold text-lime-900 mb-1">✅ SPECIFIC (Actionable)</p>
              <p className="text-lime-800">"Vocals are buried 3-4dB under the synths during chorus (1:15-1:45). Boost vocals, cut 200-300Hz mud, and add 3-5kHz presence. Quick win: Just +3dB vocals and re-export."</p>
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
