import { COLORS, getAppUrl, emailWrapper, emailButton, emailBadge, sendEmail } from "./templates";

export async function sendWelcomeEmail(params: { to: string; name?: string | null }) {
  if (!params.to) return;

  const firstName = params.name?.split(" ")[0] || "there";
  const appUrl = getAppUrl();

  const content = `
    ${emailBadge("Welcome to MixReflect 🎧", COLORS.purple)}
    <h1 style="margin: 0 0 12px; font-size: 26px; font-weight: 800; color: ${COLORS.black}; text-align: center; line-height: 1.2;">
      You're in, ${firstName} 👋
    </h1>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: ${COLORS.gray}; text-align: center;">
      MixReflect gives you a straight verdict on whether your track is ready to release —
      not ready, needs work, almost there, or release ready — then puts it in front of
      a room of five real listeners.
    </p>

    <div style="background-color: ${COLORS.bg}; border-radius: 14px; padding: 24px; margin-bottom: 20px;">
      <p style="margin: 0 0 16px; font-size: 12px; font-weight: 700; color: ${COLORS.grayLight}; text-transform: uppercase; letter-spacing: 0.8px;">How it works</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; vertical-align: top; width: 36px;">
            <span style="font-size: 22px; line-height: 1;">🎵</span>
          </td>
          <td style="padding: 10px 0 10px 14px; border-bottom: 1px solid ${COLORS.border}; vertical-align: top;">
            <p style="margin: 0 0 3px; font-size: 14px; font-weight: 700; color: ${COLORS.black};">Paste a link or upload your track</p>
            <p style="margin: 0; font-size: 13px; color: ${COLORS.gray}; line-height: 1.5;">SoundCloud, YouTube, Bandcamp or a direct MP3/WAV. Rough mixes and demos are welcome — most people use it before they release.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; vertical-align: top; width: 36px;">
            <span style="font-size: 22px; line-height: 1;">⚡</span>
          </td>
          <td style="padding: 10px 0 10px 14px; border-bottom: 1px solid ${COLORS.border}; vertical-align: top;">
            <p style="margin: 0 0 3px; font-size: 14px; font-weight: 700; color: ${COLORS.black};">Get your verdict — measured, in seconds</p>
            <p style="margin: 0; font-size: 13px; color: ${COLORS.gray}; line-height: 1.5;">The call on whether it's ready to release, measured against tracks that got released — backed by a score out of 100 across hook, production, retention, emotional impact and commercial pull.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; vertical-align: top; width: 36px;">
            <span style="font-size: 22px; line-height: 1;">👂</span>
          </td>
          <td style="padding: 10px 0 10px 14px; vertical-align: top;">
            <p style="margin: 0 0 3px; font-size: 14px; font-weight: 700; color: ${COLORS.black};">Then hear from the room of five</p>
            <p style="margin: 0; font-size: 13px; color: ${COLORS.gray}; line-height: 1.5;">After the verdict, five real, paid listeners react honestly — not bots, not curators — so you know exactly what to fix before you drop.</p>
          </td>
        </tr>
      </table>
    </div>

    <div style="background-color: ${COLORS.purpleLight}; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
      <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: ${COLORS.purple}; text-transform: uppercase; letter-spacing: 0.5px;">Your first verdict is free</p>
      <p style="margin: 0; font-size: 14px; color: ${COLORS.gray}; line-height: 1.6;">
        No card needed — get the verdict, the score and your three biggest fixes. After that, unlock any track for a one-time
        <strong style="color: ${COLORS.black};">$6.95</strong> (which also sends it to the room of five), or go
        <strong style="color: ${COLORS.black};">unlimited at $19.95/month</strong>.
      </p>
    </div>

    ${emailButton("Get your first verdict →", `${appUrl}/`)}

    <p style="margin: 0 0 8px; font-size: 13px; color: ${COLORS.grayLight}; text-align: center; line-height: 1.6;">
      Questions? Just reply to this email or reach us at<br>
      <a href="mailto:support@mixreflect.com" style="color: ${COLORS.gray}; font-weight: 600; text-decoration: none;">support@mixreflect.com</a>
    </p>
    <p style="margin: 0; font-size: 13px; color: ${COLORS.grayLight}; text-align: center;">
      — Kris &amp; the MixReflect team
    </p>
  `;

  await sendEmail({
    to: params.to,
    subject: "Welcome to MixReflect 🎧",
    html: emailWrapper(content),
  });
}
