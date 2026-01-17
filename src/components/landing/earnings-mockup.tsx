"use client";

import { TrendingUp, Music, Share2, DollarSign } from "lucide-react";

const RECENT_EARNINGS = [
  { type: "sale", description: "Someone bought Midnight Drive", amount: 0.50, time: "2m ago" },
  { type: "commission", description: "Fan bought via your link", amount: 0.05, time: "15m ago" },
  { type: "review", description: "Review payment", amount: 1.00, time: "1h ago" },
  { type: "sale", description: "Someone bought Neon Dreams", amount: 0.50, time: "2h ago" },
  { type: "commission", description: "Fan bought via your link", amount: 0.05, time: "3h ago" },
];

export function EarningsMockup() {
  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-950">Earnings</h1>
        <p className="text-sm text-neutral-500">Track your music income</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-neutral-200">
          <div className="flex items-center gap-2 text-neutral-500 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">This Month</span>
          </div>
          <p className="text-2xl font-bold text-neutral-950">$127.50</p>
          <p className="text-xs text-lime-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />
            +23% from last month
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-neutral-200">
          <div className="flex items-center gap-2 text-neutral-500 mb-1">
            <Music className="w-4 h-4" />
            <span className="text-xs font-medium">Track Sales</span>
          </div>
          <p className="text-2xl font-bold text-neutral-950">$89.00</p>
          <p className="text-xs text-neutral-500 mt-1">178 sales</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-neutral-200">
          <div className="flex items-center gap-2 text-neutral-500 mb-1">
            <Share2 className="w-4 h-4" />
            <span className="text-xs font-medium">Share Commission</span>
          </div>
          <p className="text-2xl font-bold text-neutral-950">$38.50</p>
          <p className="text-xs text-neutral-500 mt-1">From tracks you shared</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <p className="font-semibold text-neutral-950 text-sm">Recent Activity</p>
        </div>
        <div className="divide-y divide-neutral-100">
          {RECENT_EARNINGS.map((item, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  item.type === "sale" ? "bg-lime-100 text-lime-700" :
                  item.type === "commission" ? "bg-blue-100 text-blue-700" :
                  "bg-orange-100 text-orange-700"
                }`}>
                  {item.type === "sale" ? <Music className="w-4 h-4" /> :
                   item.type === "commission" ? <Share2 className="w-4 h-4" /> :
                   <DollarSign className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm text-neutral-950">{item.description}</p>
                  <p className="text-xs text-neutral-400">{item.time}</p>
                </div>
              </div>
              <p className="font-semibold text-lime-700">+${item.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
