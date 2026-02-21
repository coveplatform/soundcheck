import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  emailWrapper,
  emailButton,
  getAppUrl,
  COLORS,
  sendTierChangeEmail,
  sendPasswordResetEmail,
  sendTrackQueuedEmail,
  sendReviewProgressEmail,
  sendInvalidTrackLinkEmail,
  sendPurchaseConfirmationEmail,
  sendReleaseDecisionReport,
} from "@/lib/email";
import { generateReleaseDecisionReport } from "@/lib/release-decision-report";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

// Mock review data for Release Decision report
const mockReviews = [
  { id: "r1", releaseVerdict: "FIX_FIRST" as const, releaseReadinessScore: 72, topFixRank1: "Vocal sits too loud in the mix", topFixRank1Impact: "HIGH" as const, topFixRank1TimeMin: 15, topFixRank2: "Low end is muddy around 80-120Hz", topFixRank2Impact: "HIGH" as const, topFixRank2TimeMin: 30, topFixRank3: "Hi-hats are too bright", topFixRank3Impact: "MEDIUM" as const, topFixRank3TimeMin: 10, strongestElement: "Catchy melody and great hook", biggestRisk: "Mix issues make it sound amateur", competitiveBenchmark: "The Weeknd - Blinding Lights", ReviewerProfile: { id: "rev-1" } },
  { id: "r2", releaseVerdict: "FIX_FIRST" as const, releaseReadinessScore: 78, topFixRank1: "Vocals need de-essing around 6-8kHz", topFixRank1Impact: "MEDIUM" as const, topFixRank1TimeMin: 10, topFixRank2: "Bass needs +3dB", topFixRank2Impact: "HIGH" as const, topFixRank2TimeMin: 20, topFixRank3: "Snare lacks punch", topFixRank3Impact: "MEDIUM" as const, topFixRank3TimeMin: 15, strongestElement: "Professional arrangement", biggestRisk: "Vocal issues will cause bounces", competitiveBenchmark: "Dua Lipa - Levitating", ReviewerProfile: { id: "rev-2" } },
  { id: "r3", releaseVerdict: "RELEASE_NOW" as const, releaseReadinessScore: 88, topFixRank1: "Slight vocal compression needed", topFixRank1Impact: "LOW" as const, topFixRank1TimeMin: 10, topFixRank2: "Reverb tail slightly too long", topFixRank2Impact: "LOW" as const, topFixRank2TimeMin: 5, topFixRank3: null, topFixRank3Impact: null, topFixRank3TimeMin: null, strongestElement: "Excellent songwriting", biggestRisk: "Minor mix imperfections", competitiveBenchmark: "Billie Eilish - Bad Guy", ReviewerProfile: { id: "rev-3" } },
  { id: "r4", releaseVerdict: "FIX_FIRST" as const, releaseReadinessScore: 65, topFixRank1: "Vocal too loud - bring down 2dB", topFixRank1Impact: "HIGH" as const, topFixRank1TimeMin: 20, topFixRank2: "Intro too long", topFixRank2Impact: "MEDIUM" as const, topFixRank2TimeMin: 10, topFixRank3: "Master over-compressed", topFixRank3Impact: "MEDIUM" as const, topFixRank3TimeMin: 15, strongestElement: "Great chorus hook", biggestRisk: "Long intro kills streaming numbers", competitiveBenchmark: "Olivia Rodrigo - Good 4 U", ReviewerProfile: { id: "rev-4" } },
  { id: "r5", releaseVerdict: "RELEASE_NOW" as const, releaseReadinessScore: 82, topFixRank1: "Tighten 60-100Hz with multiband", topFixRank1Impact: "MEDIUM" as const, topFixRank1TimeMin: 20, topFixRank2: "Backing vocals slightly pitchy", topFixRank2Impact: "LOW" as const, topFixRank2TimeMin: 15, topFixRank3: null, topFixRank3Impact: null, topFixRank3TimeMin: null, strongestElement: "Emotional impact on point", biggestRisk: "Minor technical issues", competitiveBenchmark: "SZA - Kill Bill", ReviewerProfile: { id: "rev-5" } },
  { id: "r6", releaseVerdict: "FIX_FIRST" as const, releaseReadinessScore: 70, topFixRank1: "Vocal needs more presence 3-5kHz", topFixRank1Impact: "HIGH" as const, topFixRank1TimeMin: 10, topFixRank2: "Kick pattern repetitive", topFixRank2Impact: "MEDIUM" as const, topFixRank2TimeMin: 20, topFixRank3: "Ending is abrupt", topFixRank3Impact: "LOW" as const, topFixRank3TimeMin: 15, strongestElement: "Creative sound design", biggestRisk: "Vocal clarity limits appeal", competitiveBenchmark: "Tame Impala - The Less I Know", ReviewerProfile: { id: "rev-6" } },
  { id: "r7", releaseVerdict: "FIX_FIRST" as const, releaseReadinessScore: 74, topFixRank1: "Low end muddy 80-120Hz", topFixRank1Impact: "HIGH" as const, topFixRank1TimeMin: 15, topFixRank2: "Vocal doubles out of time", topFixRank2Impact: "MEDIUM" as const, topFixRank2TimeMin: 25, topFixRank3: "Bridge disconnected", topFixRank3Impact: "LOW" as const, topFixRank3TimeMin: 20, strongestElement: "Infectious groove", biggestRisk: "Mud sounds bad on phone speakers", competitiveBenchmark: "Post Malone - Circles", ReviewerProfile: { id: "rev-7" } },
  { id: "r8", releaseVerdict: "RELEASE_NOW" as const, releaseReadinessScore: 85, topFixRank1: "Light limiter on master for peaks", topFixRank1Impact: "LOW" as const, topFixRank1TimeMin: 5, topFixRank2: "Ad-libs slightly louder in chorus", topFixRank2Impact: "LOW" as const, topFixRank2TimeMin: 5, topFixRank3: null, topFixRank3Impact: null, topFixRank3TimeMin: null, strongestElement: "Complete, well-produced track", biggestRisk: "Very minor tweaks only", competitiveBenchmark: "Harry Styles - As It Was", ReviewerProfile: { id: "rev-8" } },
  { id: "r9", releaseVerdict: "FIX_FIRST" as const, releaseReadinessScore: 68, topFixRank1: "De-essing needed - sibilance distracting", topFixRank1Impact: "HIGH" as const, topFixRank1TimeMin: 10, topFixRank2: "Kick lost in mix", topFixRank2Impact: "MEDIUM" as const, topFixRank2TimeMin: 15, topFixRank3: "Stereo image narrow", topFixRank3Impact: "MEDIUM" as const, topFixRank3TimeMin: 15, strongestElement: "Honest, relatable lyrics", biggestRisk: "Sibilance causes listener fatigue", competitiveBenchmark: "Lorde - Royals", ReviewerProfile: { id: "rev-9" } },
  { id: "r10", releaseVerdict: "FIX_FIRST" as const, releaseReadinessScore: 71, topFixRank1: "Vocal too loud - rebalance -2dB", topFixRank1Impact: "HIGH" as const, topFixRank1TimeMin: 10, topFixRank2: "Chorus build needs more energy", topFixRank2Impact: "MEDIUM" as const, topFixRank2TimeMin: 20, topFixRank3: "Master too quiet for genre", topFixRank3Impact: "LOW" as const, topFixRank3TimeMin: 10, strongestElement: "Strong commercial potential", biggestRisk: "Sounds unpolished vs competitors", competitiveBenchmark: "Taylor Swift - Anti-Hero", ReviewerProfile: { id: "rev-10" } },
];

