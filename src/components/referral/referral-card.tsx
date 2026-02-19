"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Coins, Users } from "lucide-react";

interface ReferralStats {
  code: string | null;
  totalReferrals: number;
  pendingReferrals: number;
  pendingUsers: Array<{ email: string; createdAt: string }>;
  rewardsEarned: number;
  hasPendingCoupon: boolean;
}

export function ReferralCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  async function fetchReferralStats() {
    try {
      const res = await fetch("/api/referral/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch referral stats:", error);
    } finally {
      setLoading(false);
    }
  }

  function copyReferralLink() {
    if (!stats?.code) return;
    const link = `${window.location.origin}/?ref=${stats.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/8 bg-white/60 p-4">
        <div className="h-24 animate-pulse bg-neutral-100 rounded-xl" />
      </div>
    );
  }

  if (!stats?.code) return null;

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${stats.code}`;
  const creditsEarned = stats.totalReferrals * 2;

  return (
    <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50/80 to-white p-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
          <Coins className="w-4 h-4 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-black">Invite a producer, get 2 free reviews</h3>
          <p className="text-xs text-black/50 mt-0.5">
            They get 2 free reviews too. Both of you, instantly.
          </p>
        </div>
      </div>

      {/* Copy link */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-1 px-3 py-2 text-xs border border-black/10 rounded-lg bg-white font-mono text-black/60 min-w-0"
          onClick={(e) => e.currentTarget.select()}
        />
        <button
          onClick={copyReferralLink}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors flex items-center gap-1.5 font-semibold text-xs flex-shrink-0"
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5" /> Copied</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copy</>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-black/8">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-black/30" />
          <span className="text-sm font-bold text-black tabular-nums">{stats.totalReferrals}</span>
          <span className="text-xs text-black/40">referred</span>
        </div>
        {stats.pendingReferrals > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span className="text-sm font-bold text-amber-700 tabular-nums">{stats.pendingReferrals}</span>
            <span className="text-xs text-black/40">pending</span>
          </div>
        )}
        {creditsEarned > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Coins className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-sm font-bold text-purple-600 tabular-nums">+{creditsEarned}</span>
            <span className="text-xs text-black/40">earned</span>
          </div>
        )}
      </div>

      {stats.pendingReferrals > 0 && (
        <p className="text-[11px] text-black/35 mt-2">
          You&apos;ll get 2 credits when each pending friend makes their first purchase.
        </p>
      )}
    </div>
  );
}
