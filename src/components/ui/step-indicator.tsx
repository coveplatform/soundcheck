"use client";

import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  variant?: "dots" | "text" | "progress";
  className?: string;
}

export function StepIndicator({
  currentStep,
  totalSteps,
  labels,
  variant = "text",
  className,
}: StepIndicatorProps) {
  if (variant === "dots") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              i + 1 <= currentStep ? "bg-black" : "bg-black/20"
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === "progress") {
    const progress = (currentStep / totalSteps) * 100;
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex justify-between text-xs text-black/40">
          <span>Step {currentStep} of {totalSteps}</span>
          {labels?.[currentStep - 1] && <span>{labels[currentStep - 1]}</span>}
        </div>
        <div className="h-1 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // Default: text variant
  return (
    <p className={cn("text-xs font-mono tracking-widest text-black/40 uppercase", className)}>
      step {currentStep} of {totalSteps}
    </p>
  );
}
