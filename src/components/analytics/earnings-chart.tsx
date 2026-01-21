"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { cn } from "@/lib/utils";

interface EarningsDataPoint {
  month: string;
  earnings: number;
  trackCount: number;
}

interface EarningsChartProps {
  data: EarningsDataPoint[];
}

type ChartType = "bar" | "line";

export function EarningsChart({ data }: EarningsChartProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-black/40">
        <div className="text-center">
          <p className="text-sm mb-1">No earnings data yet</p>
          <p className="text-xs">Earnings will show when tracks are purchased</p>
        </div>
      </div>
    );
  }

  const totalEarnings = data.reduce((sum, d) => sum + d.earnings, 0);
  const avgPerMonth = totalEarnings / data.length;

  return (
    <div className="space-y-4">
      {/* Chart type toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Revenue Over Time</p>
          <p className="text-xs text-black/50">
            ${totalEarnings.toFixed(2)} total · ${avgPerMonth.toFixed(2)} avg/month
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-white rounded-lg border-2 border-black/10">
          <button
            onClick={() => setChartType("bar")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded transition-all",
              chartType === "bar"
                ? "bg-black text-white"
                : "text-black/60 hover:text-black"
            )}
          >
            Bars
          </button>
          <button
            onClick={() => setChartType("line")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded transition-all",
              chartType === "line"
                ? "bg-black text-white"
                : "text-black/60 hover:text-black"
            )}
          >
            Line
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#a3a3a3"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#a3a3a3"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "2px solid #000",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Earnings"]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar
                dataKey="earnings"
                fill="#84cc16"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis
                dataKey="month"
                stroke="#a3a3a3"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#a3a3a3"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "2px solid #000",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Earnings"]}
              />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#84cc16"
                strokeWidth={3}
                dot={{ fill: "#84cc16", r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-3 border-2 border-black/5">
          <p className="text-xs text-black/40 uppercase font-mono">Best Month</p>
          <p className="text-lg font-black">
            ${Math.max(...data.map(d => d.earnings)).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 border-2 border-black/5">
          <p className="text-xs text-black/40 uppercase font-mono">Total Tracks</p>
          <p className="text-lg font-black">
            {data.reduce((sum, d) => sum + d.trackCount, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 border-2 border-black/5">
          <p className="text-xs text-black/40 uppercase font-mono">Avg/Track</p>
          <p className="text-lg font-black">
            ${(totalEarnings / Math.max(data.reduce((sum, d) => sum + d.trackCount, 0), 1)).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
