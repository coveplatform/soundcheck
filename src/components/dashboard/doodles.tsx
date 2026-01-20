"use client";

import * as React from "react";

import {
  Sparkle,
  Star,
  Squiggle,
  Circle,
  Dots,
  MusicNote,
} from "@/components/landing/doodles";

export { Sparkle as SparklesDoodle, Star as StarDoodle, Squiggle as SquiggleDoodle, Circle as CircleDoodle, Dots as DotsDoodle };

export function MusicDoodle({ className = "" }: { className?: string }) {
  return <MusicNote className={className} />;
}

export function HeadphonesDoodle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <path
        d="M14 34V30C14 20.1 22.1 12 32 12C41.9 12 50 20.1 50 30V34"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 34C14 31.8 12.2 30 10 30C7.8 30 6 31.8 6 34V44C6 46.2 7.8 48 10 48C12.2 48 14 46.2 14 44V34Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinejoin="round"
      />
      <path
        d="M58 34C58 31.8 56.2 30 54 30C51.8 30 50 31.8 50 34V44C50 46.2 51.8 48 54 48C56.2 48 58 46.2 58 44V34Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinejoin="round"
      />
      <path
        d="M22 52C25.5 55 29.9 56.7 34.5 56.7C39.4 56.7 44 54.8 47.5 51.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
