"use client";

import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Target,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Users,
  ArrowRight,
  ChevronRight,
  Gauge,
} from "lucide-react";

interface ReleaseDecisionReportViewProps {
  report: {
    generatedAt: string;
    verdict: {
      consensus: "RELEASE_NOW" | "FIX_FIRST" | "NEEDS_WORK";
      breakdown: { RELEASE_NOW: number; FIX_FIRST: number; NEEDS_WORK: number };
      confidence: "HIGH" | "MEDIUM" | "LOW";
    };
    readinessScore: {
      average: number;
      median: number;
      range: [number, number];
      distribution: number[];
    };
    qualityLevel: {
      consensus: string;
      breakdown: Record<string, number>;
    };
    topFixes: Array<{
      issue: string;
      mentionedBy: number;
      avgImpact: "HIGH" | "MEDIUM" | "LOW";
      avgTimeEstimate: number;
      variations: string[];
    }>;
    strengths: string[];
    risks: string[];
    competitiveBenchmarks: string[];
    aiAnalysis: {
      summary: string;
      technicalInsights: string;
      marketRecommendation: string;
      estimatedWorkRequired: string;
      prioritizedActionPlan: string[];
    };
    reviewCount: number;
  };
  trackTitle: string;
}

function ScoreGauge({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) {
  const radius = size === "lg" ? 80 : 40;
  const stroke = size === "lg" ? 10 : 6;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = radius + stroke;
  const viewBox = `0 0 ${(radius + stroke) * 2} ${radius + stroke + 4}`;

  const color =
    score >= 80 ? "#10b981" :
    score >= 60 ? "#8b5cf6" :
    score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <svg viewBox={viewBox} className={size === "lg" ? "w-52 h-28" : "w-24 h-14"}>
      <path
        d={`M ${stroke} ${center} A ${radius} ${radius} 0 0 1 ${radius * 2 + stroke} ${center}`}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d={`M ${stroke} ${center} A ${radius} ${radius} 0 0 1 ${radius * 2 + stroke} ${center}`}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${progress} ${circumference}`}
        className="transition-all duration-1000 ease-out"
      />
      <text
        x={center}
        y={center - (size === "lg" ? 8 : 2)}
        textAnchor="middle"
        className={cn(
          "font-black fill-current",
          size === "lg" ? "text-[36px]" : "text-[16px]"
        )}
        style={{ fill: color }}
      >
        {score}
      </text>
      <text
        x={center}
        y={center + (size === "lg" ? 16 : 8)}
        textAnchor="middle"
        className={cn(
          "fill-neutral-400",
          size === "lg" ? "text-[11px]" : "text-[7px]"
        )}
      >
        out of 100
      </text>
    </svg>
  );
}

function HorizontalBar({ value, max, color, label, count }: { value: number; max: number; color: string; label: string; count: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-neutral-500 w-20 text-right shrink-0">{label}</span>
      <div className="flex-1 h-7 bg-neutral-100 rounded-md overflow-hidden relative">
        <div
          className={cn("h-full rounded-md transition-all duration-700 ease-out", color)}
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
        <span className="absolute inset-0 flex items-center px-3 text-xs font-bold text-neutral-700">
          {count} reviewer{count !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

function ScoreDistributionChart({ distribution, reviewCount }: { distribution: number[]; reviewCount: number }) {
  const labels = ["0–20", "21–40", "41–60", "61–80", "81–100"];
  const maxVal = Math.max(...distribution, 1);

  return (
    <div className="flex items-end gap-1.5 h-24">
      {distribution.map((count, i) => {
        const heightPct = (count / maxVal) * 100;
        const colors = [
          "bg-red-400",
          "bg-orange-400",
          "bg-amber-400",
          "bg-purple-400",
          "bg-emerald-400",
        ];
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-neutral-500">{count}</span>
            <div className="w-full rounded-t-md bg-neutral-100 relative" style={{ height: "64px" }}>
              <div
                className={cn("absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-700 ease-out", colors[i])}
                style={{ height: `${Math.max(heightPct, 6)}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-neutral-400">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function MentionBar({ mentionedBy, total }: { mentionedBy: number; total: number }) {
  const pct = (mentionedBy / total) * 100;
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-neutral-400 shrink-0">{mentionedBy}/{total}</span>
    </div>
  );
}

