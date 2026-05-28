import { COLORS, getAppUrl, emailWrapper, emailButton, sendEmail } from "./templates";

export async function sendWeeklyDigestEmail(params: {
  to: string;
  name: string;
  creditsEarned: number;
  reviewsReceived: number;
  genreTrackCount: number;
  trackTitle?: string;
  trackId?: string;
}) {
  const { name, creditsEarned, reviewsReceived, genreTrackCount, trackTitle, trackId } = params;
  const appUrl = getAppUrl();
  const firstName = name?.split(" ")[0] || "there";

  const hasActivity = creditsEarned > 0 || reviewsReceived > 0;

  const earningsSection = creditsEarned > 0 ? `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid ${COLORS.border};">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <p style="margin: 0; font-size: 14px; color: ${COLORS.gray};">Credits earned this week</p>
            </td>
            <td style="text-align: right;">
              <p style="margin: 0; font-size: 18px; font-weight: 800; color: ${COLORS.purple};">+${creditsEarned}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : "";

  const reviewsSection = reviewsReceived > 0 ? `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid ${COLORS.border};">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <p style="margin: 0; font-size: 14px; color: ${COLORS.gray};">
                New reviews on ${trackTitle ? `"${trackTitle}"` : "your tracks"}
              </p>
            </td>
            <td style="text-align: right;">
              <p style="margin: 0; font-size: 18px; font-weight: 800; color: ${COLORS.black};">${reviewsReceived}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : "";

  const queueSection = genreTrackCount > 0 ? `
    <tr>
      <td style="padding: 14px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <p style="margin: 0; font-size: 14px; color: ${COLORS.gray};">Tracks in your genre needing ears</p>
            </td>
            <td style="text-align: right;">
              <p style="margin: 0; font-size: 18px; font-weight: 800; color: ${COLORS.black};">${genreTrackCount}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : "";

  const ctaUrl = trackId ? `${appUrl}/tracks/${trackId}` : `${appUrl}/dashboard`;
  const primaryCta = reviewsReceived > 0
    ? emailButton("Read your reviews →", ctaUrl)
    : emailButton("Go to dashboard →", `${appUrl}/dashboard`);

  const earnCta = genreTrackCount > 0 ? `
    <p style="margin: 20px 0 8px; font-size: 14px; color: ${COLORS.gray}; text-align: center;">
      ${genreTrackCount} track${genreTrackCount === 1 ? "" : "s"} waiting — each review earns +1 credit.
    </p>
    ${emailButton("Review & earn →", `${appUrl}/review`, "secondary")}
  ` : "";

  const headerImageUrl = `${appUrl}/blog/blog1.jpg`;

  const content = `
    <img src="${headerImageUrl}" alt="" width="520" style="display: block; width: 100%; max-width: 520px; height: 220px; object-fit: cover; border-radius: 12px; margin-bottom: 24px;" />
    <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: ${COLORS.black}; line-height: 1.2;">
      Hey ${firstName} — your week on MixReflect
    </h1>
    <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.6;">
      ${hasActivity ? "Here's what happened this week." : "Nothing happened this week — but your queue is waiting."}
    </p>

    ${(earningsSection || reviewsSection || queueSection) ? `
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 4px 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${earningsSection}
        ${reviewsSection}
        ${queueSection}
      </table>
    </div>
    ` : `
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0; font-size: 15px; color: ${COLORS.gray};">
        No activity yet — review a track to get things moving.
      </p>
    </div>
    `}

    ${primaryCta}
    ${earnCta}

    <p style="margin: 20px 0 0; font-size: 12px; color: ${COLORS.grayLight}; text-align: center;">
      — Kris &amp; the MixReflect team
    </p>
  `;

  await sendEmail({
    to: params.to,
    subject: reviewsReceived > 0
      ? `${reviewsReceived} new review${reviewsReceived === 1 ? "" : "s"} on your track this week`
      : creditsEarned > 0
        ? `You earned ${creditsEarned} credit${creditsEarned === 1 ? "" : "s"} this week — spend them`
        : `${genreTrackCount} tracks in your genre need ears this week`,
    html: emailWrapper(content),
  });
}
