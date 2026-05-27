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
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-950">User Growth</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setView("weekly")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              view === "weekly"
                ? "bg-neutral-950 text-white border-neutral-950"
                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setView("monthly")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              view === "monthly"
                ? "bg-neutral-950 text-white border-neutral-950"
                : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="p-5">
        {data.length < 2 ? (
          <div className="h-52 flex items-center justify-center text-neutral-400 text-sm">
            Not enough data to display
          </div>
        ) : (
          <div className="h-52 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="period"
                  stroke="#a3a3a3"
                  style={{ fontSize: "11px" }}
                  tick={{ fill: "#737373" }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#a3a3a3"
                  style={{ fontSize: "11px" }}
                  tick={{ fill: "#737373" }}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#a3a3a3"
                  style={{ fontSize: "11px" }}
                  tick={{ fill: "#737373" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1.5px solid #e5e5e5",
                    borderRadius: "8px",
                    fontSize: "12px",
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
                  fill="#a855f7"
                  fillOpacity={0.75}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={40}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="total"
                  stroke="#171717"
                  strokeWidth={2}
                  dot={{ fill: "#171717", r: 3 }}
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
