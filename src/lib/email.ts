type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  required?: boolean;
};

// Admin notification email
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "kris.engelhardt4@gmail.com";

// Brand colors - exported for preview
export const COLORS = {
  black: "#000000",
  white: "#ffffff",
  lime: "#84cc16",
  gray: "#525252",
  lightGray: "#f5f5f5",
  border: "#e5e5e5",
};

// Base email wrapper template - exported for preview
export function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MixReflect</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.lightGray}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${COLORS.lightGray};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: ${COLORS.white}; border: 2px solid ${COLORS.black}; box-shadow: 4px 4px 0px 0px ${COLORS.black};">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 32px 40px 24px; border-bottom: 2px solid ${COLORS.black};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle;">
                          <img src="https://mixreflect.com/email-logo.png" alt="MixReflect" width="36" height="36" style="display:block;width:36px;height:36px;" />
                        </td>
                        <td style="vertical-align: middle; padding-left: 12px;">
                          <span style="font-size: 22px; font-weight: 700; color: ${COLORS.black}; letter-spacing: -0.5px;">mixreflect</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${COLORS.lightGray}; border-top: 2px solid ${COLORS.black};">
              <p style="margin: 0 0 8px; font-size: 13px; color: ${COLORS.gray}; text-align: center;">
                This email was sent by MixReflect
              </p>
              <p style="margin: 0; font-size: 13px; color: ${COLORS.gray}; text-align: center;">
                <a href="https://mixreflect.com" style="color: ${COLORS.black}; text-decoration: none; font-weight: 600;">mixreflect.com</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Sub-footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px;">
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: ${COLORS.gray};">
                Questions? Reply to this email or contact <a href="mailto:support@mixreflect.com" style="color: ${COLORS.black};">support@mixreflect.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Reusable button component - centered by default, exported for preview
export function emailButton(text: string, url: string, variant: "primary" | "secondary" = "primary"): string {
  const isPrimary = variant === "primary";
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td style="background-color: ${isPrimary ? COLORS.black : COLORS.white}; border: 2px solid ${COLORS.black}; padding: 14px 28px;">
                <a href="${url}" style="color: ${isPrimary ? COLORS.white : COLORS.black}; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">${text}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

async function sendEmail({ to, subject, html, required }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM;

  if (!apiKey || !from) {
    console.warn("Email not sent (missing RESEND_API_KEY or RESEND_FROM_EMAIL/RESEND_FROM)", {
      to,
      subject,
      hasApiKey: Boolean(apiKey),
      hasFrom: Boolean(from),
    });

    if (required) {
      throw new Error("Email service is not configured");
    }
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("Resend email request failed", {
      status: res.status,
      to,
      subject,
      body,
    });

    if (required) {
      throw new Error(`Email send failed (${res.status})`);
    }
    return false;
  }

  return true;
}

export async function sendTierChangeEmail(params: {
  to: string;
  newTier: string;
  newRateCents: number;
}) {
  if (!params.to) return;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: ${COLORS.lime}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Level Up!
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      You're now ${params.newTier}
    </h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Congratulations! Your consistent high-quality reviews have earned you a tier upgrade.
    </p>
    <div style="background-color: ${COLORS.lightGray}; border: 2px solid ${COLORS.black}; padding: 20px; text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 14px; color: ${COLORS.gray};">New earning rate</p>
      <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${COLORS.black};">$${(params.newRateCents / 100).toFixed(2)}</p>
      <p style="margin: 4px 0 0; font-size: 14px; color: ${COLORS.gray};">per review</p>
    </div>
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Keep submitting thoughtful, detailed feedback to maintain your status and continue earning more.
    </p>
  `;

  await sendEmail({
    to: params.to,
    subject: `🎉 You're now ${params.newTier} on MixReflect`,
    html: emailWrapper(content),
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}) {
  if (!params.to) return;

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black};">
      Reset your password
    </h1>
    <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray};">
      We received a request to reset your password. Click the button below to choose a new one.
    </p>
    ${emailButton("Reset Password", params.resetUrl)}
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
      This link will expire in <strong>1 hour</strong> for security reasons.
    </p>
    <div style="border-top: 1px solid ${COLORS.border}; padding-top: 16px; margin-top: 8px;">
      <p style="margin: 0; font-size: 13px; color: ${COLORS.gray};">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>
  `;

  await sendEmail({
    to: params.to,
    subject: "Reset your MixReflect password",
    html: emailWrapper(content),
    required: true,
  });
}

export async function sendEmailVerificationEmail(params: {
  to: string;
  verifyUrl: string;
}) {
  if (!params.to) return;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: ${COLORS.lime}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Welcome to MixReflect
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Verify your email address
    </h1>
    <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Thanks for signing up! Please confirm your email address to complete your account setup and get started.
    </p>
    ${emailButton("Verify Email Address", params.verifyUrl)}
    <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      This link will expire in <strong>24 hours</strong>.
    </p>
    <div style="border-top: 1px solid ${COLORS.border}; padding-top: 16px;">
      <p style="margin: 0 0 8px; font-size: 13px; color: ${COLORS.gray}; text-align: center;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="margin: 0; font-size: 12px; color: ${COLORS.gray}; word-break: break-all; text-align: center;">
        <a href="${params.verifyUrl}" style="color: ${COLORS.black};">${params.verifyUrl}</a>
      </p>
    </div>
  `;

  await sendEmail({
    to: params.to,
    subject: "Verify your email - MixReflect",
    html: emailWrapper(content),
    required: true,
  });
}

