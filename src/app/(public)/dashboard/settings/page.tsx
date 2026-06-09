import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isScoreSubscribed } from "@/lib/score-subscription";
import { getScoreReviewerEarnings } from "@/lib/score-review";
import { Logo } from "@/components/ui/logo";
import { AccountSettingsForm } from "./account-settings-form";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/settings");

  const [user, subscribed] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, isScoreReviewer: true },
    }),
    isScoreSubscribed(session.user.email ?? ""),
  ]);

  const earnings = user?.isScoreReviewer
    ? await getScoreReviewerEarnings(session.user.id)
    : null;

  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <Link href="/dashboard" className={`${mono.className} text-[13px] text-white/65 hover:text-white transition-colors`}>
            ← dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-12">
        <p className={`${mono.className} text-[13px] text-white/55 mb-2`}>[ account ]</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] mb-10">settings</h1>

        <AccountSettingsForm
          email={user?.email ?? session.user.email ?? ""}
          initialName={user?.name ?? ""}
          subscribed={subscribed}
          isReviewer={!!user?.isScoreReviewer}
          earnings={earnings}
        />
      </div>
    </div>
  );
}
