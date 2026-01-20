import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountSettingsClient } from "@/components/account/account-settings-client";

export const dynamic = "force-dynamic";

export default async function ArtistAccountPage() {
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

  // Get artist profile with subscription info
  const artistProfile = session.user.isArtist
    ? await prisma.artistProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          subscriptionStatus: true,
          subscriptionTier: true,
          subscriptionCurrentPeriodEnd: true,
          subscriptionCanceledAt: true,
          totalTracks: true,
        },
      })
    : null;

  return (
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12 max-w-2xl">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight">Account</h1>
        <p className="mt-2 text-sm text-black/40">Profile, security, and support</p>
      </div>

      <AccountSettingsClient
        initialName={dbUser.name ?? ""}
        email={dbUser.email}
        isArtist={session.user.isArtist}
        isReviewer={session.user.isReviewer}
        hasPassword={Boolean(dbUser.password)}
        subscription={
          artistProfile
            ? {
                status: artistProfile.subscriptionStatus || null,
                tier: artistProfile.subscriptionTier || null,
                currentPeriodEnd: artistProfile.subscriptionCurrentPeriodEnd || null,
                canceledAt: artistProfile.subscriptionCanceledAt || null,
                totalTracks: artistProfile.totalTracks,
              }
            : null
        }
      />
    </div>
  );
}
