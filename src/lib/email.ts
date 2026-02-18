type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  required?: boolean;
};

// Admin notification email
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "kris.engelhardt4@gmail.com";

// Resolve app URL with fallback chain (NEXT_PUBLIC_APP_URL is undefined on server)
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.mixreflect.com"
  );
}

// Brand colors - match current MixReflect UI
export const COLORS = {
  black: "#0a0a0a",
  white: "#ffffff",
  purple: "#9333ea",
  purpleDark: "#7c3aed",
  purpleLight: "#f3e8ff",
  gray: "#525252",
  grayLight: "#a3a3a3",
  bg: "#faf8f5",
  cardBg: "#ffffff",
  border: "#e5e5e5",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
};

// Inline SVG logo for emails (purple rounded rect with white audio bars)
const EMAIL_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="32" height="32" style="display:block;width:32px;height:32px;"><rect x="10" y="10" width="180" height="180" rx="40" ry="40" fill="#9333ea"/><g fill="white"><rect x="42" y="78" width="16" height="44" rx="3"/><rect x="68" y="55" width="16" height="90" rx="3"/><rect x="94" y="38" width="16" height="124" rx="3"/><rect x="120" y="62" width="16" height="76" rx="3"/><rect x="146" y="82" width="16" height="36" rx="3"/></g></svg>`;

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
<body style="margin: 0; padding: 0; background-color: ${COLORS.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${COLORS.bg};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Logo -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px;">
          <tr>
            <td align="center" style="padding: 0 0 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    ${EMAIL_LOGO_SVG}
                  </td>
                  <td style="vertical-align: middle; padding-left: 10px;">
                    <span style="font-size: 20px; letter-spacing: -0.5px; color: ${COLORS.black};"><strong style="font-weight: 800;">Mix</strong><span style="font-weight: 400; color: ${COLORS.grayLight};">Reflect</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Main card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: ${COLORS.white}; border-radius: 16px; overflow: hidden;">
          <!-- Content -->
          <tr>
            <td style="padding: 36px 36px 32px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px;">
          <tr>
            <td style="padding: 24px 0 8px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: ${COLORS.grayLight};">
                Sent by <a href="${getAppUrl()}" style="color: ${COLORS.gray}; text-decoration: none; font-weight: 600;">MixReflect</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: ${COLORS.grayLight};">
                Questions? <a href="mailto:support@mixreflect.com" style="color: ${COLORS.gray}; text-decoration: none;">support@mixreflect.com</a>
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
              <td style="background-color: ${isPrimary ? COLORS.purple : COLORS.white}; border-radius: 10px; padding: 14px 32px;${!isPrimary ? ` border: 1px solid ${COLORS.border};` : ''}">
                <a href="${url}" style="color: ${isPrimary ? COLORS.white : COLORS.black}; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">${text}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

// Reusable badge/tag component
function emailBadge(text: string, color: string = COLORS.purple): string {
  return `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; background-color: ${color}; padding: 6px 14px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
        ${text}
      </div>
    </div>
  `;
}

// Reusable info card
function emailCard(content: string): string {
  return `
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      ${content}
    </div>
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
      <div style="display: inline-block; background-color: ${COLORS.purple}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
        Level Up!
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      You're now ${params.newTier}
    </h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Congratulations! Your consistent high-quality reviews have earned you a tier upgrade.
    </p>
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 14px; color: ${COLORS.gray};">New earning rate</p>
      <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${COLORS.purple};">$${(params.newRateCents / 100).toFixed(2)}</p>
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

