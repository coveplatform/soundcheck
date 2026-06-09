import { COLORS, getAppUrl, emailWrapper, emailButton, sendEmail } from "./templates";
import { PRO_MONTHLY_PRICE_DISPLAY, PRO_SALE_PRICE_DISPLAY, PRO_MONTHLY_CREDITS, PRO_ACTIVE_SLOTS, PRO_MAX_REVIEWS_PER_TRACK } from "@/lib/pricing";

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

  // Hero: 3 album covers on black — matches the discover page view.
  // Only 3 images to keep loading fast (+ 1 logo = 4 total images in email).
  const art = (n: number) => `${appUrl}/activity-artwork/${n}.jpg`;
  const heroSection = `
    <div style="margin-bottom: 24px; border-radius: 14px; overflow: hidden;">
      <a href="${discoverUrl}" style="display: block; text-decoration: none;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000000; border-radius: 14px;">
          <tr>
            <td style="padding: 40px 0; text-align: center; font-size: 0; line-height: 0;">
              <img src="${art(3)}" width="110" height="110" alt="" style="display: inline-block; width: 110px; height: 110px; object-fit: cover; border: 1px solid rgba(0,240,255,0.25); border-radius: 6px; margin: 0 6px; vertical-align: middle;" />
              <img src="${art(1)}" width="140" height="140" alt="" style="display: inline-block; width: 140px; height: 140px; object-fit: cover; border: 1px solid rgba(251,191,36,0.3); border-radius: 6px; margin: 0 6px; vertical-align: middle;" />
              <img src="${art(4)}" width="110" height="110" alt="" style="display: inline-block; width: 110px; height: 110px; object-fit: cover; border: 1px solid rgba(168,85,247,0.25); border-radius: 6px; margin: 0 6px; vertical-align: middle;" />
            </td>
          </tr>
        </table>
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

// ── Recapture / Win-back Email ──────────────────────────────────────────────
export function buildRecaptureEmail(params: { userName?: string }): { subject: string; html: string } {
  const name = params.userName ? params.userName.split(" ")[0] : null;
  const appUrl = getAppUrl();
  const dashboardUrl = `${appUrl}/classic/dashboard`;
  const submitUrl = `${appUrl}/submit`;

  const heroImageUrl = "https://www.mixreflect.com/blog/blog1.jpg";

  const content = `
    <!-- Hero image -->
    <div style="margin: -36px -36px 28px -36px;">
      <img
        src="${heroImageUrl}"
        alt=""
        width="520"
        style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 0;"
      />
    </div>

    <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.black}; line-height: 1.7;">
      ${name ? `Hey ${name},` : "Hey,"}
    </p>

    <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      It's been a while since you've been on MixReflect — wanted to check in.
    </p>

    <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      If you've got a track you're sitting on, this is a good time to get ears on it. You submit it, producers in your genre actually listen, and you get back honest feedback on what's working and what to fix. No fluff.
    </p>

    <!-- What's waiting for you -->
    <div style="background-color: #0a0a0a; border-radius: 14px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${COLORS.purple};">
        What's waiting for you
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; font-weight: 700; color: #ffffff; line-height: 1.4;">
        Real feedback from real producers:
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 8px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 44px; vertical-align: middle;">
                  <div style="font-size: 22px;">🎧</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Peer reviews</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">Producers who actually make music in your genre listen and score your track</div>
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
                <td style="width: 44px; vertical-align: middle;">
                  <div style="font-size: 22px;">📈</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Track of the Day</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">Top-reviewed track gets featured every day — your shot at a spotlight</div>
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
                <td style="width: 44px; vertical-align: middle;">
                  <div style="font-size: 22px;">✅</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Release Decision</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">10–12 expert reviewers tell you if your track is ready to release — and exactly what to fix if not</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- Free credits callout -->
    <div style="background-color: ${COLORS.purpleLight}; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; border-left: 4px solid ${COLORS.purple};">
      <p style="margin: 0 0 4px; font-size: 13px; font-weight: 800; color: ${COLORS.purple}; text-transform: uppercase; letter-spacing: 0.5px;">Gift for you</p>
      <p style="margin: 0; font-size: 15px; color: ${COLORS.black}; line-height: 1.6;">
        We've added <strong>5 free review credits</strong> to your account — already in there, no code needed. Use them to get feedback on your next track.
      </p>
    </div>

    <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      Your account is still here. Come back and submit something — takes two minutes to get it in the queue.
    </p>

    ${emailButton("Submit a track", submitUrl)}

    <p style="margin: 16px 0 0; font-size: 14px; color: ${COLORS.grayLight}; line-height: 1.7; text-align: center;">
      Or <a href="${dashboardUrl}" style="color: ${COLORS.purple}; text-decoration: none;">head to your dashboard</a> to pick up where you left off.
    </p>

    <p style="margin: 24px 0 0; font-size: 14px; color: ${COLORS.gray}; line-height: 1.7;">
      — The MixReflect team
    </p>
  `;

  return {
    subject: "5 free credits — and we want to hear your track",
    html: emailWrapper(content),
  };
}

export async function sendRecaptureEmail(params: { to: string; userName?: string }): Promise<boolean> {
  if (!params.to) return false;
  const { subject, html } = buildRecaptureEmail({ userName: params.userName });
  return sendEmail({ to: params.to, subject, html });
}

// ── Pro Sale Email ──────────────────────────────────────────────────────────
export function buildProSaleEmail(params: { userName?: string }): { subject: string; html: string } {
  const name = params.userName ? params.userName.split(" ")[0] : null;
  const appUrl = getAppUrl();
  const proUrl = `${appUrl}/pro`;

  const content = `
    <!-- Sale banner -->
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); border-radius: 14px; padding: 28px 24px; margin-bottom: 28px; text-align: center;">
      <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 20px; padding: 4px 14px; margin-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 1.5px;">Limited Time</span>
      </div>
      <p style="margin: 0 0 4px; font-size: 36px; font-weight: 900; color: #ffffff; line-height: 1; letter-spacing: -1px;">50% OFF</p>
      <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8); font-weight: 600;">MixReflect Pro — first month</p>
    </div>

    <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.black}; line-height: 1.7;">
      ${name ? `Hey ${name},` : "Hey,"}
    </p>

    <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      For a limited time, you can get your first month of <strong style="color: ${COLORS.black};">MixReflect Pro for ${PRO_SALE_PRICE_DISPLAY}</strong> — half the normal price.
    </p>

    <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      Pro is built for artists who are serious about getting better. You get ${PRO_MONTHLY_CREDITS} credits every month, priority placement in the review queue, up to ${PRO_ACTIVE_SLOTS} tracks in review at once, and up to ${PRO_MAX_REVIEWS_PER_TRACK} reviews per track — all without having to earn credits by reviewing others first.
    </p>

    <!-- What you get — dark card -->
    <div style="background-color: #0a0a0a; border-radius: 14px; padding: 24px; margin-bottom: 28px;">
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${COLORS.purple};">
        What's included
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; font-weight: 700; color: #ffffff; line-height: 1.4;">
        Everything in Pro:
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 8px;">
        <tr>
          <td style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
              <tr>
                <td style="width: 44px; vertical-align: middle;">
                  <div style="font-size: 22px;">🎟</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">${PRO_MONTHLY_CREDITS} credits every month</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">No reviewing required — just drop in and submit</div>
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
                <td style="width: 44px; vertical-align: middle;">
                  <div style="font-size: 22px;">⚡</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Priority queue placement</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">Your tracks go in front — faster turnaround, less waiting</div>
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
                <td style="width: 44px; vertical-align: middle;">
                  <div style="font-size: 22px;">🎛</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">${PRO_ACTIVE_SLOTS} active tracks at once</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">Run multiple tracks through review simultaneously</div>
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
                <td style="width: 44px; vertical-align: middle;">
                  <div style="font-size: 22px;">📊</div>
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Up to ${PRO_MAX_REVIEWS_PER_TRACK} reviews per track</div>
                  <div style="font-size: 12px; color: #737373; margin-top: 2px;">More ears, more consensus, stronger signal</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- Pricing callout -->
    <div style="background-color: ${COLORS.purpleLight}; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px; border-left: 4px solid ${COLORS.purple};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="vertical-align: middle;">
            <p style="margin: 0; font-size: 13px; font-weight: 700; color: ${COLORS.purple}; text-transform: uppercase; letter-spacing: 0.5px;">Sale price</p>
            <p style="margin: 4px 0 0; font-size: 28px; font-weight: 900; color: ${COLORS.black}; line-height: 1;">${PRO_SALE_PRICE_DISPLAY}<span style="font-size: 14px; font-weight: 600; color: ${COLORS.gray};">/first month</span></p>
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <p style="margin: 0; font-size: 13px; color: ${COLORS.grayLight}; text-decoration: line-through;">${PRO_MONTHLY_PRICE_DISPLAY}/mo</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: ${COLORS.gray};">then ${PRO_MONTHLY_PRICE_DISPLAY}/month · cancel anytime</p>
          </td>
        </tr>
      </table>
    </div>

    ${emailButton("Get Pro — 50% off →", proUrl)}

    <p style="margin: 20px 0 0; font-size: 14px; color: ${COLORS.grayLight}; line-height: 1.7;">
      — The MixReflect team
    </p>
  `;

  return {
    subject: "MixReflect Pro is 50% off — today only",
    html: emailWrapper(content),
  };
}

export async function sendProSaleEmail(params: { to: string; userName?: string }): Promise<boolean> {
  if (!params.to) return false;
  const { subject, html } = buildProSaleEmail({ userName: params.userName });
  return sendEmail({ to: params.to, subject, html });
}
