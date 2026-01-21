"use client";

import { cn } from "@/lib/utils";

export type TimePeriod = "30d" | "3m" | "all";

interface TimePeriodSelectorProps {
  selected: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

export function TimePeriodSelector({ selected, onChange }: TimePeriodSelectorProps) {
  const options: { value: TimePeriod; label: string }[] = [
    { value: "30d", label: "Last 30 Days" },
    { value: "3m", label: "Last 3 Months" },
    { value: "all", label: "All Time" },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-white rounded-lg border-2 border-black/10">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-4 py-2 text-sm font-bold rounded-md transition-all",
            selected === option.value
              ? "bg-black text-white"
              : "text-black/60 hover:text-black hover:bg-black/5"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
