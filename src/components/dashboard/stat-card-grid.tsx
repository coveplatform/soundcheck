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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const IconComponent = iconMap[stat.iconName];

        const card = (
          <StatCard
            key={stat.id}
            icon={IconComponent}
            iconBg={stat.iconBg}
            iconColor={stat.iconColor}
            value={stat.value}
            label={stat.label}
            interactive={!!stat.href}
            variant="soft"
            className={stat.href ? "cursor-pointer" : ""}
          />
        );

        // Wrap in tooltip if tooltip content exists
        const cardWithTooltip = stat.tooltip ? (
          <Tooltip content={stat.tooltip}>{card}</Tooltip>
        ) : (
          card
        );

        // Wrap in link if href exists
        if (stat.href) {
          return (
            <Link
              key={stat.id}
              href={stat.href}
              aria-label={stat.ariaLabel}
              className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 rounded-2xl"
            >
              {cardWithTooltip}
            </Link>
          );
        }

        return <div key={stat.id}>{cardWithTooltip}</div>;
      })}
    </div>
  );
}
