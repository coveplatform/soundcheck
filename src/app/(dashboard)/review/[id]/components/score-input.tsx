"use client";

import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hasError?: boolean;
}

export function ScoreInput({ label, value, onChange, hasError = false }: ScoreInputProps) {
  return (
    <div className="space-y-3">
      <Label className={cn("font-bold", hasError && "text-red-600")}>{label}</Label>
      <div className={cn("flex gap-1 p-2 border-2 bg-white", hasError ? "border-red-400" : "border-black")}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className="flex-1 p-1 hover:bg-neutral-100 transition-colors"
          >
            <Star
              className={cn(
                "h-6 w-6 mx-auto transition-colors",
                score <= value
                  ? "text-amber-500 fill-amber-500"
                  : "text-neutral-300 hover:text-neutral-400"
              )}
            />
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-xs font-mono text-neutral-600 text-center">{value}/5</p>
      )}
    </div>
  );
}
