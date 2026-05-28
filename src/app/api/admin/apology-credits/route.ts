import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailWrapper, emailButton, getAppUrl, COLORS, sendEmail } from "@/lib/email/templates";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

const RECIPIENTS = [
  { email: "raun.alex@gmail.com", name: "Alex" },
  { email: "kevin@kevinlint.com", name: "Kevin" },
  { email: "kashvidolly@gmail.com", name: "Dolly" },
  { email: "minesvaztorres@gmail.com", name: "Inês" },
  { email: "hellabammer@gmail.com", name: null },
  { email: "mors.vevo@gmail.com", name: "Norman" },
  { email: "adamastramusic@gmail.com", name: "Adam" },
  { email: "ingridaliciarose@gmail.com", name: "Ingrid" },
  { email: "eufiggy@gmail.com", name: "Figgy" },
  { email: "oliver.lardner@monash.edu", name: "Oliver" },
  { email: "loomisbuckbee@gmail.com", name: "Loomis" },
  { email: "pistisloves10@gmail.com", name: "Pistis" },
  { email: "chamelbenali76@gmail.com", name: "Chamel" },
  { email: "kh2007220229@gmail.com", name: null },
];

const CREDITS_TO_GRANT = 3;

function buildApologyEmail(firstName: string | null): string {
  const appUrl = getAppUrl();
  const name = firstName || "there";

  const content = `
    <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800; color: ${COLORS.black}; line-height: 1.2;">
      Hey ${name} — sorry about that.
    </h1>
    <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      We had a brief server issue around the time you signed up to MixReflect. Some new accounts weren't set up correctly as a result — and yours may have been affected.
    </p>
    <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.gray}; line-height: 1.7;">
      We've sorted it and topped your account up with <strong style="color: ${COLORS.black};">3 free credits</strong> as an apology. Each credit gets you one structured review back on a track — scores, written feedback, and a release verdict from a real artist.
    </p>

    <div style="background-color: ${COLORS.bg}; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td>
            <p style="margin: 0; font-size: 14px; color: ${COLORS.gray};">Credits added to your account</p>
          </td>
          <td style="text-align: right;">
            <p style="margin: 0; font-size: 22px; font-weight: 800; color: ${COLORS.purple};">+${CREDITS_TO_GRANT}</p>
          </td>
        </tr>
      </table>
    </div>

    ${emailButton("Submit your first track →", `${appUrl}/submit`)}

    <p style="margin: 16px 0 0; font-size: 13px; color: ${COLORS.grayLight}; text-align: center;">
      Or <a href="${appUrl}/review" style="color: ${COLORS.gray}; font-weight: 600;">review a track</a> to earn even more credits.
    </p>

    <p style="margin: 24px 0 0; font-size: 13px; color: ${COLORS.grayLight}; line-height: 1.6;">
      Really sorry for the friction — we want MixReflect to be a smooth experience from day one. If you have any issues at all, just reply to this email.
    </p>
    <p style="margin: 16px 0 0; font-size: 13px; color: ${COLORS.grayLight};">
      — Kris, MixReflect
    </p>
  `;

  return emailWrapper(content);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results: { email: string; status: string; error?: string }[] = [];

    for (const recipient of RECIPIENTS) {
      try {
        // Find the user
        const user = await prisma.user.findUnique({
          where: { email: recipient.email },
          select: {
            id: true,
            name: true,
            ArtistProfile: { select: { id: true, reviewCredits: true } },
          },
        });

        if (!user) {
          results.push({ email: recipient.email, status: "not_found" });
          continue;
        }

        if (!user.ArtistProfile) {
          results.push({ email: recipient.email, status: "no_profile" });
          continue;
        }

        // Grant credits
        await prisma.artistProfile.update({
          where: { id: user.ArtistProfile.id },
          data: { reviewCredits: { increment: CREDITS_TO_GRANT } },
        });

        // Use name from our list, fall back to DB name, then null
        const firstName = recipient.name || (user.name ? user.name.split(" ")[0] : null);

        // Send apology email
        await sendEmail({
          to: recipient.email,
          subject: "Sorry about that — here are 3 free credits from us",
          html: buildApologyEmail(firstName),
        });

        results.push({ email: recipient.email, status: "sent" });
      } catch (err) {
        results.push({ email: recipient.email, status: "error", error: err instanceof Error ? err.message : "Unknown" });
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "error").length;
    const notFound = results.filter((r) => r.status === "not_found" || r.status === "no_profile").length;

    return NextResponse.json({ success: true, sent, failed, notFound, results });
  } catch (error) {
    console.error("Apology credits error:", error);
    return NextResponse.json({ error: "Failed", details: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
