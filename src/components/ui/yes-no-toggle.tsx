"use client";

import { cn } from "@/lib/utils";

interface YesNoToggleProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "soft";
}

export function YesNoToggle({
  value,
  onChange,
  yesLabel = "Yes",
  noLabel = "No",
  size = "md",
  variant = "default",
}: YesNoToggleProps) {
  const sizeClasses = {
    sm: "py-1.5 px-2 text-xs",
    md: "py-2.5 px-3 text-sm",
    lg: "py-3 px-4 text-base",
  };

  const baseClasses = cn(
    "flex-1 font-bold transition-colors duration-150 ease-out",
    sizeClasses[size]
  );

  if (variant === "soft") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            baseClasses,
            "rounded-xl border",
            value === true
              ? "bg-lime-400 text-black border-lime-500"
              : "bg-white/60 text-black border-black/10 hover:bg-white"
          )}
        >
          {yesLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            baseClasses,
            "rounded-xl border",
            value === false
              ? "bg-black text-white border-black"
              : "bg-white/60 text-black border-black/10 hover:bg-white"
          )}
        >
          {noLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          baseClasses,
          "border-2 border-black",
          value === true
            ? "bg-lime-500 text-black"
            : "bg-white text-black hover:bg-neutral-100"
        )}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          baseClasses,
          "border-2 border-black",
          value === false
            ? "bg-neutral-800 text-white"
            : "bg-white text-black hover:bg-neutral-100"
        )}
      >
        {noLabel}
      </button>
    </div>
  );
}
