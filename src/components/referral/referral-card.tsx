"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Gift } from "lucide-react";

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

    const appUrl = window.location.origin;
    const link = `${appUrl}/?ref=${stats.code}`;

    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="h-32 animate-pulse bg-neutral-100 rounded" />
      </div>
    );
  }

  if (!stats?.code) return null;

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${appUrl}/?ref=${stats.code}`;

  return (
    <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-100">
          <Gift className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-neutral-900">Invite Friends, Get $5 Off</h3>
          <p className="text-sm text-neutral-600 mt-1">
            You both get $5 off when they make their first purchase
          </p>
        </div>
      </div>

      {stats.hasPendingCoupon && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm font-medium text-green-800">
            🎉 You have a $5 discount ready! It'll be applied at checkout automatically.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-neutral-700 mb-1 block">
            Your Referral Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white font-mono"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={copyReferralLink}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-4 pt-3 border-t border-neutral-200">
          <div>
            <div className="text-2xl font-bold text-neutral-900">{stats.totalReferrals}</div>
            <div className="text-xs text-neutral-600">Converted</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{stats.pendingReferrals}</div>
            <div className="text-xs text-neutral-600">Pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-900">
              ${(stats.rewardsEarned / 100).toFixed(0)}
            </div>
            <div className="text-xs text-neutral-600">Earned</div>
          </div>
        </div>

        {stats.pendingUsers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-neutral-200">
            <div className="text-xs font-medium text-neutral-700 mb-2">Pending sign-ups:</div>
            <div className="space-y-1">
              {stats.pendingUsers.map((user) => (
                <div key={user.email} className="text-xs text-neutral-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  {user.email}
                  <span className="text-neutral-400">
                    (signed up {new Date(user.createdAt).toLocaleDateString()})
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-2 italic">
              💡 You'll earn $5 when they make their first purchase
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
