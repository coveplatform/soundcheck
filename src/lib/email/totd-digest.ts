import { COLORS, getAppUrl, emailWrapper, emailButton, sendEmail } from "./templates";

export type TotdPick = {
  title: string;
  artistName: string;
  genre: string | null;
  editorNote: string;
  artworkUrl?: string | null;
};

export async function sendTotdWeeklyEmail(params: {
  to: string;
  picks: TotdPick[];
  weekLabel: string; // e.g. "May 19–25"
}) {
  const { picks, weekLabel } = params;
  const appUrl = getAppUrl();

  if (picks.length === 0) return;

  const pickRows = picks.map((pick, i) => {
    const genrePill = pick.genre
      ? `<span style="display: inline-block; background-color: ${COLORS.bg}; border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 700; color: ${COLORS.gray}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">${pick.genre}</span>`
      : "";

    return `
      <div style="margin-bottom: 28px; padding-bottom: 28px; ${i < picks.length - 1 ? `border-bottom: 1px solid ${COLORS.border};` : ""}">
        <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: ${COLORS.grayLight}; text-transform: uppercase; letter-spacing: 1px;">
          ${String(i + 1).padStart(2, "0")}
        </p>
        <h2 style="margin: 0 0 2px; font-size: 20px; font-weight: 800; color: ${COLORS.black}; line-height: 1.2;">
          ${pick.title}
        </h2>
        <p style="margin: 0 0 10px; font-size: 13px; color: ${COLORS.gray}; font-weight: 600;">
          ${pick.artistName}
        </p>
        ${genrePill}
        <p style="margin: 0; font-size: 14px; color: ${COLORS.gray}; line-height: 1.7; font-style: italic;">
          "${pick.editorNote}"
        </p>
      </div>
    `;
  }).join("");

  const headerImageUrl = `${appUrl}/blog/blog3.jpg`;

  const content = `
    <img src="${headerImageUrl}" alt="" width="520" style="display: block; width: 100%; max-width: 520px; height: 220px; object-fit: cover; border-radius: 12px; margin-bottom: 24px;" />
    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: ${COLORS.purple}; text-transform: uppercase; letter-spacing: 1px;">
      Track of the Week
    </p>
    <h1 style="margin: 0 0 6px; font-size: 26px; font-weight: 800; color: ${COLORS.black}; line-height: 1.2;">
      ${picks.length} tracks worth your ears
    </h1>
    <p style="margin: 0 0 28px; font-size: 14px; color: ${COLORS.gray};">
      ${weekLabel} · Voted to the top by the MixReflect community
    </p>

    ${pickRows}

    ${emailButton("Listen on MixReflect →", `${appUrl}/today`)}

    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 18px; margin-top: 24px; text-align: center;">
      <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: ${COLORS.black};">
        Want your track featured?
      </p>
      <p style="margin: 0 0 12px; font-size: 13px; color: ${COLORS.gray}; line-height: 1.6;">
        Submit your track to the daily chart. The top track each day earns the featured spot.
      </p>
      <a href="${appUrl}/submit" style="font-size: 13px; font-weight: 700; color: ${COLORS.purple}; text-decoration: none;">
        Submit a track →
      </a>
    </div>

    <p style="margin: 24px 0 0; font-size: 12px; color: ${COLORS.grayLight}; text-align: center;">
      — Kris &amp; the MixReflect team
    </p>
  `;

  await sendEmail({
    to: params.to,
    subject: `This week's picks: ${picks.slice(0, 2).map(p => `"${p.title}"`).join(", ")}${picks.length > 2 ? ` + ${picks.length - 2} more` : ""}`,
    html: emailWrapper(content),
  });
}