export async function sendFinishLaterEmail(params: {
  to: string;
  resumeUrl: string;
}) {
  if (!params.to) return;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: ${COLORS.lime}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Finish later
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Pick this up when you’re back at your computer
    </h1>
    <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Here’s a link back to MixReflect so you can submit your track and get feedback.
    </p>
    ${emailButton("Continue on MixReflect", params.resumeUrl)}
    <div style="border-top: 1px solid ${COLORS.border}; padding-top: 16px; margin-top: 8px;">
      <p style="margin: 0; font-size: 12px; color: ${COLORS.gray}; word-break: break-all; text-align: center;">
        <a href="${params.resumeUrl}" style="color: ${COLORS.black};">${params.resumeUrl}</a>
      </p>
    </div>
  `;

  await sendEmail({
    to: params.to,
    subject: "Finish your MixReflect submission",
    html: emailWrapper(content),
  });
}

export async function sendTrackQueuedEmail(artistEmail: string, trackTitle: string) {
  if (!artistEmail) return;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: ${COLORS.lime}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Track Submitted
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Your track is in the queue
    </h1>
    <div style="background-color: ${COLORS.lightGray}; border: 2px solid ${COLORS.black}; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.gray}; text-transform: uppercase; letter-spacing: 0.5px;">Track</p>
      <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${COLORS.black};">${trackTitle}</p>
    </div>
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray};">
      Great news! Your track has been queued and is now being matched with reviewers based on genre preferences.
    </p>
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
      <strong>What happens next:</strong><br>
      We'll email you updates at 50% and 100% completion. Most tracks receive all reviews within 24 hours.
    </p>
  `;

  await sendEmail({
    to: artistEmail,
    subject: `🎵 Track queued for review: ${trackTitle}`,
    html: emailWrapper(content),
  });
}

