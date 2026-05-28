import { COLORS, getAppUrl, emailWrapper, emailButton, sendEmail } from "./templates";

export async function sendCreditsNudgeEmail(params: {
  to: string;
  name: string;
  credits: number;
  trackTitle?: string;
  trackId?: string;
}) {
  const { name, credits, trackTitle, trackId } = params;
  const appUrl = getAppUrl();
  const firstName = name?.split(" ")[0] || "there";

  const submitUrl = trackId
    ? `${appUrl}/tracks/${trackId}/request-reviews`
    : `${appUrl}/submit`;

  const ctaLabel = trackTitle
    ? `Queue "${trackTitle}" for review →`
    : "Submit your first track →";

  const bodyText = trackTitle
    ? `You've got <strong style="color: ${COLORS.black};">${credits} credits</strong> sitting unused. Queue up "${trackTitle}" and get real ears on it — each credit gets you one structured review back.`
    : `You've got <strong style="color: ${COLORS.black};">${credits} credit${credits === 1 ? "" : "s"}</strong> sitting unused. Each credit gets you one structured review — scores, written feedback, and a release verdict.`;

  const content = `
    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800; color: ${COLORS.black}; line-height: 1.2;">
      Hey ${firstName}, you've got ${credits} credit${credits === 1 ? "" : "s"} doing nothing.
    </h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.6;">
      ${bodyText}
    </p>

    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border};">
            <p style="margin: 0; font-size: 13px; color: ${COLORS.gray};">✓ Production score</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border};">
            <p style="margin: 0; font-size: 13px; color: ${COLORS.gray};">✓ Written feedback from a real artist</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border};">
            <p style="margin: 0; font-size: 13px; color: ${COLORS.gray};">✓ Listener intent data (would they share it?)</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <p style="margin: 0; font-size: 13px; color: ${COLORS.gray};">✓ Release verdict</p>
          </td>
        </tr>
      </table>
    </div>

    ${emailButton(ctaLabel, submitUrl)}

    <p style="margin: 16px 0 0; font-size: 13px; color: ${COLORS.grayLight}; text-align: center;">
      Or <a href="${appUrl}/review" style="color: ${COLORS.gray}; font-weight: 600;">review a track</a> to earn even more.
    </p>
  `;

  await sendEmail({
    to: params.to,
    subject: `You've got ${credits} credit${credits === 1 ? "" : "s"} sitting unused`,
    html: emailWrapper(content),
  });
}
