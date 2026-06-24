import { getAppUrl, sendEmail } from "./templates";
import { UNLOCK_PRICE_CENTS, scoreSubPrice } from "@/lib/score-pricing";

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
        <!-- wordmark: cyan rounded-square mark with centered equaliser bars + Mix·Reflect -->
        <tr><td align="left" style="padding:0 4px 22px;">
          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
            <td style="vertical-align:middle;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="width:30px;height:30px;background:${ACCENT};border-radius:8px;"><tr>
                <td align="center" style="vertical-align:middle;">
                  <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="height:30px;"><tr>
                    <td style="vertical-align:middle;padding:0 1px;"><div style="width:3px;height:5px;background:${BG};border-radius:1px;line-height:5px;font-size:0;">&nbsp;</div></td>
                    <td style="vertical-align:middle;padding:0 1px;"><div style="width:3px;height:10px;background:${BG};border-radius:1px;line-height:10px;font-size:0;">&nbsp;</div></td>
                    <td style="vertical-align:middle;padding:0 1px;"><div style="width:3px;height:14px;background:${BG};border-radius:1px;line-height:14px;font-size:0;">&nbsp;</div></td>
                    <td style="vertical-align:middle;padding:0 1px;"><div style="width:3px;height:8px;background:${BG};border-radius:1px;line-height:8px;font-size:0;">&nbsp;</div></td>
                    <td style="vertical-align:middle;padding:0 1px;"><div style="width:3px;height:5px;background:${BG};border-radius:1px;line-height:5px;font-size:0;">&nbsp;</div></td>
                  </tr></table>
                </td>
              </tr></table>
            </td>
            <td style="vertical-align:middle;padding-left:11px;font-size:20px;letter-spacing:-0.4px;color:${TEXT};"><span style="font-weight:800;">Mix</span><span style="font-weight:400;color:${MUTED};">Reflect</span></td>
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

