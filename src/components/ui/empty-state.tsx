"use client";

import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HeadphonesDoodle, MusicDoodle, SparklesDoodle, StarDoodle } from "@/components/dashboard/doodles";

export interface EmptyStateProps {
  icon?: LucideIcon;
  doodle?: "headphones" | "music" | "star" | "sparkle";
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  doodle,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Doodle =
    doodle === "headphones"
      ? HeadphonesDoodle
      : doodle === "music"
        ? MusicDoodle
        : doodle === "star"
          ? StarDoodle
          : doodle === "sparkle"
            ? SparklesDoodle
            : null;

  return (
    <div className={cn("text-center py-14 sm:py-16", className)}>
      {Doodle ? (
        <Doodle className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
      ) : Icon ? (
        <Icon className="mx-auto mb-4 h-10 w-10 text-neutral-400" />
      ) : null}

      <h3 className="text-xl font-black mb-2">{title}</h3>
      <p className="text-neutral-600 mb-6 max-w-md mx-auto">{description}</p>

      {action && (
        <Link href={action.href}>
          <Button variant="primary">{action.label}</Button>
        </Link>
      )}
    </div>
  );
}
