import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { generateReleaseDecisionReport } from "@/lib/release-decision-report";
import { ReleaseDecisionReportView } from "@/components/tracks/release-decision-report-view";

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

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <div className="mb-6">
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">Admin Preview</p>
          <h1 className="text-2xl font-bold text-black">Report Demo — &ldquo;Summer Nights&rdquo;</h1>
        </div>

        {/* Render the actual report component */}
        <div className="rounded-2xl overflow-hidden shadow-xl border border-neutral-200">
          <ReleaseDecisionReportView
            report={{
              ...report,
              generatedAt: report.generatedAt instanceof Date
                ? report.generatedAt.toISOString()
                : String(report.generatedAt),
            }}
            trackTitle="Summer Nights"
          />
        </div>
      </div>
    </div>
  );
}
