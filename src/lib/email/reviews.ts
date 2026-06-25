import { COLORS, getAppUrl, emailWrapper, emailButton, sendEmail } from "./templates";

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
      Your verdict is ready in your report. Now your track is in front of a room of real, genre-matched listeners.
    </p>
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.gray};">
      <strong>What happens next:</strong><br>
      We'll email you as the room lands — updates at the halfway mark and once everyone's in. Most rooms fill within 24 hours.
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
  totalReviews: number,
  trackId?: string
) {
  if (!artistEmail) return;

  const pct = Math.round((reviewCount / Math.max(1, totalReviews)) * 100);
  const isComplete = reviewCount >= totalReviews;
  const trackUrl = trackId ? `${getAppUrl()}/tracks/${trackId}` : `${getAppUrl()}/classic/dashboard`;
  const moreReviewsUrl = trackId ? `${getAppUrl()}/tracks/${trackId}/request-reviews` : null;

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
        Your room is in!
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
        The room has weighed in alongside your verdict. Log in to read every reaction and rate them.
      </p>
      ${emailButton("Read the room", trackUrl)}
      ${moreReviewsUrl ? `
      <p style="margin: 24px 0 8px; font-size: 14px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
        Want even more perspectives on your track?
      </p>
      ${emailButton("Get More Reviews", moreReviewsUrl, "secondary")}
      ` : ""}
      <div style="margin-top: 32px; padding-top: 32px; border-top: 2px solid ${COLORS.bg};">
        <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: ${COLORS.black}; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">
          Working on something new?
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
          Submit your next track while the feedback is fresh. Review one track to earn a credit — then you're in the queue.
        </p>
        ${emailButton("Submit Your Next Track", `${getAppUrl()}/submit`, "secondary")}
      </div>
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
      ${emailButton("View Progress", trackUrl, "secondary")}
    `;

  await sendEmail({
    to: artistEmail,
    subject: isComplete
      ? `✅ All reviews are in for: ${trackTitle}`
      : `📊 ${pct}% complete: ${trackTitle}`,
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
