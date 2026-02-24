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

  // Visual hero that looks like the actual discover page
  const heroSection = `
    <div style="background-color: #050510; border-radius: 14px; overflow: hidden; margin-bottom: 24px;">
      <!-- Hero visual mimicking the 3D discover page -->
      <div style="padding: 40px 24px 32px; text-align: center; background: linear-gradient(180deg, #0a0a1a 0%, #050510 50%, #0a0520 100%);">
        <!-- Subtle branding -->
        <p style="margin: 0 0 16px; font-size: 10px; letter-spacing: 5px; color: #00e5ff; opacity: 0.5; text-transform: uppercase; font-family: monospace;">
          mixreflect
        </p>
        <!-- Big title -->
        <h2 style="margin: 0 0 8px; font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: -1px; line-height: 1;">
          WEEKLY
        </h2>
        <h2 style="margin: 0 0 20px; font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: -1px; line-height: 1;">
          DISCOVER
        </h2>
        <p style="margin: 0 0 24px; font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.5;">
          Explore music from independent artists around the world.
        </p>

        <!-- Floating "cards" visual - 3 sample tracks -->
        <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 20px;">
          <tr>
            <td style="width: 33%; padding: 0 4px; vertical-align: top;">
              <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid rgba(0,229,255,0.15); border-radius: 8px; padding: 12px 8px; text-align: center;">
                <div style="font-size: 20px; margin-bottom: 6px;">🎵</div>
                <div style="font-size: 10px; font-weight: 700; color: #ffffff; margin-bottom: 2px;">Neon Pulse</div>
                <div style="font-size: 9px; color: rgba(255,255,255,0.4);">Maya Kim</div>
                <div style="margin-top: 6px;">
                  <span style="display: inline-block; background: rgba(0,229,255,0.15); border: 1px solid rgba(0,229,255,0.25); border-radius: 10px; padding: 2px 6px; font-size: 8px; color: #00e5ff;">Electronic</span>
                </div>
              </div>
            </td>
            <td style="width: 33%; padding: 0 4px; vertical-align: top;">
              <div style="background: linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 100%); border: 1px solid rgba(147,51,234,0.2); border-radius: 8px; padding: 12px 8px; text-align: center; transform: translateY(-4px);">
                <div style="font-size: 20px; margin-bottom: 6px;">⭐</div>
                <div style="font-size: 10px; font-weight: 700; color: #ffffff; margin-bottom: 2px;">Golden Hour</div>
                <div style="font-size: 9px; color: rgba(255,255,255,0.4);">James Cole</div>
                <div style="margin-top: 6px;">
                  <span style="display: inline-block; background: rgba(251,191,36,0.15); border: 1px solid rgba(251,191,36,0.3); border-radius: 10px; padding: 2px 6px; font-size: 8px; color: #fbbf24;">Featured</span>
                </div>
              </div>
            </td>
            <td style="width: 33%; padding: 0 4px; vertical-align: top;">
              <div style="background: linear-gradient(135deg, #1a1a2e 0%, #1e3a2f 100%); border: 1px solid rgba(16,185,129,0.15); border-radius: 8px; padding: 12px 8px; text-align: center;">
                <div style="font-size: 20px; margin-bottom: 6px;">🎧</div>
                <div style="font-size: 10px; font-weight: 700; color: #ffffff; margin-bottom: 2px;">City Rain</div>
                <div style="font-size: 9px; color: rgba(255,255,255,0.4);">DJ Nova</div>
                <div style="margin-top: 6px;">
                  <span style="display: inline-block; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.25); border-radius: 10px; padding: 2px 6px; font-size: 8px; color: #10b981;">Lo-Fi</span>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Stats bar mimicking the real one -->
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="padding: 6px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;">
              <span style="font-size: 10px; letter-spacing: 2px; color: rgba(255,255,255,0.5); font-family: monospace; text-transform: uppercase;">
                12,847 plays &nbsp;·&nbsp; 342 reviews &nbsp;·&nbsp; 4.2 avg &nbsp;·&nbsp; 34 tracks
              </span>
            </td>
          </tr>
        </table>

        <!-- Benefit pills -->
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 16px auto 0;">
          <tr>
            <td style="padding: 0 4px;">
              <span style="display: inline-block; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 4px 10px; font-size: 9px; color: rgba(255,255,255,0.6);">
                <span style="color: #00e5ff;">●</span> Expert reviews
              </span>
            </td>
            <td style="padding: 0 4px;">
              <span style="display: inline-block; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 4px 10px; font-size: 9px; color: rgba(255,255,255,0.6);">
                <span style="color: #a855f7;">●</span> Real listeners
              </span>
            </td>
            <td style="padding: 0 4px;">
              <span style="display: inline-block; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 4px 10px; font-size: 9px; color: rgba(255,255,255,0.6);">
                <span style="color: #ec4899;">●</span> Grow your audience
              </span>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  const content = `
    <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.black}; line-height: 1.7;">
      ${name ? `Hey ${name},` : "Hey,"}
    </p>

    <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      We just launched something new — <strong style="color: ${COLORS.black};">Weekly Discover</strong>.
    </p>

    <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      Every week, we curate a collection of tracks from independent artists on MixReflect. Explore them in an immersive 3D experience — click any track to listen, and see what other artists in the community are creating.
    </p>

    <!-- Visual hero showing what it actually looks like -->
    ${heroSection}

    <!-- What you can do -->
    <div style="background-color: #0a0a0a; border-radius: 14px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${COLORS.purple};">
        How it works
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; font-weight: 700; color: #ffffff; line-height: 1.4;">
        Explore, listen, get discovered:
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 8px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 50px; vertical-align: middle;">
                  <div style="font-size: 18px; font-weight: 800; color: #00e5ff;">1</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Drag to explore</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">Browse floating track cards in a 3D space — scroll to zoom, drag to orbit</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 8px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 50px; vertical-align: middle;">
                  <div style="font-size: 18px; font-weight: 800; color: ${COLORS.purple};">2</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Click to listen</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">Tap any card to play it instantly — SoundCloud, Spotify, and YouTube embedded</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 50px; vertical-align: middle;">
                  <div style="font-size: 18px; font-weight: 800; color: ${COLORS.amber};">3</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Get featured</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">Upload your own music — top-rated tracks get the gold spotlight in next week's discover</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 6px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      This week's collection is live now. Go explore — and if you like what you hear, upload your own track. It's free.
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
