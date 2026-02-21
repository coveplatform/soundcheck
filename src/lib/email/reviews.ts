import { COLORS, getAppUrl, emailWrapper, emailButton, emailBadge, sendEmail } from "./templates";

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

export async function sendListenerIntentEmail(params: {
  artistEmail: string;
  trackTitle: string;
  trackId: string;
  reviewCount: number;
  playlistPct: number | null;
  sharePct: number | null;
  followPct: number | null;
  listenAgainPct: number | null;
}) {
  if (!params.artistEmail) return;

  const { trackTitle, trackId, reviewCount, playlistPct, sharePct, followPct, listenAgainPct } = params;
  const trackUrl = `${getAppUrl()}/tracks/${trackId}?tab=stats`;

  function intentStat(label: string, pct: number | null): string {
    if (pct === null) return "";
    const isPositive = pct >= 50;
    const color = isPositive ? COLORS.purple : COLORS.grayLight;
    return `
      <td style="width: 25%; padding: 0 6px; text-align: center; vertical-align: top;">
        <div style="background-color: ${isPositive ? "#f3e8ff" : COLORS.bg}; border-radius: 12px; padding: 16px 8px;">
          <p style="margin: 0 0 4px; font-size: 28px; font-weight: 800; color: ${color}; line-height: 1;">${pct}%</p>
          <p style="margin: 0; font-size: 11px; color: ${COLORS.grayLight}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${label}</p>
        </div>
      </td>
    `;
  }

  const statsRow = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        ${intentStat("Playlist", playlistPct)}
        ${intentStat("Share", sharePct)}
        ${intentStat("Follow", followPct)}
        ${intentStat("Replay", listenAgainPct)}
      </tr>
    </table>
  `;

  // Pick the most compelling stat for the subject line
  const topStat = [
    { label: "would add to a playlist", pct: playlistPct },
    { label: "would share it", pct: sharePct },
    { label: "would follow you", pct: followPct },
    { label: "would listen again", pct: listenAgainPct },
  ]
    .filter((s) => s.pct !== null)
    .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))[0];

  const subjectStat = topStat ? ` — ${topStat.pct}% ${topStat.label}` : "";

  const content = `
    ${emailBadge("Listener Intent Unlocked", COLORS.purple)}
    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800; color: ${COLORS.black}; text-align: center; line-height: 1.2;">
      Your listener data is ready
    </h1>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: ${COLORS.gray}; text-align: center;">
      <strong>${reviewCount} producers</strong> have reviewed <em>${trackTitle}</em>.<br>Here's how they'd actually act on it:
    </p>
    ${statsRow}
    <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.6; color: ${COLORS.grayLight}; text-align: center;">
      More reviews = more reliable signal. Keep the momentum going.
    </p>
    ${emailButton("See Full Breakdown", trackUrl)}
  `;

  await sendEmail({
    to: params.artistEmail,
    subject: `🎧 ${reviewCount} producers reviewed "${trackTitle}"${subjectStat}`,
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

  const trackUrl = `${getAppUrl()}/tracks/${params.trackId}`;

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
