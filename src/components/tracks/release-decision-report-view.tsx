"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Target,
  Clock,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export function ReleaseDecisionReportView({ report, trackTitle }: ReleaseDecisionReportViewProps) {
  const { verdict, readinessScore, topFixes, strengths, risks, aiAnalysis } = report;

  const verdictConfig = {
    RELEASE_NOW: {
      label: "Release Now",
      icon: CheckCircle2,
      color: "emerald",
      bgClass: "bg-emerald-500",
      textClass: "text-emerald-700",
      borderClass: "border-emerald-300",
      bgLightClass: "bg-emerald-50",
    },
    FIX_FIRST: {
      label: "Fix First",
      icon: AlertTriangle,
      color: "amber",
      bgClass: "bg-amber-500",
      textClass: "text-amber-700",
      borderClass: "border-amber-300",
      bgLightClass: "bg-amber-50",
    },
    NEEDS_WORK: {
      label: "Needs Work",
      icon: XCircle,
      color: "red",
      bgClass: "bg-red-500",
      textClass: "text-red-700",
      borderClass: "border-red-300",
      bgLightClass: "bg-red-50",
    },
  };

  const v = verdictConfig[verdict.consensus];
  const VerdictIcon = v.icon;

  const impactColor = (impact: string) => {
    if (impact === "HIGH") return "text-red-600 bg-red-50 border-red-200";
    if (impact === "MEDIUM") return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-emerald-600 bg-emerald-50 border-emerald-200";
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Target className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black">Release Decision Report</h2>
          <p className="text-xs text-black/50">
            Generated {new Date(report.generatedAt).toLocaleDateString()} from {report.reviewCount} expert reviewers
          </p>
        </div>
      </div>

      {/* Verdict Card */}
      <Card className={cn("border-2 overflow-hidden", v.borderClass)}>
        <div className={cn("px-6 py-5", v.bgClass)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <VerdictIcon className="h-8 w-8 text-white" />
              <div>
                <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Expert Consensus</p>
                <p className="text-2xl font-black text-white">{v.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Confidence</p>
              <p className="text-lg font-black text-white">{verdict.confidence}</p>
            </div>
          </div>
        </div>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-2xl font-black text-emerald-700">{verdict.breakdown.RELEASE_NOW}</p>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Release</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-2xl font-black text-amber-700">{verdict.breakdown.FIX_FIRST}</p>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Fix First</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-2xl font-black text-red-700">{verdict.breakdown.NEEDS_WORK}</p>
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Needs Work</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Readiness Score */}
      <Card variant="soft" elevated>
        <CardContent className="pt-6 text-center">
          <p className="text-xs font-mono tracking-widest uppercase text-black/40 mb-3">Release Readiness Score</p>
          <p className="text-6xl font-black text-purple-600 leading-none">{readinessScore.average}</p>
          <p className="text-sm text-black/50 mt-1">out of 100</p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div>
              <span className="text-black/50">Median: </span>
              <span className="font-bold">{readinessScore.median}</span>
            </div>
            <div>
              <span className="text-black/50">Range: </span>
              <span className="font-bold">{readinessScore.range[0]}–{readinessScore.range[1]}</span>
            </div>
          </div>
          {/* Score bar */}
          <div className="mt-4 h-3 bg-black/10 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                readinessScore.average >= 70 ? "bg-emerald-500" :
                readinessScore.average >= 40 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${readinessScore.average}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Fixes */}
      {topFixes.length > 0 && (
        <Card variant="soft" elevated>
          <CardHeader className="border-b border-black/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Top Fixes (Ranked by Impact)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {topFixes.map((fix, i) => (
              <div
                key={i}
                className={cn(
                  "p-4 rounded-xl border-2",
                  i === 0 ? "border-red-200 bg-red-50/50" :
                  i === 1 ? "border-amber-200 bg-amber-50/50" :
                  "border-neutral-200 bg-neutral-50/50"
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-black text-white",
                      i === 0 ? "bg-red-500" : i === 1 ? "bg-amber-500" : "bg-neutral-400"
                    )}>
                      {i + 1}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border",
                      impactColor(fix.avgImpact)
                    )}>
                      {fix.avgImpact} impact
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-black/50">
                    <Clock className="h-3 w-3" />
                    ~{fix.avgTimeEstimate} min
                  </div>
                </div>
                <p className="text-sm font-medium text-black leading-relaxed">{fix.issue}</p>
                <p className="text-xs text-black/40 mt-2">
                  Mentioned by {fix.mentionedBy}/{report.reviewCount} reviewers
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <Card variant="soft" elevated>
          <CardHeader className="border-b border-black/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-3">
            {strengths.map((strength, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-black/80">{strength}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Risks */}
      {risks.length > 0 && (
        <Card variant="soft" elevated>
          <CardHeader className="border-b border-black/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Risks if Released Now
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-3">
            {risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-50/50 border border-red-200/50">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-black/80">{risk}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card variant="soft" elevated className="border-2 border-purple-200">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-base font-bold text-purple-900">📊 Summary</h3>
          <p className="text-sm text-black/70 leading-relaxed">{aiAnalysis.summary}</p>
          {aiAnalysis.technicalInsights && (
            <p className="text-sm text-black/70 leading-relaxed">{aiAnalysis.technicalInsights}</p>
          )}
          <div className="pt-3 border-t border-purple-200/50">
            <p className="text-xs text-black/50">
              <strong>Estimated work required:</strong> {aiAnalysis.estimatedWorkRequired}
            </p>
          </div>
          {aiAnalysis.prioritizedActionPlan.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Action Plan</p>
              {aiAnalysis.prioritizedActionPlan.map((action, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-black/70">{action}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center pt-2">
        <p className="text-xs text-black/40">
          MixReflect • Release Decision Report • {report.reviewCount} expert reviewers
        </p>
      </div>
    </div>
  );
}
