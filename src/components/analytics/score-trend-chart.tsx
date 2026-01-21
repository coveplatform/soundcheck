"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface TrendDataPoint {
  month: string;
  production: number;
  vocals: number;
  originality: number;
  overall: number;
}

interface ScoreTrendChartProps {
  data: TrendDataPoint[];
}

type MetricKey = "overall" | "production" | "vocals" | "originality";

interface Metric {
  key: MetricKey;
  label: string;
  color: string;
  strokeColor: string;
}

const metrics: Metric[] = [
  { key: "overall", label: "Overall", color: "bg-black", strokeColor: "#000" },
  { key: "production", label: "Production", color: "bg-lime-500", strokeColor: "#84cc16" },
  { key: "originality", label: "Originality", color: "bg-purple-500", strokeColor: "#a855f7" },
  { key: "vocals", label: "Vocals", color: "bg-blue-500", strokeColor: "#3b82f6" },
];

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const [activeMetrics, setActiveMetrics] = useState<Set<MetricKey>>(
    new Set(["overall"])
  );

  const toggleMetric = (key: MetricKey) => {
    const newSet = new Set(activeMetrics);
    if (newSet.has(key)) {
      // Don't allow deselecting all
      if (newSet.size > 1) {
        newSet.delete(key);
      }
    } else {
      newSet.add(key);
    }
    setActiveMetrics(newSet);
  };

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-black/40">
        <p className="text-sm">Not enough data to show trends yet</p>
      </div>
    );
  }

  if (data.length === 1) {
    return (
      <div className="h-64 flex items-center justify-center text-black/40">
        <div className="text-center">
          <p className="text-sm mb-2">Need at least 2 data points to show trends</p>
          <p className="text-xs">Submit more tracks over time to see your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            onClick={() => toggleMetric(metric.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all",
              activeMetrics.has(metric.key)
                ? "border-black bg-white text-black"
                : "border-black/10 bg-black/5 text-black/40 hover:border-black/20"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", metric.color)} />
              {metric.label}
            </div>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="month"
              stroke="#a3a3a3"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              domain={[0, 5]}
              stroke="#a3a3a3"
              style={{ fontSize: "12px" }}
              ticks={[0, 1, 2, 3, 4, 5]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "2px solid #000",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value) => {
                const numericValue =
                  typeof value === "number"
                    ? value
                    : typeof value === "string"
                      ? Number(value)
                      : 0

                const safeValue = Number.isFinite(numericValue) ? numericValue : 0

                return safeValue.toFixed(2)
              }}
            />
            {activeMetrics.has("overall") && (
              <Line
                type="monotone"
                dataKey="overall"
                stroke="#000"
                strokeWidth={3}
                dot={{ fill: "#000", r: 4 }}
                name="Overall"
              />
            )}
            {activeMetrics.has("production") && (
              <Line
                type="monotone"
                dataKey="production"
                stroke="#84cc16"
                strokeWidth={2}
                dot={{ fill: "#84cc16", r: 3 }}
                name="Production"
              />
            )}
            {activeMetrics.has("originality") && (
              <Line
                type="monotone"
                dataKey="originality"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ fill: "#a855f7", r: 3 }}
                name="Originality"
              />
            )}
            {activeMetrics.has("vocals") && (
              <Line
                type="monotone"
                dataKey="vocals"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 3 }}
                name="Vocals"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data summary */}
      <div className="text-xs text-black/50 text-center">
        Showing {data.length} data point{data.length === 1 ? "" : "s"} ·
        {data.length > 1 && ` ${data[0].month} to ${data[data.length - 1].month}`}
      </div>
    </div>
  );
}
