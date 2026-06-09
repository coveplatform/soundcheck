import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

/**
 * Shared dark-cyan admin UI kit. Mirrors the product look
 * (see src/app/page.tsx / dashboard): #0a0a0a surfaces, #6ee7ff accent,
 * Plus Jakarta + JetBrains Mono. All helpers are server-component safe
 * (no client hooks) so any admin page can import them directly.
 */

export const ACCENT = "#6ee7ff";

export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
export const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

/** Dark card surface. */
export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-white/10 bg-[#0e0e0e] ${className}`}>{children}</div>
  );
}

/** Clickable stat tile. Value is rendered in mono. */
export function StatCard({
  title,
  value,
  href,
  accent,
  hint,
}: {
  title: string;
  value: string;
  href: string;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border bg-[#0e0e0e] p-5 transition-colors ${
        accent ? "border-[#6ee7ff]/40 hover:border-[#6ee7ff]" : "border-white/10 hover:border-white/25"
      }`}
    >
      <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">{title}</div>
      <div
        className={`mt-2 text-2xl font-extrabold tabular-nums ${mono.className} ${
          accent ? "text-[#6ee7ff]" : "text-[#f4f4ef]"
        }`}
      >
        {value}
      </div>
      {hint ? <div className="mt-1 text-[10px] text-white/30">{hint}</div> : null}
    </Link>
  );
}

export type Tier = "Unlimited" | "One-time" | "Free";

/**
 * Score-product tier pill. `subStatus` lets us flag a lapsed/at-risk
 * subscriber (canceled / past_due) even though they're no longer "Unlimited".
 */
export function TierBadge({ tier, subStatus }: { tier: Tier; subStatus?: string | null }) {
  if (tier === "Unlimited") {
    return (
      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-[#6ee7ff]/15 text-[#6ee7ff] border border-[#6ee7ff]/30">
        Unlimited
      </span>
    );
  }
  if (tier === "One-time") {
    return (
      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-white/5 text-[#f4f4ef] border border-white/20">
        One-time
      </span>
    );
  }
  if (subStatus === "canceled" || subStatus === "past_due") {
    const warn = subStatus === "past_due";
    return (
      <span
        className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${
          warn
            ? "bg-[#ff6b6b]/10 text-[#ff6b6b] border-[#ff6b6b]/30"
            : "bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30"
        }`}
      >
        {subStatus === "past_due" ? "Past due" : "Canceled"}
      </span>
    );
  }
  return <span className="text-[10px] font-semibold uppercase tracking-wide text-white/30">Free</span>;
}

/** Sortable table header cell (presentational — caller supplies the link). */
export function SortHeader({
  label,
  href,
  active,
  dir,
  align = "right",
}: {
  label: string;
  href: string;
  active: boolean;
  dir: "asc" | "desc";
  align?: "left" | "right";
}) {
  return (
    <th className={`text-${align} font-medium px-3 py-2`}>
      <Link
        href={href}
        className={`inline-flex items-center gap-1 ${
          align === "right" ? "w-full justify-end" : ""
        } hover:text-[#6ee7ff] transition-colors select-none ${active ? "text-[#6ee7ff]" : ""}`}
      >
        {label}
        <span className="text-[9px] opacity-50">{active ? (dir === "desc" ? "▼" : "▲") : "⇅"}</span>
      </Link>
    </th>
  );
}

export function getRelativeTime(date: Date | null): string {
  if (!date) return "—";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}
