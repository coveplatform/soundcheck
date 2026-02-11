"use client";

import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { Tooltip } from "@/components/ui/tooltip";
import { DashboardStat } from "@/types/dashboard";
import { Music, Headphones, Star, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardGridProps {
  stats: DashboardStat[];
}

// Map icon names to actual Lucide components
const iconMap: Record<DashboardStat["iconName"], LucideIcon> = {
  music: Music,
  headphones: Headphones,
  star: Star,
  sparkles: Sparkles,
};

export function StatCardGrid({ stats }: StatCardGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const IconComponent = iconMap[stat.iconName];

        const card = (
          <StatCard
            icon={IconComponent}
            iconBg={stat.iconBg}
            iconColor={stat.iconColor}
            value={stat.value}
            label={stat.label}
            interactive={!!stat.href}
            variant="soft"
            className="h-full"
          />
        );

        // Build content: optionally wrap in tooltip
        const content = stat.tooltip ? (
          <Tooltip content={stat.tooltip}>{card}</Tooltip>
        ) : (
          card
        );

        // Uniform outer wrapper: Link or div, both with h-full
        return stat.href ? (
          <Link
            key={stat.id}
            href={stat.href}
            aria-label={stat.ariaLabel}
            className="block h-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 rounded-xl"
          >
            {content}
          </Link>
        ) : (
          <div key={stat.id} className="h-full">
            {content}
          </div>
        );
      })}
    </div>
  );
}
