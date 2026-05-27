import { COLORS, getAppUrl, emailWrapper, emailButton, emailBadge, sendEmail } from "./templates";

export async function sendWelcomeEmail(params: { to: string; name?: string | null }) {
  if (!params.to) return;

  const firstName = params.name?.split(" ")[0] || "there";
  const appUrl = getAppUrl();

  const content = `
    ${emailBadge("Welcome to MixReflect 🎵", COLORS.purple)}
    <h1 style="margin: 0 0 12px; font-size: 26px; font-weight: 800; color: ${COLORS.black}; text-align: center; line-height: 1.2;">
      Hey ${firstName}, welcome to the community 👋
    </h1>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: ${COLORS.gray}; text-align: center;">
      MixReflect is built by artists, for artists. Stoked to have you here.
    </p>

    <div style="background-color: ${COLORS.bg}; border-radius: 14px; padding: 24px; margin-bottom: 20px;">
      <p style="margin: 0 0 16px; font-size: 12px; font-weight: 700; color: ${COLORS.grayLight}; text-transform: uppercase; letter-spacing: 0.8px;">How it works</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; vertical-align: top; width: 36px;">
            <span style="font-size: 22px; line-height: 1;">🎧</span>
          </td>
          <td style="padding: 10px 0 10px 14px; border-bottom: 1px solid ${COLORS.border}; vertical-align: top;">
            <p style="margin: 0 0 3px; font-size: 14px; font-weight: 700; color: ${COLORS.black};">Review other artists — earn credits</p>
            <p style="margin: 0; font-size: 13px; color: ${COLORS.gray}; line-height: 1.5;">Listen to tracks in your genre and leave structured honest feedback. Every completed review earns you credits.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; vertical-align: top; width: 36px;">
            <span style="font-size: 22px; line-height: 1;">🎵</span>
          </td>
          <td style="padding: 10px 0 10px 14px; border-bottom: 1px solid ${COLORS.border}; vertical-align: top;">
            <p style="margin: 0 0 3px; font-size: 14px; font-weight: 700; color: ${COLORS.black};">Submit your track — spend credits</p>
            <p style="margin: 0; font-size: 13px; color: ${COLORS.gray}; line-height: 1.5;">Queue your track for genre-matched reviewers. Each review includes detailed notes, ratings, and timestamp annotations.</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; vertical-align: top; width: 36px;">
            <span style="font-size: 22px; line-height: 1;">📊</span>
          </td>
          <td style="padding: 10px 0 10px 14px; vertical-align: top;">
            <p style="margin: 0 0 3px; font-size: 14px; font-weight: 700; color: ${COLORS.black};">Get actionable feedback</p>
            <p style="margin: 0; font-size: 13px; color: ${COLORS.gray}; line-height: 1.5;">See scores, listener intent data, and a release readiness verdict so you know exactly what to fix before you drop.</p>
          </td>
        </tr>
      </table>
    </div>

    <div style="background-color: #f3e8ff; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
      <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: ${COLORS.purple}; text-transform: uppercase; letter-spacing: 0.5px;">Need credits without the grind?</p>
      <p style="margin: 0; font-size: 14px; color: ${COLORS.gray}; line-height: 1.6;">
        Grab a <strong style="color: ${COLORS.black};">10-credit pack for $9.95</strong> — they never expire. Or go <strong style="color: ${COLORS.black};">Pro at $24.95/month</strong> for 30 credits every billing period, priority queue placement, up to 3 tracks in review at once, and unlimited reviews per day.
      </p>
    </div>

    ${emailButton("Start reviewing & earning credits →", `${appUrl}/review`)}

    <p style="margin: 0 0 8px; font-size: 13px; color: ${COLORS.grayLight}; text-align: center; line-height: 1.6;">
      Questions? Just reply to this email or hit us at<br>
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
