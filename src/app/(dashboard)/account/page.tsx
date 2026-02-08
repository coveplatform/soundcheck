import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountSettingsClient } from "@/components/account/account-settings-client";
import { ReviewerGenrePreferences } from "@/components/account/reviewer-genre-preferences";

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
  const reviewerProfile = await prisma.listenerProfile.findUnique({
    where: { userId: session.user.id },
    select: { genres: { select: { id: true } } },
  });

  // Get artist profile for credit balance and subscription info
  const artistProfile = await (prisma.artistProfile as any).findUnique({
    where: { userId: session.user.id },
    select: {
      artistName: true,
      subscriptionStatus: true,
      subscriptionTier: true,
      subscriptionCurrentPeriodEnd: true,
      subscriptionCanceledAt: true,
      totalTracks: true,
      reviewCredits: true,
    },
  } as any);

  const initialGenreIds = (reviewerProfile?.genres ?? []).map((g) => g.id);
  const isReviewer = Boolean(reviewerProfile);

  return (
    <div className="pt-14 sm:pt-16 px-4 sm:px-6 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Account</h1>
          <p className="mt-2 text-sm text-black/40">Profile, credits, and settings</p>
        </div>

        <div className="space-y-6">
          {isReviewer && (
            <ReviewerGenrePreferences initialGenreIds={initialGenreIds} />
          )}

          <AccountSettingsClient
            initialName={dbUser.name ?? ""}
            artistName={artistProfile?.artistName ?? null}
            email={dbUser.email}
            hasPassword={Boolean(dbUser.password)}
            reviewCredits={artistProfile?.reviewCredits ?? 0}
            subscription={
              artistProfile
                ? ({
                    status: artistProfile.subscriptionStatus || null,
                    tier: artistProfile.subscriptionTier || null,
                    currentPeriodEnd: artistProfile.subscriptionCurrentPeriodEnd || null,
                    canceledAt: artistProfile.subscriptionCanceledAt || null,
                    totalTracks: artistProfile.totalTracks,
                  } as any)
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