// ── "New MixReflect + why Unlimited" announcement blast ──────────────
// A warm reminder that MixReflect is rebuilt, leading into the case for
// going Unlimited. Full-price (no coupon) — for the whole user base.
export function buildUnlimitedAnnouncement(userName?: string | null): { subject: string; html: string } {
  const app = getAppUrl();
  const name = userName ? userName.split(" ")[0] : null;
  const monthly = `$${(scoreSubPrice("monthly").amount / 100).toFixed(2)}`;
  const annual = `$${(scoreSubPrice("annual").amount / 100).toFixed(2)}`;
  const unlock = `$${(UNLOCK_PRICE_CENTS / 100).toFixed(2)}`;

  const check = (text: string) => `
    <tr><td style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.08);">
      <p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};"><span style="color:${ACCENT};">✓</span>&nbsp; ${text}</p>
    </td></tr>`;

  const content = `
    ${kicker("mixreflect · new + unlimited")}
    ${h1("The new MixReflect &mdash; and why Unlimited&rsquo;s worth it 🎧")}
    ${p(`${name ? `Hey ${name}, if` : "If"} you haven&rsquo;t been back in a bit, MixReflect is a different thing now. Same idea &mdash; honest feedback before you release &mdash; but it&rsquo;s <strong style="color:${TEXT};">instant</strong>, and it comes from <strong style="color:${TEXT};">real ears</strong>.`)}
    ${p(`Paste a link and you get a score out of 100 with a verdict and a full breakdown in seconds. Then a room of real, paid listeners reacts to your track with honest, specific takes that land in your report as they come in. No grinding for credits, no waiting days.`)}
    ${p(`Your first report&rsquo;s on us. After that, here&rsquo;s the thing about going <strong style="color:${TEXT};">Unlimited</strong>:`)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:4px 0 8px;">
      ${check(`Every report fully unlocked &mdash; score, verdict, and the full breakdown, no seal`)}
      ${check(`A room of real listeners on every track you submit`)}
      ${check(`Submit as many tracks as you want while you&rsquo;re subscribed`)}
      ${check(`Go annual and it works out to about 40% less per month`)}
    </table>
    <div style="background:${BG};border:1px solid ${BORDER};border-radius:10px;padding:16px;margin:10px 0 4px;">
      <p style="margin:0 0 6px;font-size:14px;color:${MUTED};"><span style="font-size:17px;font-weight:800;color:${TEXT};">${unlock}</span> one-time &mdash; unlock a single report</p>
      <p style="margin:0;font-size:14px;color:${MUTED};"><span style="font-size:17px;font-weight:800;color:${ACCENT};">${monthly}/mo</span> unlimited &mdash; or ${annual}/yr, save ~40%</p>
    </div>
    ${button("Go Unlimited →", `${app}/#pricing`)}
    <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
      Not ready? Just <a href="${app}" style="color:${ACCENT};text-decoration:none;">score a track free →</a> and see what the room says.
    </p>`;

  return { subject: "The new MixReflect — and why Unlimited's worth it 🎧", html: shell(content) };
}

export async function sendUnlimitedAnnouncement(to: string, userName?: string | null): Promise<boolean> {
  const { subject, html } = buildUnlimitedAnnouncement(userName);
  return sendEmail({ to, subject, html });
}

// ── Win-back offer: 50% off the first month of Unlimited ───────────
// Manual send (admin) to free signups who never converted. The CTA hits
// /api/score/subscribe/offer which applies the coupon and 302s into checkout.
export function buildUnlimitedOfferEmail(args: {
  email: string;
  userName?: string | null;
}): { subject: string; html: string } {
  const app = getAppUrl();
  const name = args.userName ? args.userName.split(" ")[0] : null;
  const monthly = scoreSubPrice("monthly").amount;
  const full = `$${(monthly / 100).toFixed(2)}`;
  const half = `$${(Math.floor(monthly / 2) / 100).toFixed(2)}`;
  const claimUrl = `${app}/api/score/subscribe/offer?email=${encodeURIComponent(args.email)}`;

  const row = (text: string) => `
    <tr><td style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.08);">
      <p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};"><span style="color:${ACCENT};">✓</span>&nbsp; ${text}</p>
    </td></tr>`;

  const content = `
    ${kicker("unlimited · 50% off your first month")}
    ${h1(`${name ? `Hey ${name} — your` : "Your"} first month, half price 🎧`)}
    ${p(`You scored a track on MixReflect, then it went quiet. So here&rsquo;s a reason to come back: <strong style="color:${TEXT};">Unlimited at 50% off your first month</strong>.`)}
    ${p(`Unlimited means every track you submit gets the full treatment:`)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:4px 0 8px;">
      ${row(`Every report fully unlocked — score out of 100, verdict, and the full breakdown`)}
      ${row(`A room of real listeners on every track — honest reactions from real ears`)}
      ${row(`Submit as many tracks as you want while you&rsquo;re subscribed`)}
    </table>
    <div style="background:${BG};border:1px solid ${BORDER};border-radius:10px;padding:16px;margin:10px 0 4px;">
      <span style="font-size:15px;color:${MUTED};text-decoration:line-through;">${full}</span>
      <span style="font-size:20px;font-weight:800;color:${ACCENT};">&nbsp;${half}</span>
      <span style="font-size:14px;color:${MUTED};"> your first month — then ${full}/mo, cancel anytime.</span>
    </div>
    ${button("Claim 50% off →", claimUrl)}
    <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
      The link applies the discount automatically at checkout — no code to type. Monthly plan only.
    </p>`;

  return { subject: "your first month of unlimited — 50% off 🎧", html: shell(content) };
}

export async function sendUnlimitedOfferEmail(args: {
  to: string;
  userName?: string | null;
}): Promise<boolean> {
  const { subject, html } = buildUnlimitedOfferEmail({ email: args.to, userName: args.userName });
  return sendEmail({ to: args.to, subject, html });
}

// ── Sealed-report reminder: scored but never unlocked ───────────────
// Nudge for submitters whose report finished but who never paid. Reminds them
// the read is done + sealed, and upsells the room of real listeners.
export function buildReportReminderEmail(args: {
  trackTitle?: string | null;
  slug: string;
}): { subject: string; html: string } {
  const app = getAppUrl();
  const title = args.trackTitle || "your track";
  const url = `${app}/report/${args.slug}`;
  const unlock = `$${(UNLOCK_PRICE_CENTS / 100).toFixed(2)}`;
  const monthly = `$${(scoreSubPrice("monthly").amount / 100).toFixed(2)}`;

  const content = `
    ${kicker("your report · still sealed")}
    ${h1("The read on your track is done. It&rsquo;s just sealed.")}
    ${p(`We ran the full read on <strong style="color:${TEXT};">${title}</strong> — a score out of 100, a verdict, what&rsquo;s working, and the first thing to fix. It&rsquo;s all sitting in your report, sealed until you open it.`)}
    ${p(`Unlocking also puts <strong style="color:${TEXT};">${title}</strong> in front of a room of real listeners — actual people, paid to listen, whose honest reactions land in your report as they come in. Not just the machine&rsquo;s opinion.`)}
    <div style="background:${BG};border:1px solid ${BORDER};border-radius:10px;padding:16px;margin:6px 0 4px;">
      <p style="margin:0 0 6px;font-size:14px;color:${MUTED};"><span style="font-size:17px;font-weight:800;color:${ACCENT};">${unlock}</span> one-time — unlock this report in full</p>
      <p style="margin:0;font-size:14px;color:${MUTED};"><span style="font-size:17px;font-weight:800;color:${TEXT};">${monthly}/mo</span> unlimited — every track you submit, fully unlocked</p>
    </div>
    ${button("Open your report →", url)}
    <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
      Your report doesn&rsquo;t expire — but the longer the track sits, the longer you&rsquo;re guessing.
    </p>`;

  return { subject: `the read on ${title} is done — still sealed`, html: shell(content) };
}

export async function sendReportReminderEmail(args: {
  to: string;
  trackTitle?: string | null;
  slug: string;
}): Promise<boolean> {
  const { subject, html } = buildReportReminderEmail(args);
  return sendEmail({ to: args.to, subject, html });
}

// ── Second-track nudge: unlocked once, never came back ───────────────
// For submitters who paid to unlock a report but never submitted another.
// Reminds them how it works and points them back to score a new track.
export function buildSecondTrackEmail(args: {
  name?: string | null;
  trackTitle?: string | null;
}): { subject: string; html: string } {
  const app = getAppUrl();
  const name = args.name ? args.name.split(" ")[0] : null;
  const title = args.trackTitle || "your track";
  const url = `${app}/submit-score`;
  const monthly = `$${(scoreSubPrice("monthly").amount / 100).toFixed(2)}`;

  const content = `
    ${kicker("got another one?")}
    ${h1("Got another track? Run it back.")}
    ${p(`${name ? `Hey ${name}, you` : "You"} ran <strong style="color:${TEXT};">${title}</strong> through MixReflect, unlocked the full read, and put it in front of the room of five. Hope it was useful.`)}
    ${p(`Got another one in the works? You know how it goes: paste the link, get the score, and hear what real listeners think before you release.`)}
    ${button("Score another track →", url)}
    <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
      Shipping a few? Unlimited at ${monthly}/mo unlocks every track you submit.
    </p>`;

  return { subject: "got another track? run it back", html: shell(content) };
}

export async function sendSecondTrackEmail({ to, name, trackTitle }: {
  to: string;
  name?: string | null;
  trackTitle?: string | null;
}): Promise<boolean> {
  const { subject, html } = buildSecondTrackEmail({ name, trackTitle });
  return sendEmail({ to, subject, html });
}
