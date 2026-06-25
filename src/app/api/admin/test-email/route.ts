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
  sendWelcomeEmail,
} from "@/lib/email";
import { sendWeeklyDigestEmail } from "@/lib/email/digest";
import { sendCreditsNudgeEmail } from "@/lib/email/nudge";
import { sendTotdWeeklyEmail, sendTotdDailyEmail } from "@/lib/email/totd-digest";
import {
  buildUnlimitedOfferEmail,
  sendUnlimitedOfferEmail,
  buildReportReminderEmail,
  sendReportReminderEmail,
} from "@/lib/email/score";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

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
    case "welcome": {
      const content = `
        ${badge("Welcome to MixReflect 🎵")}
        <h1 style="margin: 0 0 12px; font-size: 26px; font-weight: 800; color: ${COLORS.black}; text-align: center; line-height: 1.2;">Hey there, welcome to the community 👋</h1>
        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: ${COLORS.gray}; text-align: center;">MixReflect is built by artists, for artists. Stoked to have you here.</p>
        ${card(`
          <p style="margin: 0 0 16px; font-size: 12px; font-weight: 700; color: ${COLORS.grayLight}; text-transform: uppercase; letter-spacing: 0.8px;">How it works</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: ${COLORS.black};"><strong>🎧 Review artists</strong> — earn credits</p>
          <p style="margin: 0 0 12px; font-size: 13px; color: ${COLORS.gray};">Listen in your genre and leave structured honest feedback.</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: ${COLORS.black};"><strong>🎵 Submit your track</strong> — spend credits</p>
          <p style="margin: 0 0 12px; font-size: 13px; color: ${COLORS.gray};">Queue your track for genre-matched reviewers with notes + scores.</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: ${COLORS.black};"><strong>📊 Get actionable feedback</strong></p>
          <p style="margin: 0; font-size: 13px; color: ${COLORS.gray};">Scores, listener intent data, and a release readiness verdict.</p>
        `)}
        <div style="background-color: #f3e8ff; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: ${COLORS.purple}; text-transform: uppercase; letter-spacing: 0.5px;">Need credits without the grind?</p>
          <p style="margin: 0; font-size: 14px; color: ${COLORS.gray}; line-height: 1.6;">Grab a <strong style="color: ${COLORS.black};">10-credit pack for $9.95</strong> — they never expire. Or go <strong style="color: ${COLORS.black};">Pro at $24.95/month</strong> for 30 credits/month plus perks.</p>
        </div>
        ${emailButton("Start reviewing & earning credits →", `${appUrl}/review`)}
        <p style="margin: 0; font-size: 13px; color: ${COLORS.grayLight}; text-align: center;">— Kris &amp; the MixReflect team</p>
      `;
      return emailWrapper(content);
    }
    case "weekly-digest": {
      const headerImg = `<img src="${appUrl}/blog/blog1.jpg" alt="" width="520" style="display: block; width: 100%; max-width: 520px; height: 220px; object-fit: cover; border-radius: 12px; margin-bottom: 24px;" />`;
      const content = `
        ${headerImg}
        <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: ${COLORS.black}; line-height: 1.2;">
          Hey Kris — your week on MixReflect
        </h1>
        <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.6;">
          Here's what happened this week.
        </p>
        <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 4px 20px; margin-bottom: 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td style="padding: 14px 0; border-bottom: 1px solid ${COLORS.border};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                <td><p style="margin: 0; font-size: 14px; color: ${COLORS.gray};">Credits earned this week</p></td>
                <td style="text-align: right;"><p style="margin: 0; font-size: 18px; font-weight: 800; color: ${COLORS.purple};">+3</p></td>
              </tr></table>
            </td></tr>
            <tr><td style="padding: 14px 0; border-bottom: 1px solid ${COLORS.border};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                <td><p style="margin: 0; font-size: 14px; color: ${COLORS.gray};">New reviews on "Summer Nights"</p></td>
                <td style="text-align: right;"><p style="margin: 0; font-size: 18px; font-weight: 800; color: ${COLORS.black};">2</p></td>
              </tr></table>
            </td></tr>
            <tr><td style="padding: 14px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                <td><p style="margin: 0; font-size: 14px; color: ${COLORS.gray};">Tracks in your genre needing ears</p></td>
                <td style="text-align: right;"><p style="margin: 0; font-size: 18px; font-weight: 800; color: ${COLORS.black};">7</p></td>
              </tr></table>
            </td></tr>
          </table>
        </div>
        ${emailButton("Read your reviews →", `${appUrl}/dashboard`)}
        <p style="margin: 20px 0 8px; font-size: 14px; color: ${COLORS.gray}; text-align: center;">7 tracks waiting — each review earns +1 credit.</p>
        ${emailButton("Review & earn →", `${appUrl}/review`, "secondary")}
        <p style="margin: 20px 0 0; font-size: 12px; color: ${COLORS.grayLight}; text-align: center;">— Kris &amp; the MixReflect team</p>
      `;
      return emailWrapper(content);
    }
    case "credits-nudge": {
      const headerImg = `<img src="${appUrl}/blog/blog2.jpg" alt="" width="520" style="display: block; width: 100%; max-width: 520px; height: 220px; object-fit: cover; border-radius: 12px; margin-bottom: 24px;" />`;
      const content = `
        ${headerImg}
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800; color: ${COLORS.black}; line-height: 1.2;">
          Hey Kris, you've got 5 credits doing nothing.
        </h1>
        <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.6;">
          You've got <strong style="color: ${COLORS.black};">5 credits</strong> sitting unused. Queue up "Summer Nights" and get real ears on it — each credit gets you one structured review back.
        </p>
        <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border};"><p style="margin: 0; font-size: 13px; color: ${COLORS.gray};">✓ Production score</p></td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border};"><p style="margin: 0; font-size: 13px; color: ${COLORS.gray};">✓ Written feedback from a real artist</p></td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border};"><p style="margin: 0; font-size: 13px; color: ${COLORS.gray};">✓ Listener intent data (would they share it?)</p></td></tr>
            <tr><td style="padding: 10px 0;"><p style="margin: 0; font-size: 13px; color: ${COLORS.gray};">✓ Release verdict</p></td></tr>
          </table>
        </div>
        ${emailButton('Queue "Summer Nights" for review →', `${appUrl}/submit`)}
        <p style="margin: 16px 0 0; font-size: 13px; color: ${COLORS.grayLight}; text-align: center;">
          Or <a href="${appUrl}/review" style="color: ${COLORS.gray}; font-weight: 600;">review a track</a> to earn even more.
        </p>
      `;
      return emailWrapper(content);
    }
    case "totd-digest": {
      const pick = { title: "Low Tide", artistName: "Niko Vale", genre: "Lo-fi", editorNote: "There's a stillness to this one that feels deliberate — the way the kick sits back in the mix instead of leading, letting the chords breathe. Niko Vale has been refining this sound for months and it shows: the arrangement is patient, the low-end warm without being muddy. Worth your full attention." };
      const genrePill = pick.genre
        ? `<span style="display: inline-block; background-color: ${COLORS.bg}; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 700; color: ${COLORS.gray}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">${pick.genre}</span>`
        : "";
      const content = `
        <img src="${appUrl}/blog/blog3.jpg" alt="" width="520" style="display: block; width: 100%; max-width: 520px; height: 220px; object-fit: cover; border-radius: 12px; margin-bottom: 24px;" />
        <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: ${COLORS.purple}; text-transform: uppercase; letter-spacing: 1px;">Track of the Day</p>
        <p style="margin: 0 0 20px; font-size: 13px; color: ${COLORS.grayLight};">Thursday, May 29</p>
        <h1 style="margin: 0 0 4px; font-size: 28px; font-weight: 800; color: ${COLORS.black}; line-height: 1.15;">${pick.title}</h1>
        <p style="margin: 0 0 16px; font-size: 15px; font-weight: 700; color: ${COLORS.gray};">${pick.artistName}</p>
        ${genrePill}
        <div style="background-color: ${COLORS.bg}; border-left: 3px solid ${COLORS.purple}; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 28px;">
          <p style="margin: 0; font-size: 14px; color: ${COLORS.gray}; line-height: 1.8; font-style: italic;">"${pick.editorNote}"</p>
        </div>
        ${emailButton("Listen now →", `${appUrl}/breakthrough`)}
        <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 18px 20px; margin-top: 28px;">
          <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: ${COLORS.black};">Want your track here?</p>
          <p style="margin: 0 0 12px; font-size: 13px; color: ${COLORS.gray}; line-height: 1.6;">Submit your track to the daily chart — artists vote, the top track each day wins the featured spot and gets sent to the whole community.</p>
          <a href="${appUrl}/submit" style="font-size: 13px; font-weight: 700; color: ${COLORS.purple}; text-decoration: none;">Submit a track →</a>
        </div>
        <p style="margin: 24px 0 0; font-size: 12px; color: ${COLORS.grayLight}; text-align: center;">— Kris &amp; the MixReflect team</p>
      `;
      return emailWrapper(content);
    }
    case "unlimited-offer":
      return buildUnlimitedOfferEmail({ email: "artist@example.com", userName: "Test Artist" }).html;
    case "report-reminder":
      return buildReportReminderEmail({ trackTitle: "Summer Nights (Demo)", slug: "demo-full" }).html;
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
      case "admin-new-track": {
        const { sendAdminNewTrackNotification } = await import("@/lib/email");
        await sendAdminNewTrackNotification({ trackTitle: "Summer Nights (Test)", artistEmail: recipientEmail, packageType: "PEER", reviewsRequested: 10, isPromo: false });
        break;
      }
      case "welcome":
        await sendWelcomeEmail({ to: recipientEmail, name: "Test Artist" });
        break;
      case "weekly-digest":
        await sendWeeklyDigestEmail({
          to: recipientEmail,
          name: "Kris",
          creditsEarned: 3,
          reviewsReceived: 2,
          genreTrackCount: 7,
          trackTitle: "Summer Nights",
          trackId: "test-id",
        });
        break;
      case "credits-nudge":
        await sendCreditsNudgeEmail({
          to: recipientEmail,
          name: "Kris",
          credits: 5,
          trackTitle: "Summer Nights",
          trackId: "test-id",
        });
        break;
      case "totd-digest":
        await sendTotdDailyEmail({
          to: recipientEmail,
          dateLabel: "Thursday, May 29",
          pick: { title: "Low Tide", artistName: "Niko Vale", genre: "Lo-fi", editorNote: "There's a stillness to this one that feels deliberate — the way the kick sits back in the mix instead of leading, letting the chords breathe. Worth your full attention." },
        });
        break;
      case "unlimited-offer":
        await sendUnlimitedOfferEmail({ to: recipientEmail, userName: "Test Artist" });
        break;
      case "report-reminder":
        await sendReportReminderEmail({ to: recipientEmail, trackTitle: "Summer Nights (Demo)", slug: "demo-full" });
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
