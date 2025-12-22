type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

async function sendEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Email not sent (missing RESEND_API_KEY or RESEND_FROM_EMAIL/RESEND_FROM)", {
        to,
        subject,
      });
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
    return;
  }
}

export async function sendTierChangeEmail(params: {
  to: string;
  newTier: string;
  newRateCents: number;
}) {
  if (!params.to) return;

  await sendEmail({
    to: params.to,
    subject: `You're now ${params.newTier} on MixReflect`,
    html: `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Tier upgrade</h2>
        <p style="margin: 0 0 12px;">Congrats — you’ve been upgraded to <strong>${params.newTier}</strong>.</p>
        <p style="margin: 0 0 12px;">New earning rate: <strong>$${(params.newRateCents / 100).toFixed(2)}</strong> per review.</p>
        <p style="margin: 0; color: #525252;">Keep submitting high-quality feedback to level up again.</p>
      </div>
    `.trim(),
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}) {
  if (!params.to) return;

  await sendEmail({
    to: params.to,
    subject: "Reset your MixReflect password",
    html: `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Reset your password</h2>
        <p style="margin: 0 0 12px;">We received a request to reset your password.</p>
        <p style="margin: 0 0 16px;"><a href="${params.resetUrl}" style="color: #111827;">Reset password</a></p>
        <p style="margin: 0; color: #525252;">If you didn't request this, you can ignore this email.</p>
      </div>
    `.trim(),
  });
}

export async function sendEmailVerificationEmail(params: {
  to: string;
  verifyUrl: string;
}) {
  if (!params.to) return;

  await sendEmail({
    to: params.to,
    subject: "Verify your MixReflect email",
    html: `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Verify your email</h2>
        <p style="margin: 0 0 12px;">Confirm your email address to finish setting up your account.</p>
        <p style="margin: 0 0 16px;"><a href="${params.verifyUrl}" style="color: #111827;">Verify email</a></p>
        <p style="margin: 0; color: #525252;">If you didn't create an account, you can ignore this email.</p>
      </div>
    `.trim(),
  });
}

export async function sendTrackQueuedEmail(artistEmail: string, trackTitle: string) {
  if (!artistEmail) return;

  await sendEmail({
    to: artistEmail,
    subject: `Your track is queued for review: ${trackTitle}`,
    html: `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Track queued</h2>
        <p style="margin: 0 0 12px;">Your track <strong>${trackTitle}</strong> has been queued for review.</p>
        <p style="margin: 0; color: #525252;">We'll email you when you hit key milestones (50% and 100% complete).</p>
      </div>
    `.trim(),
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

  await sendEmail({
    to: artistEmail,
    subject: isComplete
      ? `All reviews are in for: ${trackTitle}`
      : `Update: ${pct}% of reviews complete for ${trackTitle}`,
    html: `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Review progress</h2>
        <p style="margin: 0 0 12px;">Track: <strong>${trackTitle}</strong></p>
        <p style="margin: 0 0 12px;">Progress: <strong>${reviewCount}</strong> of <strong>${totalReviews}</strong> reviews completed (${pct}%).</p>
        <p style="margin: 0;">Log in to view feedback and rate reviews.</p>
      </div>
    `.trim(),
  });
}
