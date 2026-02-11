"use client";

import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  maxScore?: number;
  hasError?: boolean;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ScoreInput({
  label,
  value,
  onChange,
  maxScore = 5,
  hasError = false,
  showValue = true,
  size = "md",
}: ScoreInputProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const paddingClasses = {
    sm: "p-0.5",
    md: "p-1",
    lg: "p-1.5",
  };

  return (
    <div className="space-y-3">
      <Label className={cn("font-bold", hasError && "text-red-600")}>{label}</Label>
      <div className={cn(
        "flex gap-1 p-2 border bg-white rounded-xl",
        hasError ? "border-red-400" : "border-black/10"
      )}>
        {Array.from({ length: maxScore }, (_, i) => i + 1).map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={cn("flex-1 hover:bg-neutral-100 transition-colors rounded-lg", paddingClasses[size])}
          >
            <Star
              className={cn(
                "mx-auto transition-colors",
                sizeClasses[size],
                score <= value
                  ? "text-amber-500 fill-amber-500"
                  : "text-neutral-300 hover:text-neutral-400"
              )}
            />
          </button>
        ))}
      </div>
      {showValue && value > 0 && (
        <p className="text-xs font-mono text-neutral-600 text-center">{value}/{maxScore}</p>
      )}
    </div>
  );
}
