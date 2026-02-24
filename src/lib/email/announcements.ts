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

  // Hero section using the actual album artwork from the discover page,
  // positioned on a black background to match the real 3D space view.
  const art = (n: number) => `${appUrl}/activity-artwork/${n}.jpg`;
  const heroSection = `
    <div style="margin-bottom: 24px; border-radius: 14px; overflow: hidden;">
      <a href="${discoverUrl}" style="display: block; text-decoration: none;">
        <div style="background-color: #000000; position: relative; width: 100%; padding: 0;">
          <!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#000000;"><tr><td><![endif]-->

          <!-- Row 1: far away (small) -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000000;">
            <tr>
              <td style="padding: 20px 0 6px; text-align: center; font-size: 0; line-height: 0;">
                <img src="${art(15)}" width="32" height="32" alt="" style="display: inline-block; width: 32px; height: 32px; object-fit: cover; border: 1px solid rgba(0,240,255,0.15); border-radius: 3px; margin: 0 18px; opacity: 0.3;" />
                <img src="${art(22)}" width="28" height="28" alt="" style="display: inline-block; width: 28px; height: 28px; object-fit: cover; border: 1px solid rgba(168,85,247,0.12); border-radius: 3px; margin: 0 14px; opacity: 0.25;" />
                <img src="${art(8)}" width="30" height="30" alt="" style="display: inline-block; width: 30px; height: 30px; object-fit: cover; border: 1px solid rgba(255,45,155,0.12); border-radius: 3px; margin: 0 20px; opacity: 0.25;" />
                <img src="${art(30)}" width="26" height="26" alt="" style="display: inline-block; width: 26px; height: 26px; object-fit: cover; border: 1px solid rgba(0,240,255,0.1); border-radius: 3px; margin: 0 16px; opacity: 0.2;" />
              </td>
            </tr>
          </table>

          <!-- Row 2: mid distance -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000000;">
            <tr>
              <td style="padding: 8px 0; text-align: center; font-size: 0; line-height: 0;">
                <img src="${art(12)}" width="48" height="48" alt="" style="display: inline-block; width: 48px; height: 48px; object-fit: cover; border: 1px solid rgba(255,45,155,0.2); border-radius: 4px; margin: 0 10px; opacity: 0.45;" />
                <img src="${art(6)}" width="42" height="42" alt="" style="display: inline-block; width: 42px; height: 42px; object-fit: cover; border: 1px solid rgba(0,240,255,0.18); border-radius: 4px; margin: 0 22px; opacity: 0.4;" />
                <img src="${art(19)}" width="44" height="44" alt="" style="display: inline-block; width: 44px; height: 44px; object-fit: cover; border: 1px solid rgba(168,85,247,0.18); border-radius: 4px; margin: 0 12px; opacity: 0.4;" />
                <img src="${art(25)}" width="40" height="40" alt="" style="display: inline-block; width: 40px; height: 40px; object-fit: cover; border: 1px solid rgba(16,185,129,0.15); border-radius: 4px; margin: 0 18px; opacity: 0.35;" />
              </td>
            </tr>
          </table>

          <!-- Row 3: FOREGROUND (large, prominent — the main visual) -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000000;">
            <tr>
              <td style="padding: 10px 0; text-align: center; font-size: 0; line-height: 0;">
                <img src="${art(3)}" width="78" height="78" alt="" style="display: inline-block; width: 78px; height: 78px; object-fit: cover; border: 1px solid rgba(0,240,255,0.3); border-radius: 5px; margin: 0 8px; opacity: 0.85;" />
                <img src="${art(1)}" width="100" height="100" alt="" style="display: inline-block; width: 100px; height: 100px; object-fit: cover; border: 1px solid rgba(251,191,36,0.35); border-radius: 5px; margin: 0 8px; opacity: 0.95;" />
                <img src="${art(4)}" width="82" height="82" alt="" style="display: inline-block; width: 82px; height: 82px; object-fit: cover; border: 1px solid rgba(168,85,247,0.3); border-radius: 5px; margin: 0 8px; opacity: 0.85;" />
              </td>
            </tr>
          </table>

          <!-- Row 4: mid-lower -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000000;">
            <tr>
              <td style="padding: 8px 0; text-align: center; font-size: 0; line-height: 0;">
                <img src="${art(9)}" width="46" height="46" alt="" style="display: inline-block; width: 46px; height: 46px; object-fit: cover; border: 1px solid rgba(0,240,255,0.18); border-radius: 4px; margin: 0 14px; opacity: 0.4;" />
                <img src="${art(14)}" width="50" height="50" alt="" style="display: inline-block; width: 50px; height: 50px; object-fit: cover; border: 1px solid rgba(255,45,155,0.18); border-radius: 4px; margin: 0 10px; opacity: 0.42;" />
                <img src="${art(21)}" width="44" height="44" alt="" style="display: inline-block; width: 44px; height: 44px; object-fit: cover; border: 1px solid rgba(168,85,247,0.15); border-radius: 4px; margin: 0 16px; opacity: 0.38;" />
              </td>
            </tr>
          </table>

          <!-- Row 5: far bottom -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000000;">
            <tr>
              <td style="padding: 6px 0 20px; text-align: center; font-size: 0; line-height: 0;">
                <img src="${art(27)}" width="30" height="30" alt="" style="display: inline-block; width: 30px; height: 30px; object-fit: cover; border: 1px solid rgba(16,185,129,0.12); border-radius: 3px; margin: 0 20px; opacity: 0.25;" />
                <img src="${art(33)}" width="34" height="34" alt="" style="display: inline-block; width: 34px; height: 34px; object-fit: cover; border: 1px solid rgba(0,240,255,0.12); border-radius: 3px; margin: 0 14px; opacity: 0.28;" />
                <img src="${art(10)}" width="28" height="28" alt="" style="display: inline-block; width: 28px; height: 28px; object-fit: cover; border: 1px solid rgba(168,85,247,0.1); border-radius: 3px; margin: 0 18px; opacity: 0.22;" />
              </td>
            </tr>
          </table>

          <!--[if mso]></td></tr></table><![endif]-->
        </div>
      </a>
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
