type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  required?: boolean;
};

// Brand colors
const COLORS = {
  black: "#000000",
  white: "#ffffff",
  lime: "#84cc16",
  gray: "#525252",
  lightGray: "#f5f5f5",
  border: "#e5e5e5",
};

// Base email wrapper template
function emailWrapper(content: string): string {
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
                    <!-- Logo with inline SVG waveform -->
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle;">
                          <!--[if mso]>
                          <v:rect xmlns:v="urn:schemas-microsoft-com:vml" style="width:36px;height:36px;" fillcolor="#000000" stroked="false">
                            <v:textbox inset="0,0,0,0"></v:textbox>
                          </v:rect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <img src="https://mixreflect.com/icon.svg" alt="MixReflect" width="36" height="36" style="display: block; border: 0; width: 36px; height: 36px;" />
                          <!--<![endif]-->
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

// Reusable button component - centered by default
function emailButton(text: string, url: string, variant: "primary" | "secondary" = "primary"): string {
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

async function sendEmail({ to, subject, html, required }: SendEmailParams) {
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
    return;
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
    return;
  }
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
