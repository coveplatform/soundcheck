import Link from "next/link";
import { ArrowLeft, Target, Zap, CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReleaseDecisionForm } from "@/app/(dashboard)/reviewer/review/[id]/components/release-decision-form";

export const dynamic = "force-dynamic";

export default async function ReleaseDecisionDemoPage() {
  // Auth handled by admin layout

  // Mock data for demo
  const mockFormData = {
    releaseVerdict: null,
    releaseReadinessScore: 75,
    qualityLevel: null,
    topFixRank1: "",
    topFixRank1Impact: null,
    topFixRank1TimeMin: 30,
    topFixRank2: "",
    topFixRank2Impact: null,
    topFixRank2TimeMin: 60,
    topFixRank3: "",
    topFixRank3Impact: null,
    topFixRank3TimeMin: 15,
    strongestElement: "",
    biggestRisk: "",
    competitiveBenchmark: "",
  };

  const handleDemoSubmit = (data: any) => {
    console.log("Demo submission:", data);
  };

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        {/* Header */}
        <div className="mb-8 pb-6 border-b border-black/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">Release Decision Demo</h1>
              <p className="text-sm text-neutral-600">Preview the full Release Decision experience</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Artist View */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-black mb-1 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Artist Experience
              </h2>
              <p className="text-sm text-neutral-600 mb-4">What artists see when they choose Release Decision</p>
            </div>

            {/* Dashboard Banner Preview */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2 uppercase tracking-wider">Dashboard Banner</h3>
              <Link
                href="/submit"
                className="relative block group overflow-visible"
              >
                <div className="rounded-2xl border-2 border-black bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 px-6 py-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150 ease-out">

                  <div className="absolute -top-2 -right-2 bg-black border-2 border-white text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg animate-pulse">
                    NEW ✨
                  </div>

                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-300 rounded-full blur-xl opacity-60 animate-pulse"></div>
                  <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-pink-300 rounded-full blur-xl opacity-50"></div>

                  <div className="flex items-center gap-4 relative z-10">
                    <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Target className="h-7 w-7 text-white drop-shadow-md" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-xl font-black text-white drop-shadow-md tracking-tight">Release Decision</h3>
                        <Zap className="h-5 w-5 text-yellow-300 drop-shadow-md animate-pulse" />
                      </div>
                      <p className="text-sm text-white/95 leading-snug font-medium drop-shadow">
                        <strong className="text-white font-bold">Should you release this track?</strong> Expert panel + AI analysis for <span className="inline-flex items-center px-2 py-0.5 bg-white/20 rounded-md font-black text-yellow-300 border border-white/30">$9.95</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Submit Page Card Preview */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2 uppercase tracking-wider">Submit Page Card</h3>
              <div className="rounded-2xl border-2 p-6 border-purple-600 bg-purple-50/60 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-purple-600">
                    <Target className="h-5 w-5 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-black">Release Decision</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                        RECOMMENDED
                      </span>
                    </div>

                    <p className="text-sm text-neutral-600 mb-3">
                      Should I release this track? Get a professional verdict with actionable fixes.
                    </p>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <span>Clear Go/No-Go verdict from expert panel</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <span>Release readiness score (0-100)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <span>Top 3 fixes ranked by impact & time estimate</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <span><strong>AI-powered technical analysis report</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-purple-600">$9.95</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Track Upsell Preview */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2 uppercase tracking-wider">Track Page Upsell</h3>
              <div className="relative overflow-visible">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-2xl blur opacity-30"></div>

                <div className="relative rounded-2xl border-2 border-black bg-gradient-to-br from-purple-500 to-purple-600 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-400/20 rounded-full blur-2xl"></div>

                  <div className="absolute top-0 right-0 bg-black border-l-2 border-b-2 border-white text-white text-[9px] font-black px-3 py-1.5 rounded-bl-xl tracking-widest shadow-lg">
                    ⚡ UPGRADE
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Target className="h-6 w-6 text-white drop-shadow-md" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-white drop-shadow-md mb-1 tracking-tight">
                          Release Decision
                        </h3>
                        <p className="text-xs text-white/95 leading-snug font-medium drop-shadow">
                          Should you release this? Expert verdict + AI analysis
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <span className="text-3xl font-black text-yellow-300 drop-shadow-md">$9.95</span>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Delivery</div>
                        <div className="text-sm font-black text-white drop-shadow">48 hours</div>
                      </div>
                    </div>

                    <Button
                      disabled
                      className="w-full bg-white text-purple-600 font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-sm h-11"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade to Release Decision
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Reviewer Form */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-black mb-1 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Reviewer Experience
              </h2>
              <p className="text-sm text-neutral-600 mb-4">The form PRO reviewers fill out (scrollable demo)</p>
            </div>

            <Card variant="soft" elevated className="sticky top-6">
              <CardContent className="pt-6">
                <div className="mb-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <p className="text-sm font-semibold text-purple-900">
                    <strong>Note:</strong> This is a preview. Form submissions won't be saved.
                  </p>
                </div>

                <div className="max-h-[calc(100vh-16rem)] overflow-y-auto pr-2 -mr-2">
                  <ReleaseDecisionForm
                    onSubmit={handleDemoSubmit}
                    listenTime={200}
                    minListenTime={180}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