// Badge helper for previews
function badge(text: string, color: string = COLORS.purple): string {
  return `<div style="text-align: center; margin-bottom: 20px;"><div style="display: inline-block; background-color: ${color}; padding: 6px 14px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">${text}</div></div>`;
}
// Card helper for previews
function card(inner: string): string {
  return `<div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 20px;">${inner}</div>`;
}

// Build preview HTML for each email type
function buildPreviewHtml(type: string): string {
  const appUrl = getAppUrl();

  switch (type) {
    case "tier-change": {
      const content = `
        ${badge("Level Up!")}
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">You're now PRO</h1>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">Congratulations! Your consistent high-quality reviews have earned you a tier upgrade.</p>
        ${card(`
          <p style="margin: 0 0 4px; font-size: 14px; color: ${COLORS.gray}; text-align: center;">New earning rate</p>
          <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${COLORS.purple}; text-align: center;">$0.50</p>
          <p style="margin: 4px 0 0; font-size: 14px; color: ${COLORS.gray}; text-align: center;">per review</p>
        `)}
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">Keep submitting thoughtful, detailed feedback to maintain your status.</p>
      `;
      return emailWrapper(content);
    }
    case "password-reset": {
      const content = `
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black};">Reset your password</h1>
        <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray};">We received a request to reset your password. Click the button below to choose a new one.</p>
        ${emailButton("Reset Password", `${appUrl}/reset-password?token=test-token-123`)}
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">This link will expire in <strong>1 hour</strong> for security reasons.</p>
      `;
      return emailWrapper(content);
    }
    case "track-queued": {
      const content = `
        ${badge("Track Submitted")}
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">Your track is in the queue</h1>
        ${card(`
          <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase; letter-spacing: 0.5px;">Track</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${COLORS.black};">Summer Nights (Demo)</p>
        `)}
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray};">Your track is now being matched with reviewers based on genre preferences.</p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};"><strong>What happens next:</strong><br>We'll email you updates at 50% and 100% completion.</p>
      `;
      return emailWrapper(content);
    }
    case "review-progress": {
      const progressBar = `<div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 4px; margin-bottom: 24px;"><div style="background-color: ${COLORS.purple}; height: 20px; width: 50%; border-radius: 10px;"></div></div>`;
      const content = `
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">Review progress update</h1>
        ${card(`
          <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase;">Track</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${COLORS.black};">Summer Nights (Demo)</p>
        `)}
        ${progressBar}
        <p style="margin: 0 0 24px; font-size: 18px; line-height: 1.6; color: ${COLORS.black}; text-align: center; font-weight: 700;">50% complete — 5 of 10 reviews</p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">Reviews are coming in! You can already view completed reviews in your dashboard.</p>
        ${emailButton("View Progress", `${appUrl}/dashboard`, "secondary")}
      `;
      return emailWrapper(content);
    }
    case "reviews-complete": {
      const progressBar = `<div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 4px; margin-bottom: 24px;"><div style="background-color: ${COLORS.green}; height: 20px; width: 100%; border-radius: 10px;"></div></div>`;
      const content = `
        ${badge("Complete!", COLORS.green)}
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">All reviews are in!</h1>
        ${card(`
          <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase;">Track</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${COLORS.black};">Summer Nights (Demo)</p>
        `)}
        ${progressBar}
        <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;"><strong>10 of 10</strong> reviews completed</p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">Your feedback is ready! Log in to read all reviews and rate them.</p>
        ${emailButton("View Your Reviews", `${appUrl}/dashboard`)}
      `;
      return emailWrapper(content);
    }
    case "invalid-track": {
      const content = `
        ${badge("Action Required", COLORS.red)}
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">Your track link needs attention</h1>
        ${card(`
          <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase;">Track</p>
          <p style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: ${COLORS.black};">Summer Nights (Demo)</p>
          <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase;">Current Link</p>
          <p style="margin: 0; font-size: 14px; color: ${COLORS.red};">https://soundcloud.com/broken-link</p>
        `)}
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray};">Your track link appears to be broken, private, or unavailable.</p>
        ${emailButton("Update Track Link", `${appUrl}/tracks/test-id`)}
      `;
      return emailWrapper(content);
    }
    case "purchase-confirmation": {
      const content = `
        ${badge("Purchase Complete")}
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">Your download is ready!</h1>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">Hi Test User, thank you for supporting Demo Artist.</p>
        ${card(`
          <p style="margin: 0 0 8px; font-size: 12px; color: ${COLORS.grayLight}; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Track</p>
          <p style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: ${COLORS.black}; text-align: center;">Summer Nights</p>
          <p style="margin: 0; font-size: 14px; color: ${COLORS.gray}; text-align: center;">by <strong style="color: ${COLORS.black};">Demo Artist</strong></p>
        `)}
        ${emailButton("Download Track", `${appUrl}/downloads/test`)}
      `;
      return emailWrapper(content);
    }
    case "admin-new-track": {
      const content = `
        ${badge("New Submission")}
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">New track submitted</h1>
        ${card(`
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border};"><span style="font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase;">Track</span><br><span style="font-size: 16px; font-weight: 700; color: ${COLORS.black};">Summer Nights (Demo)</span></td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border};"><span style="font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase;">Artist</span><br><span style="font-size: 14px; color: ${COLORS.black};">test@example.com</span></td></tr>
            <tr><td style="padding: 8px 0;"><span style="font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase;">Package</span><br><span style="font-size: 14px; font-weight: 600; color: ${COLORS.black};">PEER</span></td></tr>
          </table>
        `)}
        ${emailButton("View in Admin", `${appUrl}/admin/tracks`)}
      `;
      return emailWrapper(content);
    }
    case "release-decision-report": {
      const verdict = { breakdown: { RELEASE_NOW: 3, FIX_FIRST: 7, NEEDS_WORK: 0 } };
      const topFixes = [
        { issue: "Vocal sits too loud in the mix - needs to be pulled back 2-3dB", avgImpact: "HIGH", avgTimeEstimate: 15, mentionedBy: 7 },
        { issue: "Low end is muddy around 80-120Hz - kick and bass fighting", avgImpact: "HIGH", avgTimeEstimate: 25, mentionedBy: 5 },
        { issue: "De-essing needed - sibilance is distracting", avgImpact: "MEDIUM", avgTimeEstimate: 10, mentionedBy: 4 },
      ];
      const trackUrl = `${appUrl}/tracks/demo-track-id`;
      const fixesHtml = topFixes.map((fix: any, i: number) => `
        <div style="background-color: ${COLORS.bg}; border-left: 4px solid ${fix.avgImpact === 'HIGH' ? '#ef4444' : '#f59e0b'}; padding: 16px; margin-bottom: 12px; border-radius: 0 10px 10px 0;">
          <p style="margin: 0 0 6px; font-size: 16px; font-weight: 700; color: ${COLORS.black};">${i + 1}. ${fix.issue}</p>
          <p style="margin: 0; font-size: 13px; color: ${COLORS.gray};">${fix.mentionedBy}/10 reviewers • <span style="color: ${fix.avgImpact === 'HIGH' ? '#ef4444' : '#f59e0b'}; font-weight: 600;">${fix.avgImpact} IMPACT</span> • ~${fix.avgTimeEstimate} min</p>
        </div>
      `).join("");

      const content = `
        ${badge("Release Decision Report", "#7c3aed")}
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">Summer Nights (Demo)</h1>
        <p style="margin: 0 0 24px; font-size: 14px; color: ${COLORS.gray}; text-align: center;">10 expert reviewers have spoken</p>
        <div style="background-color: ${COLORS.amber}; padding: 20px; margin-bottom: 24px; text-align: center; border-radius: 12px;">
          <h2 style="margin: 0; font-size: 28px; font-weight: 900; color: white;">⚠️ FIX FIRST</h2>
          <p style="margin: 8px 0 0; font-size: 13px; color: rgba(255,255,255,0.9);">${verdict.breakdown.RELEASE_NOW} Release • ${verdict.breakdown.FIX_FIRST} Fix First • ${verdict.breakdown.NEEDS_WORK} Needs Work</p>
        </div>
        <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 14px; color: ${COLORS.gray}; text-transform: uppercase;">READINESS SCORE</p>
          <p style="margin: 0; font-size: 56px; font-weight: 900; color: #7c3aed; line-height: 1;">73/100</p>
        </div>
        <h3 style="margin: 24px 0 16px; font-size: 18px; font-weight: 700; color: ${COLORS.black};">🔧 Top Fixes (Prioritized)</h3>
        ${fixesHtml}
        <div style="background-color: #faf5ff; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #7c3aed;">📊 Summary</h3>
          <p style="margin: 0 0 12px; font-size: 14px; color: #374151; line-height: 1.6;">7 of 10 expert reviewers recommend fixing before release. Strong commercial potential but mix balance issues.</p>
          <p style="margin: 0; font-size: 13px; color: #6b7280;"><strong>Work Required:</strong> ~50 minutes</p>
        </div>
        ${emailButton("View Full Report", trackUrl)}
      `;
      return emailWrapper(content);
    }
    default:
      return emailWrapper(`<p>Unknown email type: ${type}</p>`);
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (!type) {
    return NextResponse.json({ error: "type param required" }, { status: 400 });
  }

  const html = buildPreviewHtml(type);
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, to } = await request.json();
    const recipientEmail = to || session.user.email;

    switch (type) {
      case "tier-change":
        await sendTierChangeEmail({ to: recipientEmail, newTier: "PRO", newRateCents: 50 });
        break;
      case "password-reset":
        await sendPasswordResetEmail({ to: recipientEmail, resetUrl: `${getAppUrl()}/reset-password?token=test-token-123` });
        break;
      case "track-queued":
        await sendTrackQueuedEmail(recipientEmail, "Summer Nights (Test)");
        break;
      case "review-progress":
        await sendReviewProgressEmail(recipientEmail, "Summer Nights (Test)", 5, 10);
        break;
      case "reviews-complete":
        await sendReviewProgressEmail(recipientEmail, "Summer Nights (Test)", 10, 10);
        break;
      case "invalid-track":
        await sendInvalidTrackLinkEmail({ to: recipientEmail, trackTitle: "Summer Nights (Test)", trackId: "test-id", sourceUrl: "https://soundcloud.com/broken" });
        break;
      case "purchase-confirmation":
        await sendPurchaseConfirmationEmail({ buyerEmail: recipientEmail, buyerName: "Test User", trackTitle: "Summer Nights", artistName: "Demo Artist", downloadUrl: `${getAppUrl()}/downloads/test`, purchaseId: "test-purchase" });
        break;
      case "release-decision-report": {
        const report = await generateReleaseDecisionReport("test-track", mockReviews);
        await sendReleaseDecisionReport({ artistEmail: recipientEmail, artistName: "Test User", trackTitle: "Summer Nights (Test)", trackId: "test-track", report });
        break;
      }
      case "admin-new-track":
        // Send directly since it goes to admin
        const { sendAdminNewTrackNotification } = await import("@/lib/email");
        await sendAdminNewTrackNotification({ trackTitle: "Summer Nights (Test)", artistEmail: recipientEmail, packageType: "PEER", reviewsRequested: 10, isPromo: false });
        break;
      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, sentTo: recipientEmail });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({ error: "Failed to send", details: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
