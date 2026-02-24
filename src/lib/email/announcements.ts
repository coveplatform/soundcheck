import { COLORS, getAppUrl, emailWrapper, emailButton, sendEmail } from "./templates";

// ── Announcement / Blast Email ──────────────────────────────────────────────
export function buildAnnouncementEmail(params: { userName?: string }): { subject: string; html: string } {
  const name = params.userName ? params.userName.split(" ")[0] : null;
  const appUrl = getAppUrl();
  const rdUrl = `${appUrl}/submit?package=release-decision`;

  // Personal, text-forward email — reads like a founder update so Gmail
  // treats it as a conversation rather than a promotion.
  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.black}; line-height: 1.7;">
      ${name ? `Hey ${name},` : "Hey,"}
    </p>

    <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      Quick update — we just shipped something I think you'll find useful.
    </p>

    <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      It's called <strong style="color: ${COLORS.black};">Release Decision</strong>. The idea is simple: you upload a track, and a panel of 10–12 expert reviewers listens to it and tells you whether it's ready to release — and if not, exactly what to fix first.
    </p>

    <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      We built it because we kept seeing the same problem. Artists finish a track, think it sounds good, but don't have anyone they trust to give them a straight answer. Friends say it's great. Forums give vague advice. So we made a way to get a real, structured verdict from people who know what they're listening for.
    </p>

    <!-- What you get — dark card, mobile-friendly stacked layout -->
    <div style="background-color: #0a0a0a; border-radius: 14px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${COLORS.purple};">
        What you get back
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; font-weight: 700; color: #ffffff; line-height: 1.4;">
        A full report delivered to your inbox within 24 hours:
      </p>

      <!-- Row 1: Verdict -->
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 8px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 50px; vertical-align: middle;">
                  <div style="font-size: 18px; font-weight: 800; color: #34d399;">GO</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Clear verdict</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">Release, Fix First, or Needs Work</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Row 2: Score -->
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 8px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 50px; vertical-align: middle;">
                  <div style="font-size: 18px; font-weight: 800; color: ${COLORS.purple};">82</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Readiness score</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">0–100 based on expert consensus</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Row 3: Fixes -->
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 50px; vertical-align: middle;">
                  <div style="font-size: 18px; font-weight: 800; color: ${COLORS.amber};">3</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Top fixes ranked by impact</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">With time estimates so you know what to tackle first</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Also includes -->
      <div style="font-size: 13px; color: #a3a3a3; line-height: 1.8;">
        Also includes: strongest elements, biggest risks, and genre benchmarking.
      </div>
    </div>

    <p style="margin: 0 0 6px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      If you've got a track you're sitting on and you're not sure if it's ready — this is what it's for.
    </p>

    ${emailButton("Try it out", rdUrl)}

    <p style="margin: 24px 0 0; font-size: 14px; color: ${COLORS.gray}; line-height: 1.7;">
      — The MixReflect team
    </p>
  `;

  return {
    subject: "We just shipped something new",
    html: emailWrapper(content),
  };
}

export async function sendAnnouncementEmail(params: { to: string; userName?: string }): Promise<boolean> {
  if (!params.to) return false;
  const { subject, html } = buildAnnouncementEmail({ userName: params.userName });
  return sendEmail({ to: params.to, subject, html });
}

// ── Daily Chart Announcement ──────────────────────────────────────────────
export function buildChartAnnouncementEmail(params: { userName?: string }): { subject: string; html: string } {
  const name = params.userName ? params.userName.split(" ")[0] : null;
  const appUrl = getAppUrl();
  const chartUrl = `${appUrl}/charts`;

  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.black}; line-height: 1.7;">
      ${name ? `Hey ${name},` : "Hey,"}
    </p>

    <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      We just launched something new — <strong style="color: ${COLORS.black};">the Daily Chart</strong>.
    </p>

    <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      Every day, artists submit a track. The community listens and votes. The #1 track gets featured for 24 hours — guaranteed visibility, no gatekeepers, no playlist curators. Just your music vs. everyone else's.
    </p>

    <!-- How it works card -->
    <div style="background-color: #0a0a0a; border-radius: 14px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${COLORS.amber};">
        How it works
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; font-weight: 700; color: #ffffff; line-height: 1.4;">
        Three steps to the top:
      </p>

      <!-- Step 1 -->
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 8px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 50px; vertical-align: middle;">
                  <div style="font-size: 18px; font-weight: 800; color: ${COLORS.purple};">1</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Submit your track</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">Free users: once per week. Pro: every day.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Step 2 -->
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 8px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 50px; vertical-align: middle;">
                  <div style="font-size: 18px; font-weight: 800; color: ${COLORS.amber};">2</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Get votes</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">Share your chart link. Listeners vote after 30 seconds.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Step 3 -->
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 50px; vertical-align: middle;">
                  <div style="font-size: 18px; font-weight: 800; color: ${COLORS.green};">3</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Win the day</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">#1 track is featured on the chart for the next 24 hours.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 6px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      The chart resets every day at midnight UTC. Today's chart is live now — go claim the #1 spot.
    </p>

    ${emailButton("Enter today's chart", chartUrl)}

    <p style="margin: 24px 0 0; font-size: 14px; color: ${COLORS.gray}; line-height: 1.7;">
      — The MixReflect team
    </p>
  `;

  return {
    subject: "New: Daily Chart — get your track to #1",
    html: emailWrapper(content),
  };
}

