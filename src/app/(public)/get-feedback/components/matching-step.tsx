"use client";

import { Check, Loader2, Sparkles } from "lucide-react";

interface MatchingStepProps {
  matchingIndex: number;
  matchingDone: boolean;
}

export function MatchingStep({ matchingIndex, matchingDone }: MatchingStepProps) {
  const messages = [
    "Analyzing your track…",
    "Matching genres & vibes…",
    "Checking reviewer availability…",
    "Reviewers found.",
  ];

  const features = [
    "Audio fingerprint",
    "Genre matching",
    "Listener preferences",
    "Availability check",
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-neutral-900 border-2 border-neutral-700 px-4 py-2 text-sm font-black uppercase tracking-wider">
          <Sparkles className="h-4 w-4 text-purple-600" />
          Matching Reviewers
        </div>
        <h1 className="text-3xl sm:text-4xl font-black">Finding your best listeners</h1>
        <p className="text-neutral-400">This is where the signal gets good.</p>
      </div>

      <div className="relative border-2 border-neutral-700 bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-600/25 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-600/10 blur-3xl" />
        </div>

        <div className="relative p-6 space-y-6">
          <div className="flex items-start gap-4">
            {matchingDone ? (
              <div className="h-12 w-12 bg-purple-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_0_2px_rgba(147,51,234,1),0_0_40px_rgba(147,51,234,0.25)]">
                <Check className="h-6 w-6 text-black" />
              </div>
            ) : (
              <div className="h-12 w-12 bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center flex-shrink-0">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            )}

            <div className="flex-1">
              <p className="font-black text-white text-lg">
                {messages[matchingIndex]}
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                {matchingDone ? "Locked in. Sending you to the next step…" : "This usually takes a few seconds."}
              </p>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-500 mb-2">
                  <span>PROGRESS</span>
                  <span>{matchingDone ? 100 : Math.round((matchingIndex / 3) * 100)}%</span>
                </div>
                <div className="h-2 bg-neutral-800 border border-neutral-700">
                  <div
                    className="h-full bg-purple-600 transition-[width] duration-300 ease-out motion-reduce:transition-none"
                    style={{ width: `${matchingDone ? 100 : Math.round((matchingIndex / 3) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feature, i) => (
              <MatchingFeature
                key={feature}
                label={feature}
                isComplete={matchingDone || i < matchingIndex}
                isActive={!matchingDone && i === matchingIndex}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MatchingFeatureProps {
  label: string;
  isComplete: boolean;
  isActive: boolean;
}

function MatchingFeature({ label, isComplete, isActive }: MatchingFeatureProps) {
  return (
    <div className="flex items-center gap-3 p-3 border border-neutral-700 bg-neutral-800/50">
      {isComplete ? (
        <div className="h-6 w-6 bg-purple-600 flex items-center justify-center flex-shrink-0">
          <Check className="h-3.5 w-3.5 text-black" />
        </div>
      ) : isActive ? (
        <div className="h-6 w-6 border border-neutral-600 flex items-center justify-center flex-shrink-0">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="h-6 w-6 border border-neutral-700 flex-shrink-0" />
      )}
      <span className={isComplete ? "text-white font-medium" : "text-neutral-500"}>
        {label}
      </span>
    </div>
  );
}
