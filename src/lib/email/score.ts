import { getAppUrl, sendEmail } from "./templates";

/**
 * Score-product emails (the new MixReflect): dark, icy-cyan brand to match the
 * site — NOT the light/purple Classic email template.
 */

const ACCENT = "#6ee7ff";
const BG = "#0a0a0a";
const CARD = "#101010";
const BORDER = "rgba(110,231,255,0.22)";
const TEXT = "#f4f4ef";
const MUTED = "#8a8a83";
const MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Dark/cyan email shell — table-based + inline styles for client compatibility. */
function shell(content: string): string {
  const app = getAppUrl();
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>MixReflect</title></head>
<body style="margin:0;padding:0;background-color:${BG};font-family:${SANS};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BG};">
    <tr><td align="center" style="padding:36px 18px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
        <!-- wordmark -->
        <tr><td align="left" style="padding:0 4px 22px;">
          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
            <td style="vertical-align:middle;"><div style="width:22px;height:22px;background:${ACCENT};border-radius:5px;"></div></td>
            <td style="vertical-align:middle;padding-left:10px;font-size:19px;font-weight:800;letter-spacing:-0.5px;color:${TEXT};">Mix<span style="color:${ACCENT};">Reflect</span></td>
          </tr></table>
        </td></tr>
        <!-- card -->
        <tr><td style="background-color:${CARD};border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
          <div style="padding:34px 32px;">${content}</div>
        </td></tr>
        <!-- footer -->
        <tr><td align="center" style="padding:22px 0 8px;">
          <p style="margin:0 0 6px;font-size:12px;color:${MUTED};font-family:${MONO};">
            instant ai scores · a room of real listeners
          </p>
          <p style="margin:0;font-size:12px;color:${MUTED};">
            <a href="${app}" style="color:${ACCENT};text-decoration:none;">mixreflect.com</a>
            &nbsp;·&nbsp;
            <a href="mailto:support@mixreflect.com" style="color:${MUTED};text-decoration:none;">support@mixreflect.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`.trim();
}

/** Cyan, square, bold — matches the on-site CTA. */
function button(text: string, url: string): string {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0 6px;"><tr>
    <td style="background-color:${ACCENT};padding:14px 30px;">
      <a href="${url}" style="color:#000;text-decoration:none;font-weight:800;font-size:14px;display:inline-block;font-family:${SANS};">${text}</a>
    </td>
  </tr></table>`;
}

function kicker(text: string): string {
  return `<p style="margin:0 0 14px;font-size:12px;letter-spacing:0.5px;color:${ACCENT};font-family:${MONO};">[ ${text} ]</p>`;
}
function h1(text: string): string {
  return `<h1 style="margin:0 0 12px;font-size:25px;line-height:1.15;font-weight:800;color:${TEXT};letter-spacing:-0.3px;">${text}</h1>`;
}
function p(text: string): string {
  return `<p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#c9c9c2;">${text}</p>`;
}

// ── A single human reaction just landed ─────────────────────────────
export async function sendScoreReviewLandedEmail(args: {
  to: string; trackTitle: string; slug: string; completed: number; total: number;
}): Promise<boolean> {
  const url = `${getAppUrl()}/report/${args.slug}`;
  const title = args.trackTitle || "your track";
  const content = `
    ${kicker("the room · live")}
    ${h1("A listener just reacted 🎧")}
    ${p(`Someone in your room left an honest reaction on <strong style="color:${TEXT};">${title}</strong>.`)}
    <div style="background:${BG};border:1px solid ${BORDER};border-radius:10px;padding:16px;margin:6px 0 4px;">
      <span style="font-size:18px;font-weight:800;color:${ACCENT};">${args.completed} of ${args.total}</span>
      <span style="font-size:14px;color:${MUTED};"> listeners in — more land as the room finishes.</span>
    </div>
    ${button("Read the reaction →", url)}`;
  return sendEmail({ to: args.to, subject: `🎧 a listener reacted to ${title}`, html: shell(content) });
}

// ── The whole room is in ────────────────────────────────────────────
export async function sendScoreRoomCompleteEmail(args: {
  to: string; trackTitle: string; slug: string; total: number;
}): Promise<boolean> {
  const url = `${getAppUrl()}/report/${args.slug}`;
  const title = args.trackTitle || "your track";
  const content = `
    ${kicker("the room · complete")}
    ${h1("The room&rsquo;s in ✓")}
    ${p(`All <strong style="color:${TEXT};">${args.total}</strong> listeners have reacted to <strong style="color:${TEXT};">${title}</strong>. Your full read is ready.`)}
    ${button("See the room's verdict →", url)}`;
  return sendEmail({ to: args.to, subject: `✓ the room's in on ${title}`, html: shell(content) });
}

// ── "What's new" announcement blast ─────────────────────────────────
export function buildNewMixReflectAnnouncement(userName?: string | null): { subject: string; html: string } {
  const app = getAppUrl();
  const name = userName ? userName.split(" ")[0] : null;
  const row = (emoji: string, title: string, body: string) => `
    <tr><td style="padding:15px 0;border-top:1px solid rgba(255,255,255,0.08);">
      <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:${TEXT};">${emoji} ${title}</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">${body}</p>
    </td></tr>`;
  const content = `
    ${kicker("mixreflect is changing")}
    ${h1("MixReflect just got a big upgrade 🎧")}
    ${p(`${name ? `Hey ${name}, we&rsquo;ve` : "We&rsquo;ve"} rebuilt MixReflect from the ground up. Same idea — honest feedback before you release — but now it&rsquo;s <strong style="color:${TEXT};">instant</strong>, and it comes from <strong style="color:${TEXT};">real ears</strong>.`)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0;">
      ${row("⚡", "An instant AI read", "Paste a link, get a score out of 100 with a verdict and a full breakdown across hook, production, retention, emotion and commercial pull — in seconds.")}
      ${row("👥", "A room of real listeners", "Real, paid listeners react to your track with honest, specific takes that land in your report as they come in. No grinding for credits, no waiting days.")}
      ${row("💸", "Get paid to listen", "Want to earn? Hear unreleased tracks first and get $0.40 for every honest two-minute reaction. Cash out at $10.")}
    </table>
    ${button("Score a track free →", app)}
    <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
      Already a MixReflect Pro? Your unlimited access carried straight over — nothing to do.
      Want to earn instead? <a href="${app}/reviewer" style="color:${ACCENT};text-decoration:none;">Get paid to review →</a>
    </p>`;
  return { subject: "MixReflect just got a big upgrade 🎧", html: shell(content) };
}

export async function sendNewMixReflectAnnouncement(to: string, userName?: string | null): Promise<boolean> {
  const { subject, html } = buildNewMixReflectAnnouncement(userName);
  return sendEmail({ to, subject, html });
}
