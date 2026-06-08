import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getScoreReviewerEarnings } from "@/lib/score-review";
import { sendEmail, ADMIN_EMAIL, emailWrapper } from "@/lib/email";

/** A score reviewer requests a payout once they've cleared the threshold. */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const earnings = await getScoreReviewerEarnings(session.user.id);
    if (!earnings.canPayout) {
      return NextResponse.json(
        { error: "You haven't reached the $10 payout threshold yet." },
        { status: 400 }
      );
    }

    const dollars = (earnings.cents / 100).toFixed(2);
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Payout request — $${dollars} (score reviewer)`,
      html: emailWrapper(
        `<p style="color:#fff">Score-reviewer payout request</p>
         <p style="color:#bbb">Reviewer: <b>${session.user.email}</b><br/>
         Completed reviews: <b>${earnings.completed}</b><br/>
         Amount: <b>$${dollars}</b></p>`
      ),
    });

    return NextResponse.json({ ok: true, amount: dollars });
  } catch (error) {
    console.error("Score payout request error:", error);
    return NextResponse.json({ error: "Failed to request payout" }, { status: 500 });
  }
}