export async function sendReviewProgressEmail(
  artistEmail: string,
  trackTitle: string,
  reviewCount: number,
  totalReviews: number
) {
  if (!artistEmail) return;

  const pct = Math.round((reviewCount / Math.max(1, totalReviews)) * 100);
  const isComplete = reviewCount >= totalReviews;

  const progressBar = `
    <div style="background-color: ${COLORS.lightGray}; border: 2px solid ${COLORS.black}; padding: 4px; margin-bottom: 24px;">
      <div style="background-color: ${isComplete ? COLORS.lime : COLORS.black}; height: 24px; width: ${pct}%; transition: width 0.3s;"></div>
    </div>
  `;

  const content = isComplete
    ? `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: ${COLORS.lime}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
          Complete!
        </div>
      </div>
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
        All reviews are in!
      </h1>
      <div style="background-color: ${COLORS.lightGray}; border: 2px solid ${COLORS.black}; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.gray}; text-transform: uppercase; letter-spacing: 0.5px;">Track</p>
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${COLORS.black};">${trackTitle}</p>
      </div>
      ${progressBar}
      <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
        <strong>${reviewCount} of ${totalReviews}</strong> reviews completed
      </p>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
        Your feedback is ready! Log in to read all reviews and rate them.
      </p>
      ${emailButton("View Your Reviews", "https://mixreflect.com/artist/dashboard")}
    `
    : `
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
        Review progress update
      </h1>
      <div style="background-color: ${COLORS.lightGray}; border: 2px solid ${COLORS.black}; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.gray}; text-transform: uppercase; letter-spacing: 0.5px;">Track</p>
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${COLORS.black};">${trackTitle}</p>
      </div>
      ${progressBar}
      <p style="margin: 0 0 24px; font-size: 18px; line-height: 1.6; color: ${COLORS.black}; text-align: center; font-weight: 700;">
        ${pct}% complete — ${reviewCount} of ${totalReviews} reviews
      </p>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
        Reviews are coming in! You can already view completed reviews in your dashboard.
      </p>
      ${emailButton("View Progress", "https://mixreflect.com/artist/dashboard", "secondary")}
    `;

  await sendEmail({
    to: artistEmail,
    subject: isComplete
      ? `✅ All reviews are in for: ${trackTitle}`
      : `📊 ${pct}% complete: ${trackTitle}`,
    html: emailWrapper(content),
  });
}

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
      <div style="display: inline-block; background-color: ${isPromo ? "#a855f7" : COLORS.lime}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${isPromo ? "#ffffff" : COLORS.black};">
        ${isPromo ? `Promo: ${promoCode}` : "New Submission"}
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      New track submitted
    </h1>
    <div style="background-color: ${COLORS.lightGray}; border: 2px solid ${COLORS.black}; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border};">
            <span style="font-size: 12px; color: ${COLORS.gray}; text-transform: uppercase;">Track</span><br>
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
    ${emailButton("View in Admin", "https://mixreflect.com/admin/tracks")}
  `;

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `🎵 New track: ${trackTitle}${isPromo ? " (PROMO)" : ""}`,
    html: emailWrapper(content),
  });
}

export async function sendInvalidTrackLinkEmail(params: {
  to: string;
  trackTitle: string;
  trackId: string;
  sourceUrl: string;
}) {
  if (!params.to) return;

  const trackPageUrl = `https://mixreflect.com/artist/tracks/${params.trackId}`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: #ef4444; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff;">
        Action Required
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Your track link needs attention
    </h1>
    <div style="background-color: ${COLORS.lightGray}; border: 2px solid ${COLORS.black}; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.gray}; text-transform: uppercase; letter-spacing: 0.5px;">Track</p>
      <p style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: ${COLORS.black};">${params.trackTitle}</p>
      <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.gray}; text-transform: uppercase; letter-spacing: 0.5px;">Current Link</p>
      <p style="margin: 0; font-size: 14px; color: #ef4444; word-break: break-all;">${params.sourceUrl}</p>
    </div>
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray};">
      We've noticed that your track link appears to be broken, private, or unavailable. Reviewers are unable to listen to your track, which means reviews cannot be completed.
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray};">
      <strong>Common issues:</strong><br>
      • The track is set to private on SoundCloud/Bandcamp<br>
      • The track has been deleted or moved<br>
      • The link was copied incorrectly
    </p>
    ${emailButton("Update Track Link", trackPageUrl)}
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Once you update the link, your track will be automatically re-queued for review.
    </p>
  `;

  await sendEmail({
    to: params.to,
    subject: `⚠️ Action required: Fix your track link - ${params.trackTitle}`,
    html: emailWrapper(content),
  });
}

export async function sendTrialReminderEmail(params: {
  to: string;
  artistName: string;
}): Promise<boolean> {
  if (!params.to) return false;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: ${COLORS.lime}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Ready to get feedback?
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Submit your first track
    </h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Hey ${params.artistName}, you signed up for MixReflect but haven't submitted your track yet. We'd love to help you get real feedback on your music.
    </p>
    <div style="background-color: ${COLORS.lightGray}; border: 2px solid ${COLORS.black}; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
        <strong style="color: ${COLORS.black};">Here's what you'll get:</strong>
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: ${COLORS.gray};">
        <li>Detailed feedback from genre-matched listeners</li>
        <li>Honest first impressions and production notes</li>
        <li>Actionable suggestions to improve your track</li>
      </ul>
    </div>
    <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Submit any track — SoundCloud, Bandcamp, or YouTube link — and get real feedback within 24 hours.
    </p>
    ${emailButton("Submit Your Track", "https://mixreflect.com/artist/submit")}
    <div style="border-top: 1px solid ${COLORS.border}; padding-top: 16px; margin-top: 8px;">
      <p style="margin: 0; font-size: 13px; color: ${COLORS.gray}; text-align: center;">
        Honest feedback on your music from real listeners.
      </p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: "Ready to get feedback on your music?",
    html: emailWrapper(content),
  });
}

export async function sendLeadReminderEmail(params: {
  to: string;
  artistName?: string;
}): Promise<boolean> {
  if (!params.to) return false;

  const greeting = params.artistName ? `Hey ${params.artistName}` : "Hey there";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: ${COLORS.lime}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Still interested?
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Get feedback on your music
    </h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      ${greeting}, you started signing up for MixReflect but didn't finish. We'd love to help you get real feedback on your tracks.
    </p>
    <div style="background-color: ${COLORS.lightGray}; border: 2px solid ${COLORS.black}; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
        <strong style="color: ${COLORS.black};">MixReflect connects you with real listeners who:</strong>
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: ${COLORS.gray};">
        <li>Actually listen to your genre</li>
        <li>Give structured, honest feedback</li>
        <li>Help you understand what's working (and what's not)</li>
      </ul>
    </div>
    <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Sign up takes 30 seconds. Get real feedback from genre-matched listeners.
    </p>
    ${emailButton("Finish Signing Up", "https://mixreflect.com/signup")}
    <div style="border-top: 1px solid ${COLORS.border}; padding-top: 16px; margin-top: 8px;">
      <p style="margin: 0; font-size: 13px; color: ${COLORS.gray}; text-align: center;">
        Create an account and submit a track to get started.
      </p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: "Still want feedback on your music?",
    html: emailWrapper(content),
  });
}

// Preview functions - return HTML without sending
export function previewTrialReminderEmail(artistName: string): string {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: ${COLORS.lime}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Ready to get feedback?
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Submit your first track
    </h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Hey ${artistName}, you signed up for MixReflect but haven't submitted your track yet. We'd love to help you get real feedback on your music.
    </p>
    <div style="background-color: ${COLORS.lightGray}; border: 2px solid ${COLORS.black}; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
        <strong style="color: ${COLORS.black};">Here's what you'll get:</strong>
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: ${COLORS.gray};">
        <li>Detailed feedback from genre-matched listeners</li>
        <li>Honest first impressions and production notes</li>
        <li>Actionable suggestions to improve your track</li>
      </ul>
    </div>
    <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Submit any track — SoundCloud, Bandcamp, or YouTube link — and get real feedback within 24 hours.
    </p>
    ${emailButton("Submit Your Track", "https://mixreflect.com/artist/submit")}
    <div style="border-top: 1px solid ${COLORS.border}; padding-top: 16px; margin-top: 8px;">
      <p style="margin: 0; font-size: 13px; color: ${COLORS.gray}; text-align: center;">
        Honest feedback on your music from real listeners.
      </p>
    </div>
  `;

  return emailWrapper(content);
}

