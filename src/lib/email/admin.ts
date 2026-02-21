import { COLORS, getAppUrl, ADMIN_EMAIL, emailWrapper, emailButton, sendEmail } from "./templates";

export async function sendAdminNewTrackNotification(params: {
  trackTitle: string;
  artistEmail: string;
  packageType: string;
  reviewsRequested: number;
  isPromo: boolean;
  promoCode?: string;
}) {
  const { trackTitle, artistEmail, packageType, reviewsRequested, isPromo, promoCode } = params;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: ${isPromo ? "#a855f7" : COLORS.purple}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
        ${isPromo ? `Promo: ${promoCode}` : "New Submission"}
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      New track submitted
    </h1>
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border};">
            <span style="font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase;">Track</span><br>
            <span style="font-size: 16px; font-weight: 700; color: ${COLORS.black};">${trackTitle}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border};">
            <span style="font-size: 12px; color: ${COLORS.gray}; text-transform: uppercase;">Artist</span><br>
            <span style="font-size: 14px; color: ${COLORS.black};">${artistEmail}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border};">
            <span style="font-size: 12px; color: ${COLORS.gray}; text-transform: uppercase;">Package</span><br>
            <span style="font-size: 14px; font-weight: 600; color: ${COLORS.black};">${isPromo ? `PROMO (${promoCode})` : packageType}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="font-size: 12px; color: ${COLORS.gray}; text-transform: uppercase;">Reviews</span><br>
            <span style="font-size: 14px; color: ${COLORS.black};">${reviewsRequested}</span>
          </td>
        </tr>
      </table>
    </div>
    ${emailButton("View in Admin", `${getAppUrl()}/admin/tracks`)}
  `;

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `🎵 New track: ${trackTitle}${isPromo ? " (PROMO)" : ""}`,
    html: emailWrapper(content),
  });
}
