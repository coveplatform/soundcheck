import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  trend?: { value: string; positive: boolean };
  interactive?: boolean;
  elevated?: boolean;
  variant?: "brutal" | "soft" | "airy";
  className?: string;
}

export function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
  trend,
  interactive,
  elevated = true,
  variant = "soft",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "border-2 border-neutral-200 rounded-2xl bg-white p-5 shadow-sm transition-all duration-150 ease-out h-full",
        interactive && "cursor-pointer hover:shadow-md hover:border-neutral-300 active:scale-[0.98]",
        className
      )}
    >
      <div className="flex flex-col gap-3 h-full">
        {/* Icon */}
        <div
          className={cn(
            "h-12 w-12 border-2 border-purple-200 rounded-xl flex items-center justify-center flex-shrink-0",
            iconBg
          )}
        >
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>

        {/* Value and Trend */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-bold leading-none text-black tabular-nums">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-xs font-bold",
                  trend.positive ? "text-purple-700" : "text-red-600"
                )}
              >
                {trend.value}
              </p>
            )}
          </div>

          {/* Label */}
          <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-snug line-clamp-2">{label}</p>
        </div>
      </div>
    </div>
  );
}
