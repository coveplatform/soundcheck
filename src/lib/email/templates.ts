type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  required?: boolean;
};

// Admin notification email
export const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "kris.engelhardt4@gmail.com";

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

// Hosted PNG logo for emails (Gmail strips inline SVGs)
const EMAIL_LOGO_URL = `${getAppUrl()}/email-logo.png`;

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
                    <img src="${EMAIL_LOGO_URL}" alt="MixReflect" width="32" height="32" style="display:block;width:32px;height:32px;border-radius:8px;" />
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
export function emailBadge(text: string, color: string = COLORS.purple): string {
  return `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; background-color: ${color}; padding: 6px 14px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; border-radius: 6px;">
        ${text}
      </div>
    </div>
  `;
}

// Reusable info card
export function emailCard(content: string): string {
  return `
    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      ${content}
    </div>
  `;
}

export async function sendEmail({ to, subject, html, required }: SendEmailParams): Promise<boolean> {
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
