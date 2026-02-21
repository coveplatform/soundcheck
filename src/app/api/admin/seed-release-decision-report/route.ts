import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReleaseDecisionReport } from "@/lib/release-decision-report";
import { sendReleaseDecisionReport } from "@/lib/email";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

// Mock review data for seeding
const mockReviews = [
  {
    id: "seed-review-1",
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
    id: "seed-review-2",
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
    id: "seed-review-3",
    releaseVerdict: "RELEASE_NOW" as const,
    releaseReadinessScore: 88,
    topFixRank1: "Could benefit from slight vocal compression in the verses for consistency",
    topFixRank1Impact: "LOW" as const,
    topFixRank1TimeMin: 10,
    topFixRank2: "Reverb tail on the bridge is slightly too long",
    topFixRank2Impact: "LOW" as const,
    topFixRank2TimeMin: 5,
    topFixRank3: null,
    topFixRank3Impact: null,
    topFixRank3TimeMin: null,
    strongestElement: "Excellent songwriting and the production has a unique identity that stands out",
    biggestRisk: "Minor mix imperfections but nothing that would prevent a successful release",
    competitiveBenchmark: "Billie Eilish - Bad Guy (similar minimal-but-impactful production style)",
    ReviewerProfile: { id: "reviewer-3" },
  },
  {
    id: "seed-review-4",
    releaseVerdict: "FIX_FIRST" as const,
    releaseReadinessScore: 65,
    topFixRank1: "Vocal sits too loud in the mix - bring it down 2dB and add subtle compression",
    topFixRank1Impact: "HIGH" as const,
    topFixRank1TimeMin: 20,
    topFixRank2: "The intro is too long - listeners will skip. Cut it to 8 bars max",
    topFixRank2Impact: "MEDIUM" as const,
    topFixRank2TimeMin: 10,
    topFixRank3: "Master is slightly over-compressed - losing dynamics in the chorus",
    topFixRank3Impact: "MEDIUM" as const,
    topFixRank3TimeMin: 15,
    strongestElement: "The chorus is a genuine earworm - great topline melody and lyrical hook",
    biggestRisk: "The long intro will kill streaming numbers since most skips happen in the first 10 seconds",
    competitiveBenchmark: "Olivia Rodrigo - Good 4 U (aim for this level of vocal presence without being overpowering)",
    ReviewerProfile: { id: "reviewer-4" },
  },
  {
    id: "seed-review-5",
    releaseVerdict: "RELEASE_NOW" as const,
    releaseReadinessScore: 82,
    topFixRank1: "Low end could use a multiband compressor to tighten up the 60-100Hz range",
    topFixRank1Impact: "MEDIUM" as const,
    topFixRank1TimeMin: 20,
    topFixRank2: "Backing vocals in the second verse are slightly pitchy",
    topFixRank2Impact: "LOW" as const,
    topFixRank2TimeMin: 15,
    topFixRank3: "Consider adding a subtle stereo widener to the synth pad",
    topFixRank3Impact: "LOW" as const,
    topFixRank3TimeMin: 5,
    strongestElement: "Overall vibe and emotion are on point - this connects on an emotional level",
    biggestRisk: "Minor technical issues but the emotional impact carries it",
    competitiveBenchmark: "SZA - Kill Bill (similar emotional weight with clean production)",
    ReviewerProfile: { id: "reviewer-5" },
  },
  {
    id: "seed-review-6",
    releaseVerdict: "FIX_FIRST" as const,
    releaseReadinessScore: 70,
    topFixRank1: "Vocal needs more presence - try boosting around 3-5kHz",
    topFixRank1Impact: "HIGH" as const,
    topFixRank1TimeMin: 10,
    topFixRank2: "The kick drum pattern feels repetitive - add some variation in the second half",
    topFixRank2Impact: "MEDIUM" as const,
    topFixRank2TimeMin: 20,
    topFixRank3: "Ending is abrupt - consider a proper outro or fade",
    topFixRank3Impact: "LOW" as const,
    topFixRank3TimeMin: 15,
    strongestElement: "Sound design is creative and fresh - the synth textures are unique",
    biggestRisk: "Vocal clarity issues could limit crossover appeal",
    competitiveBenchmark: "Tame Impala - The Less I Know The Better (production complexity benchmark)",
    ReviewerProfile: { id: "reviewer-6" },
  },
  {
    id: "seed-review-7",
    releaseVerdict: "FIX_FIRST" as const,
    releaseReadinessScore: 74,
    topFixRank1: "Low end is muddy around 80-120Hz - needs surgical EQ",
    topFixRank1Impact: "HIGH" as const,
    topFixRank1TimeMin: 15,
    topFixRank2: "Vocal doubles are out of time in places - re-align or re-record",
    topFixRank2Impact: "MEDIUM" as const,
    topFixRank2TimeMin: 25,
    topFixRank3: "The bridge feels disconnected from the rest - work on the transition",
    topFixRank3Impact: "LOW" as const,
    topFixRank3TimeMin: 20,
    strongestElement: "Groove is infectious - great drum programming and rhythmic feel",
    biggestRisk: "Low end mud will sound terrible on phone speakers and earbuds",
    competitiveBenchmark: "Post Malone - Circles (clean low end reference)",
    ReviewerProfile: { id: "reviewer-7" },
  },
  {
    id: "seed-review-8",
    releaseVerdict: "RELEASE_NOW" as const,
    releaseReadinessScore: 85,
    topFixRank1: "Consider a light limiter on the master to catch occasional peaks",
    topFixRank1Impact: "LOW" as const,
    topFixRank1TimeMin: 5,
    topFixRank2: "Vocal ad-libs could be slightly louder in the chorus",
    topFixRank2Impact: "LOW" as const,
    topFixRank2TimeMin: 5,
    topFixRank3: null,
    topFixRank3Impact: null,
    topFixRank3TimeMin: null,
    strongestElement: "This is a complete, well-produced track. The mix is 90% there and the song itself is strong.",
    biggestRisk: "Very minor tweaks needed - nothing that should delay release",
    competitiveBenchmark: "Harry Styles - As It Was (similar pop production quality target)",
    ReviewerProfile: { id: "reviewer-8" },
  },
  {
    id: "seed-review-9",
    releaseVerdict: "FIX_FIRST" as const,
    releaseReadinessScore: 68,
    topFixRank1: "Vocal needs de-essing and the sibilance is distracting",
    topFixRank1Impact: "HIGH" as const,
    topFixRank1TimeMin: 10,
    topFixRank2: "Kick drum is getting lost - needs more presence in the 50-60Hz range",
    topFixRank2Impact: "MEDIUM" as const,
    topFixRank2TimeMin: 15,
    topFixRank3: "Stereo image feels narrow - spread the synths and backing vocals wider",
    topFixRank3Impact: "MEDIUM" as const,
    topFixRank3TimeMin: 15,
    strongestElement: "Lyrics are honest and relatable - the storytelling connects",
    biggestRisk: "Sibilance will cause listener fatigue, especially on earbuds and car speakers",
    competitiveBenchmark: "Lorde - Royals (vocal clarity and intimate production reference)",
    ReviewerProfile: { id: "reviewer-9" },
  },
  {
    id: "seed-review-10",
    releaseVerdict: "FIX_FIRST" as const,
    releaseReadinessScore: 71,
    topFixRank1: "Vocal is too loud relative to the instrumental - rebalance by -2dB",
    topFixRank1Impact: "HIGH" as const,
    topFixRank1TimeMin: 10,
    topFixRank2: "The build into the chorus needs more energy - layer an extra synth or add a riser",
    topFixRank2Impact: "MEDIUM" as const,
    topFixRank2TimeMin: 20,
    topFixRank3: "Master loudness is about -2 LUFS too quiet for the genre",
    topFixRank3Impact: "LOW" as const,
    topFixRank3TimeMin: 10,
    strongestElement: "Strong commercial potential - the hook and melody are genuinely memorable",
    biggestRisk: "Current mix might sound unpolished next to chart competitors",
    competitiveBenchmark: "Taylor Swift - Anti-Hero (aim for this level of vocal clarity and punch)",
    ReviewerProfile: { id: "reviewer-10" },
  },
];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, sendEmail } = body as { email?: string; sendEmail?: boolean };

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Find user and their first track
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        ArtistProfile: {
          include: {
            Track: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 });
    }

    if (!user.ArtistProfile) {
      return NextResponse.json({ error: "User has no artist profile" }, { status: 404 });
    }

    let track = user.ArtistProfile.Track[0];
    if (!track) {
      // Create a placeholder track for seeding
      track = await prisma.track.create({
        data: {
          title: "Demo Track — Release Decision Test",
          sourceUrl: "https://soundcloud.com/demo/placeholder",
          sourceType: "SOUNDCLOUD",
          packageType: "RELEASE_DECISION",
          status: "COMPLETED",
          reviewsRequested: 10,
          reviewsCompleted: 10,
          ArtistProfile: { connect: { id: user.ArtistProfile.id } },
        },
      });
    }

    // Generate report from mock data
    const report = await generateReleaseDecisionReport(track.id, mockReviews);

    // Save to track
    await prisma.track.update({
      where: { id: track.id },
      data: {
        releaseDecisionReport: report as any,
        releaseDecisionGeneratedAt: new Date(),
      },
    });

    // Optionally send the email
    if (sendEmail) {
      await sendReleaseDecisionReport({
        artistEmail: user.email,
        artistName: user.ArtistProfile.artistName,
        trackTitle: track.title,
        trackId: track.id,
        report,
      });
    }

    return NextResponse.json({
      success: true,
      trackId: track.id,
      trackTitle: track.title,
      emailSent: !!sendEmail,
      message: `Report seeded on "${track.title}" (${track.id})${sendEmail ? ` and email sent to ${user.email}` : ""}`,
      viewUrl: `/tracks/${track.id}`,
    });
  } catch (error) {
    console.error("Error seeding report:", error);
    return NextResponse.json(
      { error: "Failed to seed report", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
