import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountSettingsClient } from "@/components/account/account-settings-client";
import { ReviewerGenrePreferences } from "@/components/account/reviewer-genre-preferences";
import { ReferralCard } from "@/components/referral/referral-card";
import { SparklesDoodle } from "@/components/dashboard/doodles";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, password: true },
  });

  if (!dbUser?.email) {
    redirect("/login");
  }

  // Get listener profile with genres (for reviewer genre preferences)
  const reviewerProfile = await prisma.reviewerProfile.findUnique({
    where: { userId: session.user.id },
    select: { Genre: { select: { id: true } } },
  });

  // Get artist profile for credit balance
  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      artistName: true,
      reviewCredits: true,
    },
  });

  const initialGenreIds = (reviewerProfile?.Genre ?? []).map((g) => g.id);
  const isReviewer = Boolean(reviewerProfile);

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative overflow-hidden">
          <SparklesDoodle className="absolute -bottom-4 left-[42%] w-20 h-20 text-purple-400/20 pointer-events-none" />
          <div className="relative">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
              Account.
            </h1>
            <p className="text-sm text-black/40 font-medium mt-3">
              Manage your profile, credits, and preferences.
            </p>
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-6">
          <ReferralCard />

          {isReviewer && (
            <ReviewerGenrePreferences initialGenreIds={initialGenreIds} />
          )}

          <AccountSettingsClient
            initialName={dbUser.name ?? ""}
            artistName={artistProfile?.artistName ?? null}
            email={dbUser.email}
            hasPassword={Boolean(dbUser.password)}
            reviewCredits={artistProfile?.reviewCredits ?? 0}
          />
        </div>
      </div>
    </div>
  );
}
