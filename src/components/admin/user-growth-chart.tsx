"use client";

import { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface GrowthPoint {
  period: string;
  newUsers: number;
  total: number;
}

interface Props {
  weekly: GrowthPoint[];
  monthly: GrowthPoint[];
}

export function UserGrowthChart({ weekly, monthly }: Props) {
  const [view, setView] = useState<"weekly" | "monthly">("monthly");
  const data = view === "weekly" ? weekly : monthly;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0e0e0e] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#f4f4ef] lowercase">user growth</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setView("weekly")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              view === "weekly"
                ? "bg-[#6ee7ff] text-black border-[#6ee7ff]"
                : "bg-white/5 text-white/50 border-white/15 hover:border-white/30"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setView("monthly")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              view === "monthly"
                ? "bg-[#6ee7ff] text-black border-[#6ee7ff]"
                : "bg-white/5 text-white/50 border-white/15 hover:border-white/30"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="p-5">
        {data.length < 2 ? (
          <div className="h-52 flex items-center justify-center text-white/30 text-sm">
            Not enough data to display
          </div>
        ) : (
          <div className="h-52 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="period"
                  stroke="rgba(255,255,255,0.2)"
                  style={{ fontSize: "11px" }}
                  tick={{ fill: "rgba(255,255,255,0.45)" }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="rgba(255,255,255,0.2)"
                  style={{ fontSize: "11px" }}
                  tick={{ fill: "rgba(255,255,255,0.45)" }}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="rgba(255,255,255,0.2)"
                  style={{ fontSize: "11px" }}
                  tick={{ fill: "rgba(255,255,255,0.45)" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#141414",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#f4f4ef",
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [
                    value ?? 0,
                    name === "newUsers" ? "New signups" : "Total users",
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === "newUsers" ? "New signups" : "Total users"
                  }
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="newUsers"
                  fill="#6ee7ff"
                  fillOpacity={0.65}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={40}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="total"
                  stroke="#f4f4ef"
                  strokeWidth={2}
                  dot={{ fill: "#f4f4ef", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
