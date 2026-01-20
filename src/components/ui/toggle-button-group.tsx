"use client";

import { cn } from "@/lib/utils";

interface ToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface ToggleButtonGroupProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
  variant?: "default" | "soft" | "pills";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ToggleButtonGroup<T extends string>({
  options,
  value,
  onChange,
  columns = 4,
  variant = "default",
  size = "md",
  className,
}: ToggleButtonGroupProps<T>) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  const sizeClasses = {
    sm: "p-2 gap-1",
    md: "p-3 gap-2",
    lg: "p-4 gap-3",
  };

  const textSizeClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  if (variant === "pills") {
    return (
      <div className={cn("flex gap-2 flex-wrap", className)}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "px-4 py-2 rounded-full font-medium transition-colors duration-150 ease-out",
              textSizeClasses[size],
              value === option.value
                ? "bg-black text-white"
                : "bg-black/5 text-black hover:bg-black/10"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "soft") {
    return (
      <div className={cn("grid gap-2", gridCols[columns], className)}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-center rounded-2xl border transition-colors duration-150 ease-out",
              sizeClasses[size],
              value === option.value
                ? "bg-black text-white border-black"
                : "bg-white/60 text-black border-black/10 hover:bg-white"
            )}
          >
            {option.icon}
            <span className={cn("font-medium", textSizeClasses[size])}>{option.label}</span>
            {option.description && (
              <span className={cn(
                "mt-0.5",
                textSizeClasses[size],
                value === option.value ? "text-white/70" : "text-black/40"
              )}>
                {option.description}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("grid gap-2", gridCols[columns], className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex flex-col items-center border-2 border-black transition-colors duration-150 ease-out",
            sizeClasses[size],
            value === option.value
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-neutral-50"
          )}
        >
          {option.icon}
          <span className={cn("font-medium", textSizeClasses[size])}>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
