import { COLORS, getAppUrl, emailWrapper, emailButton, sendEmail } from "./templates";

export async function sendPurchaseConfirmationEmail(params: {
  buyerEmail: string;
  buyerName?: string;
  trackTitle: string;
  artistName: string;
  downloadUrl?: string;
  purchaseId: string;
}) {
  if (!params.buyerEmail) return;

  const greeting = params.buyerName ? `Hi ${params.buyerName}` : "Hi";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: ${COLORS.purple}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
        Purchase Complete
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Your download is ready!
    </h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      ${greeting}, thank you for supporting ${params.artistName} by purchasing "<strong>${params.trackTitle}</strong>".
    </p>
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-size: 12px; color: ${COLORS.grayLight}; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">
        Track
      </p>
      <p style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
        ${params.trackTitle}
      </p>
      <p style="margin: 0; font-size: 14px; color: ${COLORS.gray}; text-align: center;">
        by <strong style="color: ${COLORS.black};">${params.artistName}</strong>
      </p>
    </div>
    ${params.downloadUrl ? emailButton("Download Track", params.downloadUrl) : ""}
    ${!params.downloadUrl ? `
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
        Your download link is being generated. You'll receive another email shortly with the download button.
      </p>
    ` : ""}
    <div style="border-top: 1px solid ${COLORS.border}; padding-top: 16px; margin-top: 8px;">
      <p style="margin: 0 0 8px; font-size: 13px; color: ${COLORS.gray}; text-align: center;">
        <strong style="color: ${COLORS.black};">Download link valid for 7 days</strong>
      </p>
      <p style="margin: 0; font-size: 13px; color: ${COLORS.gray}; text-align: center;">
        You can re-download anytime by visiting: <a href="${getAppUrl()}/purchases/${params.purchaseId}/download" style="color: ${COLORS.black};">your download page</a>
      </p>
    </div>
  `;

  await sendEmail({
    to: params.buyerEmail,
    subject: `Your download is ready: ${params.trackTitle}`,
    html: emailWrapper(content),
  });
}
