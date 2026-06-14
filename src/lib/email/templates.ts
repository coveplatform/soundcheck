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
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ];
  const prod = candidates.find((u) => u && !u.includes("localhost"));
  return prod ?? "https://www.mixreflect.com";
}

// Brand colors — the new dark MixReflect UI (icy cyan on near-black).
// NOTE: the token NAMES are kept (black/white/purple/bg…) so the dozens of
// call sites across the email modules don't need touching — only their VALUES
// flip. The names are now semantic, not literal:
//   black  = primary (near-white) text          white  = card surface
//   purple = brand accent (cyan)                bg     = raised panel surface
//   gray   = body text          grayLight = muted text   border = hairline
export const COLORS = {
  black: "#f4f4ef", // primary text (near-white) — was the dark heading colour
  white: "#0e0e0e", // main content card surface
  purple: "#6ee7ff", // brand accent (cyan) — keep key name to avoid mass edits
  purpleDark: "#22d3ee",
  purpleLight: "#0d2a31", // accent-tinted callout panel (dark teal)
  gray: "#a7a7a2", // body text
  grayLight: "#6f6f6a", // muted text
  bg: "#161616", // raised panel surface (sits on the card)
  cardBg: "#0e0e0e",
  border: "#262626", // hairline dividers on dark
  green: "#7cffc4",
  amber: "#f5b14f",
  red: "#ff7a90",
};

// Darkest surface — the email page background, behind the content card.
const PAGE_BG = "#0a0a0a";

// Hardcoded production URL — logo must be publicly reachable in emails regardless of env vars
const EMAIL_LOGO_URL = "https://www.mixreflect.com/email-logo.png";

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
<body style="margin: 0; padding: 0; background-color: ${PAGE_BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${PAGE_BG}" style="background-color: ${PAGE_BG};">
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
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${COLORS.white}" style="max-width: 520px; background-color: ${COLORS.white}; border: 1px solid ${COLORS.border}; border-radius: 16px; overflow: hidden;">
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
  // Primary: solid cyan with near-black ink (the brand CTA). Secondary: a raised
  // dark panel with a hairline border and near-white ink.
  const bg = isPrimary ? COLORS.purple : COLORS.bg;
  const ink = isPrimary ? PAGE_BG : COLORS.black;
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td bgcolor="${bg}" style="background-color: ${bg}; border-radius: 8px; padding: 14px 32px;${!isPrimary ? ` border: 1px solid ${COLORS.border};` : ''}">
                <a href="${url}" style="color: ${ink}; text-decoration: none; font-weight: 800; font-size: 14px; display: inline-block;">${text}</a>
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
      <div style="display: inline-block; background-color: ${color}; padding: 6px 14px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${PAGE_BG}; border-radius: 6px;">
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
