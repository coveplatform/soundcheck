import { COLORS, emailWrapper, emailButton, sendEmail } from "./templates";

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
