import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

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
    <Card variant={variant} elevated={elevated} interactive={interactive} className={cn("p-4", className)}>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "h-12 w-12 border-2 border-black/10 rounded-2xl flex items-center justify-center",
            iconBg
          )}
        >
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-black leading-none truncate">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-sm font-bold",
                  trend.positive ? "text-lime-700" : "text-red-600"
                )}
              >
                {trend.value}
              </p>
            )}
          </div>
          <p className="text-sm text-neutral-600 truncate">{label}</p>
        </div>
      </div>
    </Card>
  );
}
