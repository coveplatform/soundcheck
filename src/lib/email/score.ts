import { COLORS, emailButton, emailCard, emailWrapper, getAppUrl, sendEmail } from "./templates";

/**
 * Score-product emails (the new MixReflect): keep the artist in the loop as the
 * room of real listeners reacts to their track, and the big "what's new" blast.
 */

const ACCENT = "#0ea5b7"; // email-safe cousin of the on-site #6ee7ff cyan

/** A single human reaction just landed on a report. */
export async function sendScoreReviewLandedEmail(args: {
  to: string;
  trackTitle: string;
  slug: string;
  completed: number;
  total: number;
}): Promise<boolean> {
  const url = `${getAppUrl()}/report/${args.slug}`;
  const title = args.trackTitle || "your track";
  const content = `
    <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: ${COLORS.black};">
      A listener just reacted 🎧
    </h1>
    <p style="margin: 0 0 8px; font-size: 15px; line-height: 1.6; color: ${COLORS.gray};">
      Someone in your room just left an honest reaction on <strong style="color:${COLORS.black};">${title}</strong>.
    </p>
    ${emailCard(
      `<p style="margin:0; font-size:14px; color:${COLORS.gray};">
        <strong style="color:${ACCENT}; font-size:18px;">${args.completed} of ${args.total}</strong> listeners are in — more land as the room finishes.
      </p>`
    )}
    ${emailButton("Read the reaction →", url)}
    <p style="margin: 8px 0 0; font-size: 13px; color: ${COLORS.grayLight};">
      Reactions stream into your report as they come in.
    </p>
  `;
  return sendEmail({
    to: args.to,
    subject: `🎧 a listener reacted to ${title}`,
    html: emailWrapper(content),
  });
}

/** The whole room has weighed in. */
export async function sendScoreRoomCompleteEmail(args: {
  to: string;
  trackTitle: string;
  slug: string;
  total: number;
}): Promise<boolean> {
  const url = `${getAppUrl()}/report/${args.slug}`;
  const title = args.trackTitle || "your track";
  const content = `
    <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: ${COLORS.black};">
      The room&rsquo;s in ✓
    </h1>
    <p style="margin: 0 0 8px; font-size: 15px; line-height: 1.6; color: ${COLORS.gray};">
      All <strong style="color:${COLORS.black};">${args.total}</strong> listeners have reacted to
      <strong style="color:${COLORS.black};">${title}</strong>. Your full read is ready.
    </p>
    ${emailButton("See the room's verdict →", url)}
  `;
  return sendEmail({
    to: args.to,
    subject: `✓ the room's in on ${title}`,
    html: emailWrapper(content),
  });
}

/** The "what's new — MixReflect just got a big upgrade" announcement blast. */
export function buildNewMixReflectAnnouncement(userName?: string | null): {
  subject: string;
  html: string;
} {
  const app = getAppUrl();
  const name = userName ? userName.split(" ")[0] : null;
  const row = (emoji: string, title: string, body: string) => `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid ${COLORS.border};">
        <p style="margin:0 0 4px; font-size:15px; font-weight:700; color:${COLORS.black};">${emoji} ${title}</p>
        <p style="margin:0; font-size:14px; line-height:1.6; color:${COLORS.gray};">${body}</p>
      </td>
    </tr>`;
  const content = `
    <h1 style="margin: 0 0 14px; font-size: 26px; font-weight: 800; color: ${COLORS.black}; line-height:1.2;">
      MixReflect just got a big upgrade 🎧
    </h1>
    <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: ${COLORS.gray};">
      ${name ? `Hey ${name}, we&rsquo;ve` : "We&rsquo;ve"} rebuilt MixReflect from the ground up. Same idea —
      honest feedback before you release — but now it&rsquo;s <strong style="color:${COLORS.black};">instant</strong>,
      and it comes from <strong style="color:${COLORS.black};">real ears</strong>.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${row("⚡", "An instant AI read", "Paste a link, get a score out of 100 with a verdict and a full breakdown across hook, production, retention, emotion and commercial pull — in seconds.")}
      ${row("👥", "A room of real listeners", "Real, paid listeners react to your track with honest, specific takes that land in your report as they come in. No grinding for credits, no waiting days.")}
      ${row("💸", "Get paid to listen", "Want to earn? Hear unreleased tracks first and get $0.40 for every honest two-minute reaction you leave. Cash out at $10.")}
    </table>
    ${emailButton("Score a track free →", app)}
    <p style="margin: 6px 0 0; font-size: 13px; line-height:1.6; color: ${COLORS.grayLight};">
      Already a MixReflect Pro? Your unlimited access has carried straight over — nothing to do.
      Want to earn instead? <a href="${app}/reviewer" style="color:${COLORS.gray};">Get paid to review →</a>
    </p>
  `;
  return {
    subject: "MixReflect just got a big upgrade 🎧",
    html: emailWrapper(content),
  };
}

/** Send the announcement to a single address (used by the admin test-send). */
export async function sendNewMixReflectAnnouncement(to: string, userName?: string | null): Promise<boolean> {
  const { subject, html } = buildNewMixReflectAnnouncement(userName);
  return sendEmail({ to, subject, html });
}
