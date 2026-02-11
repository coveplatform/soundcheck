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
        "border border-black/8 rounded-xl bg-white/60 px-3.5 py-2.5 transition-colors duration-150 ease-out",
        interactive && "cursor-pointer hover:bg-white hover:border-black/12 active:scale-[0.98]",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0",
            iconBg
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", iconColor)} />
        </div>
        <p className="text-lg font-bold leading-none text-black tabular-nums">{value}</p>
        {trend && (
          <p className={cn("text-[10px] font-bold", trend.positive ? "text-emerald-600" : "text-red-600")}>
            {trend.value}
          </p>
        )}
        <p className="text-xs text-black/40 leading-none">{label}</p>
      </div>
    </div>
  );
}