export async function sendChartAnnouncementEmail(params: { to: string; userName?: string }): Promise<boolean> {
  if (!params.to) return false;
  const { subject, html } = buildChartAnnouncementEmail({ userName: params.userName });
  return sendEmail({ to: params.to, subject, html });
}

// ── Weekly Discover Announcement ──────────────────────────────────────────────
export function buildDiscoverAnnouncementEmail(params: { userName?: string }): { subject: string; html: string } {
  const name = params.userName ? params.userName.split(" ")[0] : null;
  const appUrl = getAppUrl();
  const discoverUrl = `${appUrl}/discover`;

  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.black}; line-height: 1.7;">
      ${name ? `Hey ${name},` : "Hey,"}
    </p>

    <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      We just launched something new — <strong style="color: ${COLORS.black};">Weekly Discover</strong>.
    </p>

    <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      Every week, we curate a collection of tracks from independent artists on MixReflect. You can explore them in an immersive 3D experience — listen, discover new music, and see what other artists in the community are creating.
    </p>

    <!-- What's inside — dark card -->
    <div style="background-color: #0a0a0a; border-radius: 14px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${COLORS.purple};">
        What's inside
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; font-weight: 700; color: #ffffff; line-height: 1.4;">
        A new way to explore music on MixReflect:
      </p>

      <!-- Row 1: Curated tracks -->
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 8px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 50px; vertical-align: middle;">
                  <div style="font-size: 18px; font-weight: 800; color: #00e5ff;">🎵</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Curated weekly picks</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">Fresh tracks from artists in the community, updated every week</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Row 2: Listen instantly -->
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 8px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 50px; vertical-align: middle;">
                  <div style="font-size: 18px; font-weight: 800; color: ${COLORS.purple};">▶</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Listen right in your browser</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">Embedded players for SoundCloud, Spotify, and YouTube — no tab switching</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Row 3: Get featured -->
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 50px; vertical-align: middle;">
                  <div style="font-size: 18px; font-weight: 800; color: ${COLORS.amber};">⭐</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Get your track featured</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">Upload your music to MixReflect and it could appear in next week's discover</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Also -->
      <div style="font-size: 13px; color: #a3a3a3; line-height: 1.8;">
        Expert reviews · Real listener feedback · Grow your audience
      </div>
    </div>

    <p style="margin: 0 0 6px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      This week's collection is live now. Go explore — and if you like what you hear, consider uploading your own track. It's free to get started.
    </p>

    ${emailButton("Explore Weekly Discover", discoverUrl)}

    <p style="margin: 24px 0 0; font-size: 14px; color: ${COLORS.gray}; line-height: 1.7;">
      — The MixReflect team
    </p>
  `;

  return {
    subject: "New: Weekly Discover — explore music from the community",
    html: emailWrapper(content),
  };
}

export async function sendDiscoverAnnouncementEmail(params: { to: string; userName?: string }): Promise<boolean> {
  if (!params.to) return false;
  const { subject, html } = buildDiscoverAnnouncementEmail({ userName: params.userName });
  return sendEmail({ to: params.to, subject, html });
}
