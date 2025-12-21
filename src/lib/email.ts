type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

async function sendEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM;

  if (!apiKey || !from) {
    return;
  }

  await fetch("https://api.resend.com/emails", {
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
