import Link from "next/link";
import { ArrowLeft, Target, TrendingUp, CheckCircle2, AlertTriangle, Sparkles, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { generateReleaseDecisionReport } from "@/lib/release-decision-report";

export const dynamic = "force-dynamic";

// Generate mock review data
const mockReviews = [
  {
    id: "review-1",
    releaseVerdict: "FIX_FIRST" as const,
    releaseReadinessScore: 72,
    topFixRank1: "Vocal sits too loud in the mix, especially during the chorus. Needs to be pulled back 2-3dB",
    topFixRank1Impact: "HIGH" as const,
    topFixRank1TimeMin: 15,
    topFixRank2: "Low end is muddy - kick and bass fighting for space around 80-120Hz",
    topFixRank2Impact: "HIGH" as const,
    topFixRank2TimeMin: 30,
    topFixRank3: "Hi-hats are too bright and harsh, especially on headphones",
    topFixRank3Impact: "MEDIUM" as const,
    topFixRank3TimeMin: 10,
    strongestElement: "The melody is incredibly catchy and the song structure keeps you engaged throughout. Hook is radio-ready.",
    biggestRisk: "Mix balance issues could make it sound amateur compared to commercial releases in this genre",
    competitiveBenchmark: "The Weekend - Blinding Lights (similar vibe but needs better vocal production)",
    ReviewerProfile: { id: "reviewer-1" },
  },
  {
    id: "review-2",
    releaseVerdict: "FIX_FIRST" as const,
    releaseReadinessScore: 78,
    topFixRank1: "Vocals need de-essing around 6-8kHz - sibilance is piercing",
    topFixRank1Impact: "MEDIUM" as const,
    topFixRank1TimeMin: 10,
    topFixRank2: "Bass is too quiet, needs +3dB to compete with reference tracks",
    topFixRank2Impact: "HIGH" as const,
    topFixRank2TimeMin: 20,
    topFixRank3: "Snare lacks punch - needs more presence around 200Hz",
    topFixRank3Impact: "MEDIUM" as const,
    topFixRank3TimeMin: 15,
    strongestElement: "Production quality is almost there - arrangement and sound selection are professional",
    biggestRisk: "If vocals aren't fixed, listeners will bounce within 30 seconds",
    competitiveBenchmark: "Dua Lipa - Levitating (target this energy and polish)",
    ReviewerProfile: { id: "reviewer-2" },
  },
  {
    id: "review-3",
    releaseVerdict: "RELEASE_NOW" as const,
    releaseReadinessScore: 88,
    topFixRank1: "Could benefit from slight vocal compression in the verses for consistency",
    topFixRank1Impact: "LOW" as const,
    topFixRank1TimeMin: 10,
    topFixRank2: "Stereo width could be slightly wider on the synths",
    topFixRank2Impact: "LOW" as const,
    topFixRank2TimeMin: 15,
    topFixRank3: "Add subtle automation on the vocal reverb during the bridge",
    topFixRank3Impact: "LOW" as const,
    topFixRank3TimeMin: 20,
    strongestElement: "Mix is clean, professional, and competitive with major label releases. Song is a banger.",
    biggestRisk: "None - this is release ready. Maybe wait for the right moment to drop it strategically",
    competitiveBenchmark: "Charlie Puth - Light Switch (comparable production quality)",
    ReviewerProfile: { id: "reviewer-3" },
  },
  {
    id: "review-4",
    releaseVerdict: "FIX_FIRST" as const,
    releaseReadinessScore: 75,
    topFixRank1: "Vocal too loud in the mix by about 2dB - overpowering the instrumental",
    topFixRank1Impact: "HIGH" as const,
    topFixRank1TimeMin: 10,
    topFixRank2: "Low end lacks clarity - mud in the 100-150Hz range",
    topFixRank2Impact: "HIGH" as const,
    topFixRank2TimeMin: 25,
    topFixRank3: "Cymbals and hi-hats too bright, fatiguing after 2 minutes",
    topFixRank3Impact: "MEDIUM" as const,
    topFixRank3TimeMin: 15,
    strongestElement: "Songwriting is top tier. Chord progression and melody are memorable and emotional.",
    biggestRisk: "Mix issues will prevent playlist adds - editorial curators are picky about production quality",
    competitiveBenchmark: "Post Malone - Circles (aim for this vocal/instrumental balance)",
    ReviewerProfile: { id: "reviewer-4" },
  },
  {
    id: "review-5",
    releaseVerdict: "FIX_FIRST" as const,
    releaseReadinessScore: 70,
    topFixRank1: "Vocal mixing inconsistent - too quiet in verse, too loud in chorus",
    topFixRank1Impact: "HIGH" as const,
    topFixRank1TimeMin: 20,
    topFixRank2: "Kick drum needs more sub content - lacking weight below 60Hz",
    topFixRank2Impact: "MEDIUM" as const,
    topFixRank2TimeMin: 15,
    topFixRank3: "Transition at 2:15 is jarring - needs smoother automation",
    topFixRank3Impact: "MEDIUM" as const,
    topFixRank3TimeMin: 10,
    strongestElement: "Unique sound design and creative production choices. Stands out from the crowd.",
    biggestRisk: "Inconsistent vocal levels will distract listeners from the great songwriting",
    competitiveBenchmark: "Billie Eilish - bad guy (similar experimental production approach)",
    ReviewerProfile: { id: "reviewer-5" },
  },
  {
    id: "review-6",
    releaseVerdict: "RELEASE_NOW" as const,
    releaseReadinessScore: 85,
    topFixRank1: "Optional: Could add more saturation to the bass for extra warmth",
    topFixRank1Impact: "LOW" as const,
    topFixRank1TimeMin: 15,
    topFixRank2: "Consider brightening the vocal slightly with a 10kHz shelf",
    topFixRank2Impact: "LOW" as const,
    topFixRank2TimeMin: 10,
    topFixRank3: "Background vocals could be 1dB louder in the final chorus",
    topFixRank3Impact: "LOW" as const,
    topFixRank3TimeMin: 5,
    strongestElement: "Professional sounding from start to finish. Mix translates well on all playback systems.",
    biggestRisk: "Market saturation in this genre - will need strong marketing to stand out",
    competitiveBenchmark: "Ed Sheeran - Shape of You (comparable radio readiness)",
    ReviewerProfile: { id: "reviewer-6" },
  },
  {
    id: "review-7",
    releaseVerdict: "FIX_FIRST" as const,
    releaseReadinessScore: 74,
    topFixRank1: "Vocals are too present and dry - need more space and depth with reverb",
    topFixRank1Impact: "HIGH" as const,
    topFixRank1TimeMin: 20,
    topFixRank2: "Bass and kick competing in low end - side-chain compression needed",
    topFixRank2Impact: "HIGH" as const,
    topFixRank2TimeMin: 30,
    topFixRank3: "Snare reverb is too long - makes the mix feel washed out",
    topFixRank3Impact: "MEDIUM" as const,
    topFixRank3TimeMin: 10,
    strongestElement: "Energy and vibe are perfect for the target audience. Will get people moving.",
    biggestRisk: "Vocal production might sound too 'bedroom pop' compared to polished releases",
    competitiveBenchmark: "Olivia Rodrigo - good 4 u (target this punch and clarity)",
    ReviewerProfile: { id: "reviewer-7" },
  },
  {
    id: "review-8",
    releaseVerdict: "FIX_FIRST" as const,
    releaseReadinessScore: 76,
    topFixRank1: "Vocal level inconsistent - automation needed for verse/chorus balance",
    topFixRank1Impact: "HIGH" as const,
    topFixRank1TimeMin: 25,
    topFixRank2: "Low-mid buildup making the mix sound muddy and undefined",
    topFixRank2Impact: "HIGH" as const,
    topFixRank2TimeMin: 30,
    topFixRank3: "Hi-hats are harsh and fatiguing - needs gentle roll-off above 10kHz",
    topFixRank3Impact: "MEDIUM" as const,
    topFixRank3TimeMin: 10,
    strongestElement: "Arrangement keeps listeners engaged. Perfect length and pacing for streaming.",
    biggestRisk: "Mix clarity issues could prevent algorithmic playlist placements",
    competitiveBenchmark: "Harry Styles - As It Was (similar pop sensibility, aim for that polish)",
    ReviewerProfile: { id: "reviewer-8" },
  },
  {
    id: "review-9",
    releaseVerdict: "RELEASE_NOW" as const,
    releaseReadinessScore: 82,
    topFixRank1: "Minor: Could add subtle excitement with a high-shelf boost on the master",
    topFixRank1Impact: "LOW" as const,
    topFixRank1TimeMin: 5,
    topFixRank2: "Optional parallel compression on drums for extra punch",
    topFixRank2Impact: "LOW" as const,
    topFixRank2TimeMin: 15,
    topFixRank3: "Consider adding more background vocal layers in final chorus",
    topFixRank3Impact: "LOW" as const,
    topFixRank3TimeMin: 20,
    strongestElement: "Commercially viable and ready for release. Great hook and memorable production.",
    biggestRisk: "Competitive market - needs solid marketing plan to break through",
    competitiveBenchmark: "Ariana Grande - 7 rings (comparable production standards)",
    ReviewerProfile: { id: "reviewer-9" },
  },
  {
    id: "review-10",
    releaseVerdict: "FIX_FIRST" as const,
    releaseReadinessScore: 73,
    topFixRank1: "Vocals sitting too forward - needs to blend better with the track",
    topFixRank1Impact: "HIGH" as const,
    topFixRank1TimeMin: 15,
    topFixRank2: "Kick and bass frequency clash creating muddiness in low end",
    topFixRank2Impact: "HIGH" as const,
    topFixRank2TimeMin: 30,
    topFixRank3: "Excessive sibilance on vocals - de-esser needed around 7kHz",
    topFixRank3Impact: "MEDIUM" as const,
    topFixRank3TimeMin: 10,
    strongestElement: "Song has serious hit potential. Melody and lyrics are both strong.",
    biggestRisk: "Current mix might sound unpolished next to chart competitors",
    competitiveBenchmark: "Taylor Swift - Anti-Hero (aim for this level of vocal clarity and punch)",
    ReviewerProfile: { id: "reviewer-10" },
  },
];

export default async function ReleaseDecisionReportDemoPage() {
  // Generate the report using real logic with mock data
  const report = await generateReleaseDecisionReport("demo-track-id", mockReviews);

  const verdictColor =
    report.verdict.consensus === "RELEASE_NOW"
      ? "bg-green-500"
      : report.verdict.consensus === "FIX_FIRST"
        ? "bg-orange-500"
        : "bg-red-500";

  const verdictText =
    report.verdict.consensus === "RELEASE_NOW"
      ? "✅ RELEASE NOW"
      : report.verdict.consensus === "FIX_FIRST"
        ? "⚠️ FIX FIRST"
        : "🔧 NEEDS WORK";

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-3xl font-bold text-black">Release Decision Report</h1>
              <p className="text-sm text-neutral-600">Demo report with generated feedback</p>
            </div>
          </div>
        </div>

        {/* Artist View - What they receive */}
        <div className="space-y-6">
          {/* Hero Section - Verdict */}
          <Card variant="soft" elevated className="border-2 border-purple-200">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-8">
                <p className="text-sm font-semibold text-neutral-600 mb-3 uppercase tracking-wider">
                  Your Release Decision for "Summer Nights"
                </p>
                <div className={`inline-flex items-center justify-center px-8 py-4 rounded-2xl ${verdictColor} shadow-lg mb-4`}>
                  <span className="text-3xl font-black text-white tracking-tight">
                    {verdictText}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-6 text-sm text-neutral-600 flex-wrap">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {report.reviewCount} expert reviewers
                  </span>
                  <span>•</span>
                  <span>
                    {report.verdict.breakdown.RELEASE_NOW} Release Now • {report.verdict.breakdown.FIX_FIRST} Fix First • {report.verdict.breakdown.NEEDS_WORK} Needs Work
                  </span>
                  <span>•</span>
                  <span className="font-semibold">
                    {report.verdict.confidence} Confidence
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Readiness Score */}
          <Card variant="soft" elevated>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Release Readiness Score
              </h2>
              <div className="bg-neutral-100 rounded-2xl p-8 text-center">
                <div className="text-6xl font-black text-purple-600 mb-2">
                  {report.readinessScore.average}/100
                </div>
                <p className="text-sm text-neutral-600 mb-4">Average Score</p>
                <div className="flex items-center justify-center gap-4 text-sm text-neutral-600">
                  <span>Range: {report.readinessScore.range[0]}-{report.readinessScore.range[1]}</span>
                  <span>•</span>
                  <span>Median: {report.readinessScore.median}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Fixes */}
          {report.topFixes.length > 0 && (
            <Card variant="soft" elevated>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Top Fixes (Prioritized)
                </h2>
                <div className="space-y-4">
                  {report.topFixes.map((fix, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border-2 border-neutral-200">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-black mb-2">{fix.issue}</p>
                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {fix.mentionedBy}/{report.reviewCount} reviewers
                          </span>
                          <span>•</span>
                          <span className={`font-semibold ${
                            fix.avgImpact === "HIGH" ? "text-red-600" :
                            fix.avgImpact === "MEDIUM" ? "text-orange-600" :
                            "text-green-600"
                          }`}>
                            {fix.avgImpact} IMPACT
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ~{fix.avgTimeEstimate} min
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Analysis */}
          <Card variant="soft" elevated className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI-Powered Analysis
              </h2>

              <div className="space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider mb-2">
                    Summary
                  </h3>
                  <p className="text-base text-neutral-800 leading-relaxed">
                    {report.aiAnalysis.summary}
                  </p>
                </div>

                {/* Technical Insights */}
                {report.aiAnalysis.technicalInsights && (
                  <div>
                    <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider mb-2">
                      Technical Insights
                    </h3>
                    <p className="text-base text-neutral-800 leading-relaxed">
                      {report.aiAnalysis.technicalInsights}
                    </p>
                  </div>
                )}

                {/* Market Recommendation */}
                {report.aiAnalysis.marketRecommendation && (
                  <div>
                    <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider mb-2">
                      Market Recommendation
                    </h3>
                    <p className="text-base text-neutral-800 leading-relaxed">
                      {report.aiAnalysis.marketRecommendation}
                    </p>
                  </div>
                )}

                {/* Estimated Work */}
                <div>
                  <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider mb-2">
                    Estimated Work Required
                  </h3>
                  <p className="text-base text-neutral-800 leading-relaxed font-semibold">
                    {report.aiAnalysis.estimatedWorkRequired}
                  </p>
                </div>

                {/* Action Plan */}
                {report.aiAnalysis.prioritizedActionPlan.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider mb-3">
                      Prioritized Action Plan
                    </h3>
                    <div className="space-y-2">
                      {report.aiAnalysis.prioritizedActionPlan.map((action, i) => (
                        <div key={i} className="flex items-start gap-3 bg-white/60 rounded-lg p-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <p className="text-sm text-neutral-800 pt-0.5">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          {report.strengths.length > 0 && (
            <Card variant="soft" elevated>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  What's Working
                </h2>
                <div className="space-y-3">
                  {report.strengths.slice(0, 5).map((strength, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-neutral-700">{strength}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {report.risks.length > 0 && (
            <Card variant="soft" elevated>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Potential Risks
                </h2>
                <div className="space-y-3">
                  {report.risks.slice(0, 5).map((risk, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <p className="text-neutral-700">{risk}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <Card variant="outline">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-neutral-600">
                This report was generated from <strong>{report.reviewCount} expert reviewers</strong> with 100+ reviews each and 4.5+ ratings.
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                MixReflect • Release Decision Report • Generated on {new Date(report.generatedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
