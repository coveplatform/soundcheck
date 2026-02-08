"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

function countWords(text: string): number {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).length;
}

interface WordCounterProps {
  text: string;
  minWords: number;
  className?: string;
}

export function WordCounter({ text, minWords, className }: WordCounterProps) {
  const wordCount = countWords(text);
  const isComplete = wordCount >= minWords;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <p className={cn(
        "text-xs font-mono",
        isComplete ? "text-purple-600" : "text-neutral-500"
      )}>
        {wordCount}/{minWords} words
      </p>
      {isComplete && (
        <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
          <Check className="h-3 w-3" /> Complete
        </span>
      )}
    </div>
  );
}

export { countWords };