export function ReleaseDecisionReportView({ report, trackTitle }: ReleaseDecisionReportViewProps) {
  const { verdict, readinessScore, topFixes, strengths, risks, competitiveBenchmarks, aiAnalysis } = report;

  const totalVotes = verdict.breakdown.RELEASE_NOW + verdict.breakdown.FIX_FIRST + verdict.breakdown.NEEDS_WORK;
  const totalFixTime = topFixes.reduce((sum, f) => sum + f.avgTimeEstimate, 0);

  const verdictConfig = {
    RELEASE_NOW: { label: "Release Now", icon: CheckCircle2, gradient: "from-emerald-500 to-emerald-600", ring: "ring-emerald-200", accent: "text-emerald-600", bg: "bg-emerald-50" },
    FIX_FIRST: { label: "Fix First", icon: AlertTriangle, gradient: "from-amber-500 to-orange-500", ring: "ring-amber-200", accent: "text-amber-600", bg: "bg-amber-50" },
    NEEDS_WORK: { label: "Needs Work", icon: XCircle, gradient: "from-red-500 to-red-600", ring: "ring-red-200", accent: "text-red-600", bg: "bg-red-50" },
  };

  const v = verdictConfig[verdict.consensus];
  const VerdictIcon = v.icon;

  const confidenceLabel = verdict.confidence === "HIGH" ? "Strong agreement" : verdict.confidence === "MEDIUM" ? "Moderate agreement" : "Mixed opinions";

  return (
    <div className="space-y-0">
      {/* ─── REPORT HEADER ─── */}
      <div className="bg-neutral-900 text-white rounded-t-2xl px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <Target className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">Release Decision Report</h2>
              <p className="text-xs text-white/50 font-mono">
                {new Date(report.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • {report.reviewCount} expert reviewers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-white/70">
            <Users className="h-3.5 w-3.5" />
            PRO Panel ({report.reviewCount})
          </div>
        </div>
      </div>

      {/* ─── VERDICT HERO ─── */}
      <div className={cn("bg-gradient-to-br text-white px-6 py-8 sm:px-8 sm:py-10", v.gradient)}>
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <div className="text-center sm:text-left flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-2">Expert Consensus</p>
            <div className="flex items-center gap-3 justify-center sm:justify-start mb-3">
              <VerdictIcon className="h-9 w-9 text-white drop-shadow-md" />
              <h3 className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow">{v.label}</h3>
            </div>
            <p className="text-sm text-white/80 font-medium">{confidenceLabel} among {report.reviewCount} reviewers</p>
          </div>

          {/* Donut-style vote breakdown */}
          <div className="flex items-center gap-4 bg-black/15 backdrop-blur rounded-2xl px-5 py-4 border border-white/10">
            {[
              { key: "RELEASE_NOW", count: verdict.breakdown.RELEASE_NOW, label: "Release", color: "bg-emerald-400" },
              { key: "FIX_FIRST", count: verdict.breakdown.FIX_FIRST, label: "Fix First", color: "bg-amber-300" },
              { key: "NEEDS_WORK", count: verdict.breakdown.NEEDS_WORK, label: "Rework", color: "bg-red-400" },
            ].map((item) => (
              <div key={item.key} className="text-center min-w-[56px]">
                <div className={cn("mx-auto w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-white", item.color, "shadow-lg")}>
                  {item.count}
                </div>
                <p className="text-[10px] font-semibold text-white/60 mt-1.5 uppercase tracking-wider">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── KEY METRICS ROW ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-neutral-200 bg-white">
        {[
          { label: "Readiness", value: `${readinessScore.average}`, suffix: "/100", icon: Gauge },
          { label: "Median Score", value: `${readinessScore.median}`, suffix: "/100", icon: BarChart3 },
          { label: "Score Range", value: `${readinessScore.range[0]}–${readinessScore.range[1]}`, suffix: "", icon: TrendingUp },
          { label: "Fix Time", value: totalFixTime > 0 ? `~${totalFixTime}` : "—", suffix: totalFixTime > 0 ? " min" : "", icon: Clock },
        ].map((metric, i) => (
          <div key={i} className={cn("px-4 py-5 sm:px-6 text-center border-r border-neutral-100 last:border-r-0", i < 2 ? "border-b sm:border-b-0 border-neutral-100" : "")}>
            <metric.icon className="h-4 w-4 mx-auto text-neutral-300 mb-2" />
            <p className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight leading-none">
              {metric.value}<span className="text-sm font-bold text-neutral-400">{metric.suffix}</span>
            </p>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mt-1">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* ─── ANALYTICS SECTION ─── */}
      <div className="bg-white border-b border-neutral-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-100">
          {/* Score Gauge */}
          <div className="px-6 py-8 sm:px-8 flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-5">Release Readiness</p>
            <ScoreGauge score={readinessScore.average} />
            <div className="mt-4 w-full max-w-xs">
              <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                <span>0</span>
                <span>Not Ready</span>
                <span>Almost</span>
                <span>Ready</span>
                <span>100</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden flex">
                <div className="flex-1 bg-red-200" />
                <div className="flex-1 bg-amber-200" />
                <div className="flex-1 bg-purple-200" />
                <div className="flex-1 bg-emerald-200" />
              </div>
              <div className="relative h-3 mt-0.5">
                <div
                  className="absolute w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-neutral-800 -translate-x-1/2"
                  style={{ left: `${readinessScore.average}%` }}
                />
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="px-6 py-8 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-5">Score Distribution</p>
            <ScoreDistributionChart distribution={readinessScore.distribution} reviewCount={report.reviewCount} />
            <p className="text-[10px] text-neutral-400 mt-3 text-center">
              How {report.reviewCount} reviewers scored release readiness
            </p>
          </div>
        </div>
      </div>

      {/* Vote Breakdown Bar */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-6 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-4">Verdict Breakdown</p>
        <div className="space-y-2.5">
          <HorizontalBar value={verdict.breakdown.RELEASE_NOW} max={totalVotes} color="bg-emerald-400" label="Release" count={verdict.breakdown.RELEASE_NOW} />
          <HorizontalBar value={verdict.breakdown.FIX_FIRST} max={totalVotes} color="bg-amber-400" label="Fix First" count={verdict.breakdown.FIX_FIRST} />
          <HorizontalBar value={verdict.breakdown.NEEDS_WORK} max={totalVotes} color="bg-red-400" label="Needs Work" count={verdict.breakdown.NEEDS_WORK} />
        </div>
      </div>

      {/* ─── TOP FIXES ─── */}
      {topFixes.length > 0 && (
        <div className="bg-white border-b border-neutral-200 px-6 py-8 sm:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">Priority Fixes</h3>
                <p className="text-xs text-neutral-400">Ranked by reviewer consensus & impact</p>
              </div>
            </div>
            {totalFixTime > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 rounded-full text-xs font-semibold text-neutral-500">
                <Clock className="h-3 w-3" />
                Total: ~{totalFixTime} min
              </div>
            )}
          </div>

          <div className="space-y-3">
            {topFixes.map((fix, i) => {
              const impactColors = {
                HIGH: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" },
                MEDIUM: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
                LOW: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
              };
              const ic = impactColors[fix.avgImpact];

              return (
                <div key={i} className={cn("rounded-xl border p-4 sm:p-5 transition-colors", ic.border, ic.bg)}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white shadow-sm",
                      i === 0 ? "bg-red-500" : i === 1 ? "bg-amber-500" : "bg-neutral-400"
                    )}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full", ic.badge)}>
                          {fix.avgImpact} impact
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> ~{fix.avgTimeEstimate} min
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-neutral-800 leading-relaxed">{fix.issue}</p>
                      <MentionBar mentionedBy={fix.mentionedBy} total={report.reviewCount} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── STRENGTHS & RISKS GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 bg-white border-b border-neutral-200">
        {/* Strengths */}
        <div className="px-6 py-8 sm:px-8">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Strengths</h3>
              <p className="text-xs text-neutral-400">{strengths.length} identified by panel</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {strengths.slice(0, 6).map((strength, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-neutral-700 leading-relaxed">{strength}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risks */}
        <div className="px-6 py-8 sm:px-8">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
              <Shield className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Risks if Released Now</h3>
              <p className="text-xs text-neutral-400">{risks.length} flagged by panel</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {risks.slice(0, 6).map((risk, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50/60 border border-red-100">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-neutral-700 leading-relaxed">{risk}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── COMPETITIVE BENCHMARKS ─── */}
      {competitiveBenchmarks.length > 0 && (
        <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-8 sm:px-8">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Competitive Benchmarks</h3>
              <p className="text-xs text-neutral-400">How reviewers compared your track</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {competitiveBenchmarks.slice(0, 6).map((benchmark, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3.5 rounded-lg bg-white border border-neutral-200">
                <ChevronRight className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-neutral-700 leading-relaxed">{benchmark}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── EXECUTIVE SUMMARY ─── */}
      <div className="bg-white border-b border-neutral-200 px-6 py-8 sm:px-8">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-8 w-8 rounded-lg bg-neutral-900 flex items-center justify-center">
            <Target className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">Executive Summary</h3>
            <p className="text-xs text-neutral-400">Analysis & recommended next steps</p>
          </div>
        </div>

        <div className="bg-neutral-50 rounded-xl p-5 sm:p-6 border border-neutral-200 space-y-5">
          <p className="text-sm text-neutral-700 leading-relaxed">{aiAnalysis.summary}</p>

          {aiAnalysis.technicalInsights && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-1.5">Technical Insights</p>
              <p className="text-sm text-neutral-700 leading-relaxed">{aiAnalysis.technicalInsights}</p>
            </div>
          )}

          {aiAnalysis.marketRecommendation && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-1.5">Market Positioning</p>
              <p className="text-sm text-neutral-700 leading-relaxed">{aiAnalysis.marketRecommendation}</p>
            </div>
          )}

          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-0.5">Estimated Work</p>
              <p className="text-sm font-semibold text-neutral-800">{aiAnalysis.estimatedWorkRequired}</p>
            </div>
            {verdict.confidence === "HIGH" && (
              <div className="px-3 py-1 rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                High Confidence
              </div>
            )}
          </div>
        </div>

        {/* Action Plan */}
        {aiAnalysis.prioritizedActionPlan.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 mb-3">Recommended Action Plan</p>
            <div className="space-y-2">
              {aiAnalysis.prioritizedActionPlan.map((action, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors">
                  <span className="flex-shrink-0 w-6 h-6 rounded-md bg-neutral-900 text-white flex items-center justify-center text-[11px] font-black">
                    {i + 1}
                  </span>
                  <p className="text-sm text-neutral-700 leading-relaxed pt-0.5">{action}</p>
                  <ArrowRight className="h-4 w-4 text-neutral-300 flex-shrink-0 mt-0.5 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <div className="bg-neutral-900 text-white rounded-b-2xl px-6 py-4 sm:px-8">
        <div className="flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3" />
            <span className="font-semibold">MixReflect</span>
            <span>•</span>
            <span>Release Decision Report</span>
          </div>
          <span className="font-mono">{report.reviewCount} PRO reviewers</span>
        </div>
      </div>
    </div>
  );
}
