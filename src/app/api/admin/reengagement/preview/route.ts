import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { previewTrialReminderEmail, previewLeadReminderEmail } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let html: string;

    if (type === "trial") {
      html = previewTrialReminderEmail("Demo Artist");
    } else if (type === "lead") {
      html = previewLeadReminderEmail("Demo Artist");
    } else {
      return NextResponse.json({ error: "Invalid type. Use ?type=trial or ?type=lead" }, { status: 400 });
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Email preview error:", error);
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
