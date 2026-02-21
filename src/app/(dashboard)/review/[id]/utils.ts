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
  if (score <= 1) return "bg-red-50 border-red-400 text-red-700";
  if (score === 2) return "bg-orange-50 border-orange-400 text-orange-700";
  if (score === 3) return "bg-amber-50 border-amber-400 text-amber-700";
  if (score === 4) return "bg-emerald-50 border-emerald-400 text-emerald-700";
  return "bg-purple-50 border-purple-400 text-purple-700";
}

export function firstImpressionEnumFromScore(score: number): FirstImpression {
  if (score <= 2) return "LOST_INTEREST";
  if (score === 3) return "DECENT";
  return "STRONG_HOOK";
}
