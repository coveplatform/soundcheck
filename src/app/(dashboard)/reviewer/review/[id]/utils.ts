import { FirstImpression } from "./types";

export function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function countWords(text: string): number {
  return (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).length;
}

export function getTierEarningsCents(tier: string | null | undefined): number {
  return tier === "PRO" ? 150 : 50;
}

export function formatFirstImpression(value: FirstImpression | null | undefined): string {
  if (!value) return "—";
  if (value === "STRONG_HOOK") return "Strong Hook";
  if (value === "DECENT") return "Decent";
  return "Lost Interest";
}

export function makeClientId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function firstImpressionLabel(score: number): string {
  if (score <= 1) return "Skipped ahead / Lost interest";
  if (score === 2) return "Kept listening, but not grabbed";
  if (score === 3) return "Solid intro, curious to hear more";
  if (score === 4) return "This is catching my attention";
  return "Hooked - I need to hear the rest";
}

export function firstImpressionColor(score: number): string {
  if (score <= 1) return "bg-red-100 border-red-400 text-red-800";
  if (score === 2) return "bg-orange-100 border-orange-400 text-orange-800";
  if (score === 3) return "bg-yellow-100 border-yellow-400 text-yellow-800";
  if (score === 4) return "bg-lime-100 border-lime-400 text-lime-800";
  return "bg-green-100 border-green-400 text-green-800";
}

export function firstImpressionEnumFromScore(score: number): FirstImpression {
  if (score <= 2) return "LOST_INTEREST";
  if (score === 3) return "DECENT";
  return "STRONG_HOOK";
}