export async function sendFinishLaterEmail(params: {
  to: string;
  resumeUrl: string;
}) {
  if (!params.to) return;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: ${COLORS.purple}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
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
      <div style="display: inline-block; background-color: ${COLORS.purple}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
        Track Submitted
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Your track is in the queue
    </h1>
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase; letter-spacing: 0.5px;">Track</p>
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
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 4px; margin-bottom: 24px;">
      <div style="background-color: ${isComplete ? COLORS.green : COLORS.purple}; height: 20px; width: ${pct}%; border-radius: 10px;"></div>
    </div>
  `;

  const content = isComplete
    ? `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: ${COLORS.green}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
          Complete!
        </div>
      </div>
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
        All reviews are in!
      </h1>
      <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase; letter-spacing: 0.5px;">Track</p>
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${COLORS.black};">${trackTitle}</p>
      </div>
      ${progressBar}
      <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
        <strong>${reviewCount} of ${totalReviews}</strong> reviews completed
      </p>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
        Your feedback is ready! Log in to read all reviews and rate them.
      </p>
      ${emailButton("View Your Reviews", `${getAppUrl()}/dashboard`)}
    `
    : `
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
        Review progress update
      </h1>
      <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase; letter-spacing: 0.5px;">Track</p>
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${COLORS.black};">${trackTitle}</p>
      </div>
      ${progressBar}
      <p style="margin: 0 0 24px; font-size: 18px; line-height: 1.6; color: ${COLORS.black}; text-align: center; font-weight: 700;">
        ${pct}% complete — ${reviewCount} of ${totalReviews} reviews
      </p>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
        Reviews are coming in! You can already view completed reviews in your dashboard.
      </p>
      ${emailButton("View Progress", `${getAppUrl()}/dashboard`, "secondary")}
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

export async function sendInvalidTrackLinkEmail(params: {
  to: string;
  trackTitle: string;
  trackId: string;
  sourceUrl: string;
}) {
  if (!params.to) return;

  const trackPageUrl = `${getAppUrl()}/tracks/${params.trackId}`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: #ef4444; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
        Action Required
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Your track link needs attention
    </h1>
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase; letter-spacing: 0.5px;">Track</p>
      <p style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: ${COLORS.black};">${params.trackTitle}</p>
      <p style="margin: 0 0 4px; font-size: 12px; color: ${COLORS.grayLight}; text-transform: uppercase; letter-spacing: 0.5px;">Current Link</p>
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
      <div style="display: inline-block; background-color: ${COLORS.purple}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
        Ready to get feedback?
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Submit your first track
    </h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Hey ${params.artistName}, you signed up for MixReflect but haven't submitted your track yet. We'd love to help you get real feedback on your music.
    </p>
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
        <strong style="color: ${COLORS.black};">Here's what you'll get:</strong>
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: ${COLORS.gray};">
        <li>Detailed feedback from genre-matched listeners</li>
        <li>Honest first impressions and production notes</li>
        <li>Actionable suggestions to improve your track</li>
      </ul>
    </div>
    ${emailButton("Submit Your Track", `${getAppUrl()}/submit`)}
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
      <div style="display: inline-block; background-color: ${COLORS.purple}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
        Still interested?
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Get feedback on your music
    </h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      ${greeting}, you started signing up for MixReflect but didn't finish. We'd love to help you get real feedback on your tracks.
    </p>
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
        <strong style="color: ${COLORS.black};">MixReflect connects you with real listeners who:</strong>
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: ${COLORS.gray};">
        <li>Actually listen to your genre</li>
        <li>Give structured, honest feedback</li>
        <li>Help you understand what's working (and what's not)</li>
      </ul>
    </div>
    ${emailButton("Finish Signing Up", `${getAppUrl()}/signup`)}
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
      <div style="display: inline-block; background-color: ${COLORS.purple}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
        Ready to get feedback?
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Submit your first track
    </h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      Hey ${artistName}, you signed up for MixReflect but haven't submitted your track yet. We'd love to help you get real feedback on your music.
    </p>
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
        <strong style="color: ${COLORS.black};">Here's what you'll get:</strong>
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: ${COLORS.gray};">
        <li>Detailed feedback from genre-matched listeners</li>
        <li>Honest first impressions and production notes</li>
        <li>Actionable suggestions to improve your track</li>
      </ul>
    </div>
    ${emailButton("Submit Your Track", `${getAppUrl()}/submit`)}
  `;

  return emailWrapper(content);
}

export function previewLeadReminderEmail(artistName?: string): string {
  const greeting = artistName ? `Hey ${artistName}` : "Hey there";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: ${COLORS.purple}; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
        Still interested?
      </div>
    </div>
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      Get feedback on your music
    </h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      ${greeting}, you started signing up for MixReflect but didn't finish. We'd love to help you get real feedback on your tracks.
    </p>
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
        <strong style="color: ${COLORS.black};">MixReflect connects you with real listeners who:</strong>
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: ${COLORS.gray};">
        <li>Actually listen to your genre</li>
        <li>Give structured, honest feedback</li>
        <li>Help you understand what's working (and what's not)</li>
      </ul>
    </div>
    ${emailButton("Finish Signing Up", `${getAppUrl()}/signup`)}
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

export async function sendReleaseDecisionReport(params: {
  artistEmail: string;
  artistName: string;
  trackTitle: string;
  trackId: string;
  report: any;
}) {
  if (!params.artistEmail) return;

  const { verdict, readinessScore, topFixes, aiAnalysis } = params.report;

  const verdictColor =
    verdict.consensus === "RELEASE_NOW" ? "#10b981" :
    verdict.consensus === "FIX_FIRST" ? "#f59e0b" : "#ef4444";

  const verdictText =
    verdict.consensus === "RELEASE_NOW" ? "✅ RELEASE NOW" :
    verdict.consensus === "FIX_FIRST" ? "⚠️ FIX FIRST" : "🔧 NEEDS WORK";

  const trackUrl = `${getAppUrl()}/artist/tracks/${params.trackId}`;

  const fixesHtml = topFixes && topFixes.length > 0 ? `
    <h3 style="margin: 24px 0 16px; font-size: 18px; font-weight: 700; color: ${COLORS.black};">
      🔧 Top Fixes (Prioritized)
    </h3>
    ${topFixes.slice(0, 3).map((fix: any, i: number) => `
      <div style="background-color: ${COLORS.bg}; border-left: 4px solid ${fix.avgImpact === 'HIGH' ? '#ef4444' : fix.avgImpact === 'MEDIUM' ? '#f59e0b' : '#10b981'}; padding: 16px; margin-bottom: 12px; border-radius: 0 10px 10px 0;">
        <p style="margin: 0 0 6px; font-size: 16px; font-weight: 700; color: ${COLORS.black};">
          ${i + 1}. ${fix.issue}
        </p>
        <p style="margin: 0; font-size: 13px; color: ${COLORS.gray};">
          ${fix.mentionedBy}/${params.report.reviewCount} reviewers •
          <span style="color: ${fix.avgImpact === 'HIGH' ? '#ef4444' : fix.avgImpact === 'MEDIUM' ? '#f59e0b' : '#10b981'}; font-weight: 600;">
            ${fix.avgImpact} IMPACT
          </span> • ~${fix.avgTimeEstimate} min
        </p>
      </div>
    `).join('')}
  ` : '';

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: #7c3aed; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
        Release Decision Report
      </div>
    </div>
    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: ${COLORS.black}; text-align: center;">
      ${params.trackTitle}
    </h1>
    <p style="margin: 0 0 24px; font-size: 14px; color: ${COLORS.gray}; text-align: center;">
      ${params.report.reviewCount} expert reviewers have spoken
    </p>

    <div style="background-color: ${verdictColor}; padding: 20px; margin-bottom: 24px; text-align: center; border-radius: 12px;">
      <h2 style="margin: 0; font-size: 28px; font-weight: 900; color: white;">
        ${verdictText}
      </h2>
      <p style="margin: 8px 0 0; font-size: 13px; color: rgba(255,255,255,0.9);">
        ${verdict.breakdown.RELEASE_NOW} Release • ${verdict.breakdown.FIX_FIRST} Fix First • ${verdict.breakdown.NEEDS_WORK} Needs Work
      </p>
    </div>

    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 14px; color: ${COLORS.gray}; text-transform: uppercase;">
        READINESS SCORE
      </p>
      <p style="margin: 0; font-size: 56px; font-weight: 900; color: #7c3aed; line-height: 1;">
        ${readinessScore.average}/100
      </p>
    </div>

    ${fixesHtml}

    <div style="background-color: #faf5ff; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #7c3aed;">
        📊 Summary
      </h3>
      <p style="margin: 0 0 12px; font-size: 14px; color: #374151; line-height: 1.6;">
        ${aiAnalysis.summary}
      </p>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">
        <strong>Work Required:</strong> ${aiAnalysis.estimatedWorkRequired}
      </p>
    </div>

    ${emailButton("View Full Report", trackUrl)}

    <p style="margin: 24px 0 0; font-size: 13px; color: ${COLORS.gray}; text-align: center;">
      Generated from ${params.report.reviewCount} expert reviewers
    </p>
  `;

  await sendEmail({
    to: params.artistEmail,
    subject: `Release Decision: "${params.trackTitle}" - ${verdictText}`,
    html: emailWrapper(content),
  });
}