export function previewLeadReminderEmail(artistName?: string): string {
  const greeting = artistName ? `Hey ${artistName}` : "Hey there";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: ${COLORS.lime}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Still interested?
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Get feedback on your music
    </h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      ${greeting}, you started signing up for MixReflect but didn't finish. We'd love to help you get real feedback on your tracks.
    </p>
    <div style="background-color: ${COLORS.lightGray}; border: 2px solid ${COLORS.black}; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
        <strong style="color: ${COLORS.black};">MixReflect connects you with real listeners who:</strong>
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: ${COLORS.gray};">
        <li>Actually listen to your genre</li>
        <li>Give structured, honest feedback</li>
        <li>Help you understand what's working (and what's not)</li>
      </ul>
    </div>
    <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Sign up takes 30 seconds. Get real feedback from genre-matched listeners.
    </p>
    ${emailButton("Finish Signing Up", "https://mixreflect.com/signup")}
    <div style="border-top: 1px solid ${COLORS.border}; padding-top: 16px; margin-top: 8px;">
      <p style="margin: 0; font-size: 13px; color: ${COLORS.gray}; text-align: center;">
        Create an account and submit a track to get started.
      </p>
    </div>
  `;

  return emailWrapper(content);
}

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
      <div style="display: inline-block; background-color: ${COLORS.lime}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Purchase Complete
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Your download is ready!
    </h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      ${greeting}, thank you for supporting ${params.artistName} by purchasing "<strong>${params.trackTitle}</strong>".
    </p>
    <div style="background-color: ${COLORS.lightGray}; border: 2px solid ${COLORS.black}; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: ${COLORS.gray}; text-align: center;">
        Track
      </p>
      <p style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
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
        You can re-download anytime by visiting: <a href="${process.env.NEXT_PUBLIC_APP_URL}/purchases/${params.purchaseId}/download" style="color: ${COLORS.black};">your download page</a>
      </p>
    </div>
  `;

  await sendEmail({
    to: params.buyerEmail,
    subject: `Your download is ready: ${params.trackTitle}`,
    html: emailWrapper(content),
  });
}