// ── Announcement / Blast Email ──────────────────────────────────────────────
export function buildAnnouncementEmail(params: { userName?: string }): { subject: string; html: string } {
  const greeting = params.userName ? `Hey ${params.userName}` : "Hey there";
  const appUrl = getAppUrl();

  // Repeating "new" ticker — mimics the landing page Caveat font banner
  const tickerWords = Array.from({ length: 30 }).map(() => "new").join("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
  const ticker = `
    <div style="background-color: rgba(168,85,247,0.1); padding: 10px 0; margin: 0 0 24px; overflow: hidden; text-align: center;">
      <div style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 700; color: ${COLORS.purpleDark}; white-space: nowrap; letter-spacing: 2px; opacity: 0.7;">
        ${tickerWords}
      </div>
    </div>
  `;

  const content = `
    ${ticker}

    <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 800; color: ${COLORS.black}; text-align: center; letter-spacing: -0.5px;">
      Big updates on MixReflect
    </h1>
    <p style="margin: 0 0 28px; font-size: 15px; color: ${COLORS.gray}; text-align: center;">
      ${greeting}, we've been shipping. Here's what's new.
    </p>

    <!-- Feature 1: Sell Your Music -->
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: ${COLORS.black};">
        🎵 Sell your music directly
      </h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
        Every track now gets its own public page. Share it anywhere — when someone buys through your link, you keep <strong style="color: ${COLORS.black};">85% of the sale</strong>. No middlemen.
      </p>
    </div>

    <!-- Feature 2: Release Decision -->
    <div style="background-color: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #ffffff;">
        🎯 Release Decision Reports
      </h3>
      <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #a3a3a3;">
        Should you release this track? Get a clear <strong style="color: #ffffff;">Go/No-Go verdict</strong> from 10-12 expert reviewers, a readiness score out of 100, and your top 3 fixes ranked by impact — all for $9.95.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="background-color: rgba(255,255,255,0.06); border-radius: 8px; padding: 10px; text-align: center; width: 33%;">
            <div style="font-size: 11px; color: #737373; text-transform: uppercase;">Verdict</div>
            <div style="font-size: 14px; font-weight: 800; color: #34d399;">RELEASE</div>
          </td>
          <td width="8"></td>
          <td style="background-color: rgba(255,255,255,0.06); border-radius: 8px; padding: 10px; text-align: center; width: 33%;">
            <div style="font-size: 11px; color: #737373; text-transform: uppercase;">Score</div>
            <div style="font-size: 14px; font-weight: 800; color: ${COLORS.purpleDark};">0–100</div>
          </td>
          <td width="8"></td>
          <td style="background-color: rgba(255,255,255,0.06); border-radius: 8px; padding: 10px; text-align: center; width: 33%;">
            <div style="font-size: 11px; color: #737373; text-transform: uppercase;">Fixes</div>
            <div style="font-size: 14px; font-weight: 800; color: ${COLORS.amber};">Top 3</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Feature 3: Discover & Public Pages -->
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: ${COLORS.black};">
        🌍 Discover page & public track pages
      </h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
        Your music is now discoverable. Listeners can browse by genre, play tracks, and buy directly. Every track you upload gets its own shareable page.
      </p>
    </div>

    <!-- Feature 4: Earn Money Reviewing -->
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: ${COLORS.black};">
        💰 Earn money reviewing
      </h3>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
        Hit Verified Reviewer status (25+ reviews, 4.5+ rating) and earn <strong style="color: ${COLORS.black};">$1.50 per review</strong>. Cash out anytime via Stripe.
      </p>
    </div>

    ${emailButton("Check it out", appUrl)}

    <p style="margin: 24px 0 0; font-size: 13px; color: ${COLORS.grayLight}; text-align: center;">
      Thanks for being an early user. We're building this for artists like you.
    </p>
  `;

  return {
    subject: "What's new on MixReflect — sell tracks, release decisions & more",
    html: emailWrapper(content),
  };
}

export async function sendAnnouncementEmail(params: { to: string; userName?: string }): Promise<boolean> {
  if (!params.to) return false;
  const { subject, html } = buildAnnouncementEmail({ userName: params.userName });
  return sendEmail({ to: params.to, subject, html });
}
